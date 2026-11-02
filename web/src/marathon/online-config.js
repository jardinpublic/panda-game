// The gang's online Hall of Fame on Supabase (project JardinPublic, tables
// panda_*: see tools/online/supabase.sql). The project URL and its publishable
// key are public by design: the database rules protect the scores (anyone can
// add a plausible score, nobody can read player ids, edit or delete).
// Empty values keep scores on the phone only and hide the online board.
export const ONLINE_URL = 'https://zylrqlxbjsgbydmaztei.supabase.co';
export const ONLINE_KEY = 'sb_publishable_TviLDoeJ61Tzp5cLU8au_g_FeM4EVZ8';
