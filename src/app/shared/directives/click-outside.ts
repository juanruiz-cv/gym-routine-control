import { Directive, input, output, DestroyRef, inject, ElementRef } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  private readonly _element = inject(ElementRef<HTMLElement>);
  private readonly _destroyRef = inject(DestroyRef);

  readonly appClickOutsideEnabled = input(true);
  readonly appClickOutside = output<void>();

  constructor() {
    const handler = (event: MouseEvent | TouchEvent) => {
      if (!this.appClickOutsideEnabled()) return;
      const target = event.target as Node;
      if (!this._element.nativeElement.contains(target)) {
        this.appClickOutside.emit();
      }
    };

    document.addEventListener('click', handler, true);
    document.addEventListener('touchstart', handler, true);

    this._destroyRef.onDestroy(() => {
      document.removeEventListener('click', handler, true);
      document.removeEventListener('touchstart', handler, true);
    });
  }
}
