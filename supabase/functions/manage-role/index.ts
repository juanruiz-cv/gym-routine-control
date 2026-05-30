import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface Payload {
  user_id: string;
  role: 'admin' | 'staff' | 'user';
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401 });
    }

    const { data: { user: caller }, error: authError } = await supabaseClient.auth.getUser(authHeader);
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { data: callerProfile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (!callerProfile || callerProfile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: only admins can manage roles' }), { status: 403 });
    }

    const { user_id, role }: Payload = await req.json();

    if (!user_id || !role || !['admin', 'staff', 'user'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    }

    if (user_id === caller.id) {
      return new Response(JSON.stringify({ error: 'Cannot change your own role' }), { status: 400 });
    }

    const { data: targetProfile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user_id)
      .single();

    if (!targetProfile) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    if (targetProfile.role === 'admin' && caller.id !== user_id) {
      return new Response(JSON.stringify({ error: 'Cannot modify another admin' }), { status: 403 });
    }

    const oldRole = targetProfile.role;

    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ role })
      .eq('id', user_id);

    if (updateError) {
      return new Response(JSON.stringify({ error: 'Failed to update role' }), { status: 500 });
    }

    const { data: audit } = await supabaseClient
      .from('audit_logs')
      .insert({
        actor_id: caller.id,
        target_id: user_id,
        action: 'role_change',
        entity_type: 'profile',
        entity_id: user_id,
        metadata: { old_role: oldRole, new_role: role },
      })
      .select('id')
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        user_id,
        role,
        old_role: oldRole,
        audit_id: audit?.id,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
