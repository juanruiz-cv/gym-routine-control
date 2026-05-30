import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly _supabase = inject(SupabaseService);

  async log(params: {
    action: string;
    entityType: string;
    entityId?: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const { data: { user } } = await this._supabase.client.auth.getUser();
    if (!user) return;

    await this._supabase.client.from('audit_logs').insert({
      actor_id: user.id,
      target_id: params.targetId ?? null,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      metadata: params.metadata ?? {},
    });
  }
}
