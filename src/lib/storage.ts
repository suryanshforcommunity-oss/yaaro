import { createClient } from '@/lib/supabase/client'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Uploads a profile avatar to Supabase Storage 'avatars' bucket
 */
export async function uploadAvatar(file: File, userId: string): Promise<UploadResult> {
  const supabase = createClient()
  const fileExt = file.name.split('.').pop() || 'jpg'
  const filePath = `${userId}/${Date.now()}.${fileExt}`

  // Dev fallback if using placeholder keys
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
    // Generate object URL for seamless local testing
    return {
      success: true,
      url: URL.createObjectURL(file),
    }
  }

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    })

  if (uploadError) {
    return { success: false, error: uploadError.message }
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
  return { success: true, url: data.publicUrl }
}
