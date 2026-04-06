import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Supabase 환경변수가 설정되지 않은 경우 mock client 반환
function createMockClient() {
  const notConfigured = () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
  return {
    from: () => ({
      insert: notConfigured,
      select: () => ({ eq: () => ({ single: notConfigured, data: null, error: null }) }),
      upsert: notConfigured,
      delete: () => ({ eq: notConfigured }),
    }),
    _isMock: true,
  }
}

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey &&
  supabaseUrl !== 'https://YOUR_PROJECT_ID.supabase.co')

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient()

// ─── Room helpers ────────────────────────────────────────────────────────────

export async function createRoom(room) {
  const { data, error } = await supabase
    .from('rooms')
    .insert([room])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getRoom(id) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function deleteRoom(id) {
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ─── Availability helpers ────────────────────────────────────────────────────

export async function upsertAvailability(entry) {
  // room_id + name 조합으로 upsert (같은 이름으로 재입력 시 덮어씀)
  const { data: existing } = await supabase
    .from('availability')
    .select('id')
    .eq('room_id', entry.room_id)
    .eq('name', entry.name)
    .maybeSingle()

  if (existing?.id) {
    const { data, error } = await supabase
      .from('availability')
      .update({ slots: entry.slots, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('availability')
      .insert([entry])
      .select()
      .single()
    if (error) throw error
    return data
  }
}

export async function getAvailabilities(roomId) {
  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}
