import { createClient } from '@supabase/supabase-js'

// 優先使用伺服器端變數；沒有再退回公開變數
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 未設定 env 時為 null；目前 RAG 走本地索引，不強制依賴 Supabase
export const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null
