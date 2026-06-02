import { Component, input, computed } from '@angular/core';
import { TranslatePipe } from '@shared/i18n/translate.pipe';

type RecoveryStage = 'exhausted' | 'recovering' | 'regaining' | 'ready' | 'go';

const SVG_MAP: Record<RecoveryStage, string> = {
  exhausted: '/assets/svg/recovery/athlete-exhausted.svg',
  recovering: '/assets/svg/recovery/athlete-recovering.svg',
  regaining: '/assets/svg/recovery/athlete-regaining.svg',
  ready: '/assets/svg/recovery/athlete-ready.svg',
  go: '/assets/svg/recovery/athlete-go.svg',
};

@Component({
  selector: 'app-recovery-timer-avatar',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="flex flex-col items-center gap-2" role="img" [attr.aria-label]="(stageKey() | translate)">
      <div class="relative w-[100px] h-[120px] sm:w-[110px] sm:h-[130px]">
        <img
          [src]="svgSrc()"
          [alt]="(stageKey() | translate)"
          class="w-full h-full transition-opacity duration-300"
          loading="eager"
        />
      </div>

      <span
        class="text-xs font-medium"
        [class.text-red-400]="recoveryStage() === 'exhausted'"
        [class.text-amber-400]="recoveryStage() === 'recovering'"
        [class.text-yellow-400]="recoveryStage() === 'regaining'"
        [class.text-green-400]="recoveryStage() === 'ready'"
        [class.text-green-300]="recoveryStage() === 'go'"
        aria-live="polite"
      >{{ stageKey() | translate }}</span>

      <div class="w-full h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          class="h-full transition-all duration-300 ease-linear rounded-full"
          [style.width.%]="recoveryPercentage()"
          [class.bg-red-500]="recoveryStage() === 'exhausted'"
          [class.bg-amber-500]="recoveryStage() === 'recovering'"
          [class.bg-yellow-500]="recoveryStage() === 'regaining'"
          [class.bg-green-500]="recoveryStage() === 'ready'"
          [class.bg-green-400]="recoveryStage() === 'go'"
        ></div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    @media (prefers-reduced-motion: reduce) {
      .transition-all, .transition-opacity { transition: none !important; }
    }
  `],
})
export class RecoveryTimerAvatarComponent {
  readonly remainingSeconds = input<number>(0);
  readonly totalSeconds = input<number>(90);

  protected readonly recoveryPercentage = computed(() => {
    const total = this.totalSeconds();
    const remaining = this.remainingSeconds();
    if (total <= 0) return 0;
    return ((total - remaining) / total) * 100;
  });

  protected readonly recoveryStage = computed<RecoveryStage>(() => {
    const pct = this.recoveryPercentage();
    if (pct <= 25) return 'exhausted';
    if (pct <= 50) return 'recovering';
    if (pct <= 75) return 'regaining';
    if (pct <= 95) return 'ready';
    return 'go';
  });

  protected readonly stageKey = computed(() => `recovery.${this.recoveryStage()}`);

  protected readonly svgSrc = computed(() => SVG_MAP[this.recoveryStage()]);
}
