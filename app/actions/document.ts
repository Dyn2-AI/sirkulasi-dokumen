'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Helper Supabase Admin Client (Menggunakan Service Role Key)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di Environment Variables!')
  }

  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

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

  revalidatePath('/dashboard')
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

  revalidatePath('/dashboard')
  return { success: true }
}

// 4. DELETE DOKUMEN SATUAN + LOG
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

  revalidatePath('/dashboard')
  return { success: true }
}

// 5. HAPUS MASSAL DOKUMEN PER BULAN + LOG
export async function deleteDocumentsByMonthAction(monthYear: string) {
  try {
    if (!monthYear || !monthYear.includes('-')) {
      return { error: 'Pilih periode bulan & tahun yang valid' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const [yearStr, monthStr] = monthYear.split('-')
    const year = parseInt(yearStr, 10)
    const month = parseInt(monthStr, 10)

    // Range Tanggal
    const startDate = `${yearStr}-${monthStr.padStart(2, '0')}-01`
    const nextYear = month === 12 ? year + 1 : year
    const nextMonth = month === 12 ? 1 : month + 1
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

    const supabaseAdmin = getSupabaseAdmin()

    // Ekseksusi Hapus Massal via Admin Client
    const { error, count } = await supabaseAdmin
      .from('documents')
      .delete({ count: 'exact' })
      .gte('creation_date', startDate)
      .lt('creation_date', endDate)

    if (error) return { error: error.message }

    // RECORD LOG (Jika user login)
    if (user && (count || 0) > 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      await supabase.from('activity_logs').insert({
        user_id: user.id,
        user_name: profile?.full_name || user.email,
        action: 'DELETE',
        doc_number: 0,
        ba_number: 'BULK_DELETE',
        details: `Menghapus massal ${count} dokumen untuk periode ${monthYear}`,
      })
    }

    revalidatePath('/dashboard')
    return { success: true, count: count || 0 }
  } catch (err: any) {
    return { error: err.message || 'Gagal menghapus dokumen massal' }
  }
}

// 6. IMPORT MASSAL DOKUMEN DARI EXCEL
export async function bulkInsertDocumentsAction(documents: any[]) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Anda harus login terlebih dahulu.' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Inject updated_by ke setiap dokumen
    const docsToInsert = documents.map(doc => ({
      ...doc,
      updated_by: user.id
    }))

    // Lakukan Bulk Insert ke Supabase
    const { data, error } = await supabase
      .from('documents')
      .insert(docsToInsert)
      .select('doc_number')

    if (error) return { error: error.message }

    // RECORD LOG
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      user_name: profile?.full_name || user.email,
      action: 'CREATE',
      doc_number: 0,
      ba_number: 'IMPORT EXCEL',
      details: `Melakukan import massal ${documents.length} dokumen baru`,
    })

    revalidatePath('/dashboard')
    return { success: true, count: documents.length }
  } catch (err: any) {
    return { error: err.message || 'Gagal melakukan import massal' }
  }
}