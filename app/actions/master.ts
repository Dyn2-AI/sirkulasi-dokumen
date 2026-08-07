'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'


// ================= 1. JENIS BA (MASTER BA TYPES) =================
export async function createBaTypeAction(name: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Anda harus login terlebih dahulu.' }

  const { error } = await supabase.from('master_ba_types').insert({ name })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteBaTypeAction(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Anda harus login terlebih dahulu.' }

  const { error } = await supabase.from('master_ba_types').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

// ================= 2. JUDUL BA (MASTER BA TITLES) =================
export async function createBaTitleAction(name: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Anda harus login terlebih dahulu.' }

  const { error } = await supabase.from('master_ba_titles').insert({ name })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteBaTitleAction(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Anda harus login terlebih dahulu.' }

  const { error } = await supabase.from('master_ba_titles').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

// ================= 3. POSISI DOKUMEN (MASTER POSITIONS) =================
export async function createPositionAction(name: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Anda harus login terlebih dahulu.' }

  const { error } = await supabase.from('master_positions').insert({ name })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deletePositionAction(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Anda harus login terlebih dahulu.' }

  const { error } = await supabase.from('master_positions').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}