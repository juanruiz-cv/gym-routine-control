import { Component, input, output, inject, ElementRef, effect } from '@angular/core';
import { TranslatePipe } from '@shared/i18n/translate.pipe';

@Component({
  selector: 'app-ui-modal',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @if (isOpen()) {
      <div #modalDialog class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" (keydown.escape)="close()" (keydown)="onKeydown($event)">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
          (click)="close()"
          tabindex="-1"
        ></div>

        <!-- Modal Content -->
        <div
          class="relative w-full sm:max-w-lg bg-surface-elevated rounded-t-2xl sm:rounded-2xl animate-slide-up max-h-[90dvh] overflow-y-auto"
          [class.p-5]="!noPadding()"
        >
          <!-- Handle bar for mobile -->
          <div class="flex sm:hidden items-center justify-center pt-2 pb-1 -mt-1">
            <div class="w-10 h-1 bg-white/20 rounded-full"></div>
          </div>

          @if (title()) {
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-on-surface">{{ title() }}</h2>
              <button
                (click)="close()"
                class="p-1.5 rounded-lg text-on-surface-muted hover:text-on-surface hover:bg-surface-hover transition-colors"
                [attr.aria-label]="'modal.closeLabel' | translate"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          }

          <ng-content />

          @if (showCloseButton()) {
            <button
              (click)="close()"
              class="mt-4 w-full py-2.5 rounded-xl border border-white/10 text-on-surface font-medium hover:bg-surface-hover transition-colors"
            >
              {{ 'modal.close' | translate }}
            </button>
          }
        </div>
      </div>
    }
  `,
})
export class UiModal {
  private readonly _elementRef = inject(ElementRef);

  readonly isOpen = input(false);
  readonly title = input('');
  readonly noPadding = input(false);
  readonly showCloseButton = input(false);

  readonly closed = output<void>();

  private _previousActiveElement: HTMLElement | null = null;

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this._previousActiveElement = document.activeElement as HTMLElement;
        setTimeout(() => this._focusFirstElement());
      }
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const dialog = this._elementRef.nativeElement.querySelector('[role="dialog"]');
    if (!dialog) return;
    const focusable = this._getFocusableElements(dialog);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      (last as HTMLElement).focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      (first as HTMLElement).focus();
    }
  }

  protected close(): void {
    this.closed.emit();
    if (this._previousActiveElement) {
      this._previousActiveElement.focus();
    }
  }

  private _focusFirstElement(): void {
    const dialog = this._elementRef.nativeElement.querySelector('[role="dialog"]');
    if (!dialog) return;
    const focusable = this._getFocusableElements(dialog);
    if (focusable.length) {
      (focusable[0] as HTMLElement).focus();
    }
  }

  private _getFocusableElements(container: Element): NodeListOf<HTMLElement> {
    return container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
  }
}
