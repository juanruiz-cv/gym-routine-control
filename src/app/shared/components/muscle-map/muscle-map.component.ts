import { Component, input, computed, inject, signal, afterRenderEffect, DestroyRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { MuscleGroup, MUSCLE_GROUP_VIEW, MUSCLE_SVG_IDS, MUSCLE_LABELS } from '@shared/models/muscle-anatomy';

@Component({
  selector: 'app-muscle-map',
  standalone: true,
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-col md:flex-row gap-4 md:gap-6 justify-center">
        @if (showFront()) {
          <div class="flex-1 max-w-[200px] md:max-w-[240px] mx-auto">
            <div class="text-[10px] text-on-surface-muted text-center mb-1">Vista Frontal</div>
            <div class="rounded-2xl bg-surface-card border border-border p-2" [innerHTML]="frontSvg()"></div>
          </div>
        }
        @if (showBack()) {
          <div class="flex-1 max-w-[200px] md:max-w-[240px] mx-auto">
            <div class="text-[10px] text-on-surface-muted text-center mb-1">Vista Trasera</div>
            <div class="rounded-2xl bg-surface-card border border-border p-2" [innerHTML]="backSvg()"></div>
          </div>
        }
      </div>

      <!-- Tooltip -->
      @if (tooltip().visible) {
        <div
          class="fixed z-[100] px-2.5 py-1.5 bg-surface-elevated border border-border rounded-xl text-xs text-on-surface shadow-lg pointer-events-none transition-opacity duration-150"
          [style.left.px]="tooltip().x"
          [style.top.px]="tooltip().y"
        >{{ tooltip().text }}</div>
      }

      <!-- Legend -->
      @if (mode() === 'heatmap') {
        <div class="flex items-center justify-center gap-4 text-[10px] text-on-surface-muted">
          <span>Menos</span>
          <span class="w-4 h-4 rounded" style="background:#2a2a38"></span>
          <span class="w-4 h-4 rounded" style="background:rgba(249,115,22,0.25)"></span>
          <span class="w-4 h-4 rounded" style="background:rgba(249,115,22,0.50)"></span>
          <span class="w-4 h-4 rounded" style="background:rgba(249,115,22,0.75)"></span>
          <span class="w-4 h-4 rounded" style="background:#f97316"></span>
          <span>Mas</span>
        </div>
      } @else {
        <div class="flex items-center justify-center gap-4 text-[10px] text-on-surface-muted">
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-sm" style="background:#f97316"></span>
            Primario
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-sm" style="background:rgba(249,115,22,0.45)"></span>
            Secundario
          </span>
        </div>
      }
    </div>
  `,
})
export class MuscleMapComponent {
  private readonly _sanitizer = inject(DomSanitizer);
  private readonly _http = inject(HttpClient);
  private readonly _destroyRef = inject(DestroyRef);

  readonly primaryMuscles = input<MuscleGroup[]>([]);
  readonly secondaryMuscles = input<MuscleGroup[]>([]);
  readonly heatmapData = input<Record<string, number>>({});
  readonly mode = input<'heatmap' | 'highlight'>('highlight');

  readonly frontSvg = signal<SafeHtml>('');
  readonly backSvg = signal<SafeHtml>('');
  readonly tooltip = signal<{ text: string; x: number; y: number; visible: boolean }>({ text: '', x: 0, y: 0, visible: false });

  private _listeners: (() => void)[] = [];

  readonly showFront = computed(() => {
    if (this.mode() === 'heatmap') return true;
    const all = [...this.primaryMuscles(), ...this.secondaryMuscles()];
    return all.some(m => MUSCLE_GROUP_VIEW[m] === 'front' || MUSCLE_GROUP_VIEW[m] === 'both');
  });

  readonly showBack = computed(() => {
    if (this.mode() === 'heatmap') return true;
    const all = [...this.primaryMuscles(), ...this.secondaryMuscles()];
    return all.some(m => MUSCLE_GROUP_VIEW[m] === 'back' || MUSCLE_GROUP_VIEW[m] === 'both');
  });

  constructor() {
    const sub = this._http.get('assets/anatomy/male-front.svg', { responseType: 'text' }).subscribe({
      next: (svg) => this.frontSvg.set(this._sanitizer.bypassSecurityTrustHtml(svg)),
    });
    this._destroyRef.onDestroy(() => sub.unsubscribe());

    const sub2 = this._http.get('assets/anatomy/male-back.svg', { responseType: 'text' }).subscribe({
      next: (svg) => this.backSvg.set(this._sanitizer.bypassSecurityTrustHtml(svg)),
    });
    this._destroyRef.onDestroy(() => sub2.unsubscribe());

    afterRenderEffect(() => {
      void this.frontSvg();
      void this.backSvg();
      this._applyColors();
      this._attachTooltips();
    });

    this._destroyRef.onDestroy(() => {
      this._removeListeners();
    });
  }

  private _removeListeners(): void {
    for (const remove of this._listeners) remove();
    this._listeners = [];
  }

  private _attachTooltips(): void {
    this._removeListeners();
    document.querySelectorAll('path[id]').forEach(el => {
      const path = el as SVGPathElement;
      const id = path.id;
      const muscle = this._findMuscleBySvgId(id);

      const enter = (e: MouseEvent) => {
        if (!muscle) return;
        const label = MUSCLE_LABELS[muscle] ?? id;
        let text: string;
        if (this.mode() === 'heatmap') {
          const data = this.heatmapData();
          const value = data[muscle] ?? 0;
          text = `${label} \u00B7 ${Math.round(value)}%`;
        } else {
          const role = this.primaryMuscles().includes(muscle) ? 'Primario' : 'Secundario';
          text = `${label} \u00B7 ${role}`;
        }
        this.tooltip.set({ text, x: e.clientX + 12, y: e.clientY + 12, visible: true });
      };

      const move = (e: MouseEvent) => {
        this.tooltip.update(t => ({ ...t, x: e.clientX + 12, y: e.clientY + 12 }));
      };

      const leave = () => {
        this.tooltip.update(t => ({ ...t, visible: false }));
      };

      path.addEventListener('mouseenter', enter);
      path.addEventListener('mousemove', move);
      path.addEventListener('mouseleave', leave);
      this._listeners.push(() => {
        path.removeEventListener('mouseenter', enter);
        path.removeEventListener('mousemove', move);
        path.removeEventListener('mouseleave', leave);
      });
    });
  }

  private _findMuscleBySvgId(svgId: string): MuscleGroup | null {
    for (const [key, ids] of Object.entries(MUSCLE_SVG_IDS)) {
      if (ids.includes(svgId)) return key as MuscleGroup;
    }
    return null;
  }

  private _applyColors(): void {
    if (this.mode() === 'heatmap') {
      this._applyHeatmap();
    } else {
      this._applyHighlight();
    }
  }

  private _applyHeatmap(): void {
    const data = this.heatmapData();
    const max = Math.max(...Object.values(data), 1);
    for (const [muscle, ids] of Object.entries(MUSCLE_SVG_IDS)) {
      const value = data[muscle] ?? 0;
      const pct = value / max;
      let fillColor: string;
      if (pct <= 0) fillColor = '#2a2a38';
      else if (pct < 0.25) fillColor = 'rgba(249,115,22,0.25)';
      else if (pct < 0.5) fillColor = 'rgba(249,115,22,0.50)';
      else if (pct < 0.75) fillColor = 'rgba(249,115,22,0.75)';
      else fillColor = '#f97316';
      for (const svgId of ids) {
        const el = document.getElementById(svgId);
        if (el) el.setAttribute('fill', fillColor);
      }
    }
  }

  private _applyHighlight(): void {
    const primary = new Set(this.primaryMuscles());
    const secondary = new Set(this.secondaryMuscles());

    for (const [muscle, ids] of Object.entries(MUSCLE_SVG_IDS)) {
      let fillColor: string;
      if (primary.has(muscle as MuscleGroup)) fillColor = '#f97316';
      else if (secondary.has(muscle as MuscleGroup)) fillColor = 'rgba(249,115,22,0.45)';
      else fillColor = '#2a2a38';
      for (const svgId of ids) {
        const el = document.getElementById(svgId);
        if (el) el.setAttribute('fill', fillColor);
      }
    }
  }
}
