'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. FETCH LOG HISTORY
export async function getActivityLogsAction() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return { error: error.message }
  return { success: true, data }
}

// 2. TAMBAH DOKUMEN + LOG
export async function createDocumentAction(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Anda harus login terlebih dahulu.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const creation_date = formData.get('creation_date') as string
  const ba_number = formData.get('ba_number') as string
  const ba_type_id = formData.get('ba_type_id') as string
  const position_id = formData.get('position_id') as string
  const status = formData.get('status') as string
  const notes = formData.get('notes') as string
  const category = (formData.get('category') as string) || 'teknisi'
  const title = (formData.get('title') as string) || ''
  const description = (formData.get('description') as string) || ''

  const { data: doc, error } = await supabase
    .from('documents')
    .insert({
      creation_date,
      ba_number,
      title,
      description,
      ba_type_id,
      position_id,
      status,
      notes,
      category,
      updated_by: user.id,
    })
    .select('id, doc_number, ba_number')
    .single()

  if (error) return { error: error.message }

  // RECORD LOG
  await supabase.from('activity_logs').insert({
    user_id: user.id,
    user_name: profile?.full_name || user.email,
    action: 'CREATE',
    doc_number: doc.doc_number,
    ba_number: doc.ba_number,
    details: `Menambahkan dokumen baru No BA: ${doc.ba_number}`,
  })

  return { success: true }
}

// 3. UPDATE DOKUMEN + LOG
export async function updateDocumentAction(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Anda harus login terlebih dahulu.' }

  const id = formData.get('id') as string
  if (!id) return { error: 'ID dokumen tidak ditemukan.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const creation_date = formData.get('creation_date') as string
  const ba_number = formData.get('ba_number') as string
  const ba_type_id = formData.get('ba_type_id') as string
  const position_id = formData.get('position_id') as string
  const status = formData.get('status') as string
  const notes = formData.get('notes') as string
  const category = (formData.get('category') as string) || 'teknisi'
  const title = (formData.get('title') as string) || ''
  const description = (formData.get('description') as string) || ''

  const { data: doc, error } = await supabase
    .from('documents')
    .update({
      creation_date,
      ba_number,
      title,
      description,
      ba_type_id,
      position_id,
      status,
      notes,
      category,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('doc_number, ba_number')
    .single()

  if (error) return { error: error.message }

  // RECORD LOG
  await supabase.from('activity_logs').insert({
    user_id: user.id,
    user_name: profile?.full_name || user.email,
    action: 'UPDATE',
    doc_number: doc.doc_number,
    ba_number: doc.ba_number,
    details: `Mengubah data dokumen #${doc.doc_number} (No BA: ${doc.ba_number})`,
  })

  return { success: true }
}

// 4. DELETE DOKUMEN + LOG
export async function deleteDocumentAction(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Anda harus login terlebih dahulu.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Ambil detail dokumen dulu sebelum dihapus
  const { data: targetDoc } = await supabase
    .from('documents')
    .select('doc_number, ba_number')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  // RECORD LOG
  if (targetDoc) {
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      user_name: profile?.full_name || user.email,
      action: 'DELETE',
      doc_number: targetDoc.doc_number,
      ba_number: targetDoc.ba_number,
      details: `Menghapus dokumen #${targetDoc.doc_number} (No BA: ${targetDoc.ba_number})`,
    })
  }

  return { success: true }
}

// 5. HAPUS MASSAL DOKUMEN PER BULAN
export async function deleteDocumentsByMonthAction(monthStr: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Anda harus login terlebih dahulu.' }

  // Cek Role Admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Hanya Admin yang diizinkan menghapus data massal.' }
  }

  // Hapus semua dokumen pada bulan terpilih (format: YYYY-MM)
  const { error, count } = await supabase
    .from('documents')
    .delete({ count: 'exact' })
    .like('creation_date', `${monthStr}%`)

  if (error) return { error: error.message }

  // Record Activity Log
  await supabase.from('activity_logs').insert({
    user_id: user.id,
    user_name: profile?.full_name || user.email,
    action: 'DELETE_BULK',
    details: `Menghapus massal data dokumen periode bulan ${monthStr} (${count || 0} data)`,
  })

  revalidatePath('/dashboard')
  return { success: true, count }
}