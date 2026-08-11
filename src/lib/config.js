export const CONFIG = {
  adminPin: import.meta.env.VITE_ADMIN_PIN || '1608',
  albumUrl: import.meta.env.VITE_ALBUM_URL || 'https://example.com',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  demoMode: new URLSearchParams(window.location.search).get('demo') === '1',
  cooldownMinMinutes: 30,
  cooldownMaxMinutes: 50,
  demoCooldownSeconds: 45,
  maxEncounterMissionsPerParticipant: 4,
  maxAssignmentsPerMission: 3
}
