import { Directive, DestroyRef, inject, ElementRef } from '@angular/core';

@Directive({
  selector: '[appTouchFeedback]',
  standalone: true,
})
export class TouchFeedbackDirective {
  private readonly _element = inject(ElementRef<HTMLElement>);
  private readonly _destroyRef = inject(DestroyRef);

  constructor() {
    const el = this._element.nativeElement;
    el.style.transition = 'transform 0.1s ease, opacity 0.1s ease';

    const onPointerDown = () => {
      el.style.transform = 'scale(0.97)';
      el.style.opacity = '0.8';
    };

    const onPointerUp = () => {
      el.style.transform = '';
      el.style.opacity = '';
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointerleave', onPointerUp);

    this._destroyRef.onDestroy(() => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointerleave', onPointerUp);
    });
  }
}
