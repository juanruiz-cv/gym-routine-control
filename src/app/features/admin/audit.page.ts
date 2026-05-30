import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import { SupabaseService } from '@core/services/supabase.service';
import { UiCard } from '@shared/ui/card';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { LucideActivity } from '@lucide/angular';
import type { AuditLog } from '@shared/models';

@Component({
  selector: 'app-admin-audit',
  standalone: true,
  imports: [DatePipe, JsonPipe, UiCard, TranslatePipe, LucideActivity],
  template: `
    <div class="p-4 space-y-4 max-w-lg mx-auto">
      <h1 class="text-xl font-bold">{{ 'admin.auditLog' | translate }}</h1>

      <div class="flex flex-col gap-2">
        @for (log of logs(); track log.id) {
          <app-ui-card>
            <div class="flex items-start gap-3">
              <svg lucideActivity class="w-5 h-5 text-brand mt-0.5 shrink-0" strokeWidth="1.5" aria-hidden="true"></svg>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium">{{ log.action }}</p>
                <p class="text-xs text-on-surface-muted mt-0.5">
                  {{ log.entity_type }} · {{ log.created_at | date:'short' }}
                </p>
                @if (log.metadata && log.metadata | json; as meta) {
                  <p class="text-xs text-on-surface-muted mt-0.5 truncate">{{ meta }}</p>
                }
              </div>
            </div>
          </app-ui-card>
        } @empty {
          <p class="text-center text-on-surface-muted text-sm py-8">{{ 'common.noResults' | translate }}</p>
        }
      </div>
    </div>
  `,
})
export class AdminAuditPage implements OnInit {
  private readonly _supabase = inject(SupabaseService);

  protected readonly logs = signal<AuditLog[]>([]);

  async ngOnInit(): Promise<void> {
    const { data } = await this._supabase.client
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    this.logs.set(data as unknown as AuditLog[] ?? []);
  }
}
