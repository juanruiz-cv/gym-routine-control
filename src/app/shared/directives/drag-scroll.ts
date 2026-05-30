import { Directive, DestroyRef, inject, ElementRef, AfterViewInit } from '@angular/core';

@Directive({
  selector: '[appDragScroll]',
  standalone: true,
})
export class DragScrollDirective implements AfterViewInit {
  private readonly _element = inject(ElementRef<HTMLElement>);
  private readonly _destroyRef = inject(DestroyRef);

  private _isDragging = false;
  private _startX = 0;
  private _scrollLeft = 0;

  ngAfterViewInit(): void {
    const el = this._element.nativeElement;
    el.style.cursor = 'grab';
    el.style.touchAction = 'pan-x';
    el.style.userSelect = 'none';
    el.style.webkitUserSelect = 'none';

    const onPointerDown = (e: PointerEvent) => {
      this._isDragging = true;
      this._startX = e.clientX;
      this._scrollLeft = el.scrollLeft;
      el.style.cursor = 'grabbing';
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!this._isDragging) return;
      e.preventDefault();
      const dx = e.clientX - this._startX;
      el.scrollLeft = this._scrollLeft - dx;
    };

    const onPointerUp = (_e: PointerEvent) => {
      this._isDragging = false;
      el.style.cursor = 'grab';
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointerleave', onPointerUp);

    this._destroyRef.onDestroy(() => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointerleave', onPointerUp);
    });
  }
}
