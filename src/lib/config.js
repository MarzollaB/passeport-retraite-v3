export const CONFIG = {
  adminPin: import.meta.env.VITE_ADMIN_PIN || '1608',
  albumUrl: import.meta.env.VITE_ALBUM_URL || 'https://example.com',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  demoMode: new URLSearchParams(window.location.search).get('demo') === '1',
  cooldownMinMinutes: 50,
  cooldownMaxMinutes: 70,
  demoCooldownSeconds: 45,
  maxEncounterMissionsPerParticipant: 2,
  maxAssignmentsPerMission: 3
}
