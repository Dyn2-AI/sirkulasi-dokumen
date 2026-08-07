'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

// 1. Fungsi Login
export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Email atau password salah.' }
  }

  redirect('/dashboard')
}

// 2. Fungsi Sign Out
export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// 3. SECURE FUNCTION: Pembuatan User Baru (Admin Only)
export async function registerUserByAdminAction(formData: FormData) {
  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = (formData.get('role') as string) || 'user'

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: role }
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'User berhasil dibuat!' }
}

// 4. SECURE FUNCTION: Hapus User (Admin Only)
export async function deleteUserByAdminAction(targetUserId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Akses ditolak. Hanya Admin yang boleh menghapus akun.' }
  }

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)

  if (error) {
    return { error: error.message }
  }

  return { success: 'Akun user berhasil dihapus!' }
}