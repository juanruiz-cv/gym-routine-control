import { Directive, input, output, DestroyRef, inject, ElementRef } from '@angular/core';

@Directive({
  selector: '[appLongPress]',
  standalone: true,
})
export class LongPressDirective {
  private readonly _element = inject(ElementRef<HTMLElement>);
  private readonly _destroyRef = inject(DestroyRef);

  readonly appLongPressDuration = input(500);
  readonly appLongPress = output<void>();

  private _timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const el = this._element.nativeElement;

    const start = () => {
      this._timer = setTimeout(() => {
        this.appLongPress.emit();
        this._timer = null;
      }, this.appLongPressDuration());
    };

    const end = () => {
      if (this._timer) {
        clearTimeout(this._timer);
        this._timer = null;
      }
    };

    el.addEventListener('mousedown', start);
    el.addEventListener('mouseup', end);
    el.addEventListener('mouseleave', end);
    el.addEventListener('touchstart', start);
    el.addEventListener('touchend', end);
    el.addEventListener('touchcancel', end);

    this._destroyRef.onDestroy(() => {
      el.removeEventListener('mousedown', start);
      el.removeEventListener('mouseup', end);
      el.removeEventListener('mouseleave', end);
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchend', end);
      el.removeEventListener('touchcancel', end);
      if (this._timer) clearTimeout(this._timer);
    });
  }
}
