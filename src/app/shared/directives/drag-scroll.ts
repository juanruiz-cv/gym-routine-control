import { Directive, DestroyRef, inject, ElementRef, AfterViewInit } from '@angular/core';

@Directive({
  selector: '[appDragScroll]',
  standalone: true,
})
export class DragScrollDirective implements AfterViewInit {
  private readonly _element = inject(ElementRef<HTMLElement>);
  private readonly _destroyRef = inject(DestroyRef);

  private _isDragging = false;
  private _hasMoved = false;
  private _startX = 0;
  private _scrollLeft = 0;

  ngAfterViewInit(): void {
    const el = this._element.nativeElement;
    el.style.cursor = 'grab';
    el.style.touchAction = 'pan-x';
    el.style.userSelect = 'none';
    el.style.webkitUserSelect = 'none';

    const onPointerDown = (e: PointerEvent) => {
      this._isDragging = false;
      this._hasMoved = false;
      this._startX = e.clientX;
      this._scrollLeft = el.scrollLeft;
    };

    const onPointerMove = (e: PointerEvent) => {
      const dx = Math.abs(e.clientX - this._startX);
      if (!this._isDragging) {
        if (dx < 5) return;
        this._isDragging = true;
        this._hasMoved = true;
        el.setPointerCapture(e.pointerId);
        el.style.cursor = 'grabbing';
      }
      e.preventDefault();
      el.scrollLeft = this._scrollLeft - (e.clientX - this._startX);
    };

    const onPointerUp = () => {
      if (!this._hasMoved) {
        el.style.cursor = 'grab';
        return;
      }
      this._isDragging = false;
      this._hasMoved = false;
      el.style.cursor = 'grab';
    };

    const onPointerCancel = () => {
      this._isDragging = false;
      this._hasMoved = false;
      el.style.cursor = 'grab';
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointerleave', onPointerUp);
    el.addEventListener('pointercancel', onPointerCancel);

    this._destroyRef.onDestroy(() => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointerleave', onPointerUp);
      el.removeEventListener('pointercancel', onPointerCancel);
    });
  }
}
