import { Directive, DestroyRef, inject, ElementRef, AfterViewInit, NgZone } from '@angular/core';

@Directive({
  selector: '[appDragScroll]',
  standalone: true,
})
export class DragScrollDirective implements AfterViewInit {
  private readonly _element = inject(ElementRef<HTMLElement>);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _ngZone = inject(NgZone);

  private _isDragging = false;
  private _startX = 0;
  private _scrollLeft = 0;

  private _onPointerMove: ((e: PointerEvent) => void) | null = null;
  private _onPointerUp: ((e: PointerEvent) => void) | null = null;

  ngAfterViewInit(): void {
    const el = this._element.nativeElement;
    el.style.cursor = 'grab';
    el.style.touchAction = 'pan-x';
    el.style.userSelect = 'none';
    el.style.webkitUserSelect = 'none';

    this._ngZone.runOutsideAngular(() => {
      const onPointerDown = (e: PointerEvent) => {
        this._isDragging = false;
        this._startX = e.clientX;
        this._scrollLeft = el.scrollLeft;

        const onPointerMove = (e: PointerEvent) => {
          const dx = Math.abs(e.clientX - this._startX);
          if (!this._isDragging) {
            if (dx < 5) return;
            this._isDragging = true;
            el.style.cursor = 'grabbing';
          }
          e.preventDefault();
          el.scrollLeft = this._scrollLeft - (e.clientX - this._startX);
        };

        const onPointerUp = () => {
          document.removeEventListener('pointermove', onPointerMove);
          document.removeEventListener('pointerup', onPointerUp);
          document.removeEventListener('pointercancel', onPointerUp);
          this._isDragging = false;
          el.style.cursor = 'grab';
        };

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
        document.addEventListener('pointercancel', onPointerUp);

        this._onPointerMove = onPointerMove;
        this._onPointerUp = onPointerUp;
      };

      el.addEventListener('pointerdown', onPointerDown);

      this._destroyRef.onDestroy(() => {
        el.removeEventListener('pointerdown', onPointerDown);
        if (this._onPointerMove) {
          document.removeEventListener('pointermove', this._onPointerMove);
        }
        if (this._onPointerUp) {
          document.removeEventListener('pointerup', this._onPointerUp);
          document.removeEventListener('pointercancel', this._onPointerUp);
        }
      });
    });
  }
}
