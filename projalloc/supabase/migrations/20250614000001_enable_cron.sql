-- Enable pg_cron and schedule auto-close of expired voting projects.
-- Run this migration AFTER enabling the pg_cron extension in Supabase Dashboard → Database → Extensions.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

SELECT cron.schedule(
  'close-expired-voting',
  '* * * * *',
  $$UPDATE projects SET status = 'closed' WHERE status = 'voting' AND voting_deadline < NOW()$$
);
