import { supabase } from '../lib/supabaseClient';

export async function listPlaybooks(userId) {
  const { data, error } = await supabase
    .from('playbooks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createPlaybook(playbook) {
  const { error } = await supabase.from('playbooks').insert(playbook);
  if (error) throw error;
}

export async function deletePlaybook(id) {
  const { error } = await supabase.from('playbooks').delete().eq('id', id);
  if (error) throw error;
}
