'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper Supabase Client
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// 1. TAMBAH USER BARU
export async function createUserAction(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const role = (formData.get('role') as string) || 'user'

    if (!email || !password || !fullName) {
      return { error: 'Semua kolom formulir wajib diisi!' }
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Create User di Auth Supabase
    const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })

    if (authError) return { error: authError.message }

    // Simpan data Profile
    if (data.user) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: data.user.id,
          full_name: fullName,
          role: role,
          email: email
        })

      if (profileError) console.error('Profile Insert Error:', profileError.message)
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Gagal menambah user' }
  }
}

// 2. HAPUS USER
export async function deleteUserAction(targetUserId: string) {
  try {
    const supabaseServer = await createServerClient()
    const { data: { user: currentUser } } = await supabaseServer.auth.getUser()

    if (!currentUser) return { error: 'Akses ditolak' }
    if (currentUser.id === targetUserId) {
      return { error: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang login' }
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Hapus dari tabel profiles & auth
    await supabaseAdmin.from('profiles').delete().eq('id', targetUserId)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Gagal menghapus user' }
  }
}