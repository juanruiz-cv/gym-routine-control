import { Component, input, output, computed } from '@angular/core';
import { LucideCheckCircle, LucideAlertCircle, LucideAlertTriangle, LucideInfo, LucideX } from '@lucide/angular';

type ToastType = 'success' | 'error' | 'warning' | 'info';
type ToastPosition = 'top' | 'bottom';

@Component({
  selector: 'app-ui-toast',
  standalone: true,
  imports: [LucideCheckCircle, LucideAlertCircle, LucideAlertTriangle, LucideInfo, LucideX],
  template: `
    @if (visible()) {
      <div [class]="positionClasses()" class="fixed left-4 right-4 z-[200] flex justify-center pointer-events-none">
        <div role="alert" class="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-xl pointer-events-auto max-w-md w-full animate-slide-up" [class]="typeClasses()">
          @switch (type()) {
            @case ('success') { <svg lucideCheckCircle class="w-5 h-5 text-success" strokeWidth="2" aria-hidden="true"></svg> }
            @case ('error') { <svg lucideAlertCircle class="w-5 h-5 text-error" strokeWidth="2" aria-hidden="true"></svg> }
            @case ('warning') { <svg lucideAlertTriangle class="w-5 h-5 text-warning" strokeWidth="2" aria-hidden="true"></svg> }
            @default { <svg lucideInfo class="w-5 h-5 text-info" strokeWidth="2" aria-hidden="true"></svg> }
          }
          <p class="flex-1 text-sm font-medium text-on-surface">{{ message() }}</p>
          <button (click)="dismiss()" class="p-0.5 text-on-surface-muted hover:text-on-surface transition-colors" aria-label="Close">
            <svg lucideX class="w-4 h-4" strokeWidth="2" aria-hidden="true"></svg>
          </button>
        </div>
      </div>
    }
  `,
})
export class UiToast {
  readonly type = input<ToastType>('info');
  readonly message = input('');
  readonly position = input<ToastPosition>('top');
  readonly duration = input(4000);
  readonly visible = input(false);
  protected readonly dismissed = output<void>();

  protected readonly positionClasses = computed(() => this.position() === 'top' ? 'top-4' : 'bottom-24');
  protected readonly typeClasses = computed(() => {
    const bg = { success: 'bg-success/10 border border-success/20', error: 'bg-error/10 border border-error/20', warning: 'bg-warning/10 border border-warning/20', info: 'bg-info/10 border border-info/20' };
    return bg[this.type()];
  });

  protected dismiss(): void { this.dismissed.emit(); }
}
