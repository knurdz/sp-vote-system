import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ffbufcdnphiuocguiyip.supabase.co'
const supabaseKey = 'sb_publishable_TMqS-2fenmoA8CuZvrVLmg_ow4xssUR'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log("Checking applied policies in pg_policies...")
  
  // We can select from pg_policies if the service key allows it or we can try via RPC,
  // but wait, standard user might not have direct SELECT on pg_policies via supabase-js unless public.
  // Let's write an RPC check or see if we can read it.
  // Wait, let's try a query on teams to see if we can update a row first, to see if the user has update permissions.
  // Wait! Let's query information_schema or see if we can get policies.
  const { data, error } = await supabase
    .from('settings')
    .select('*')
  console.log("Settings read check:", data, "Error:", error)
}

run()
