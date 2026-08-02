import { createClient } from '@supabase/supabase-js'
import { CONFIG } from './config'

export const supabaseEnabled = Boolean(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey)

export const supabase = supabaseEnabled
  ? createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
      realtime: { params: { eventsPerSecond: 10 } }
    })
  : null
