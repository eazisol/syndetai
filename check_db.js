const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function check() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const url = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
  const key = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

  const supabase = createClient(url, key);
  
  const { data: publicData, error: publicError } = await supabase
    .from('new_submissions')
    .select('id')
    .limit(1);
    
  const { data: syndetData, error: syndetError } = await supabase
    .schema('syndet')
    .from('new_submissions')
    .select('id')
    .limit(1);
    
  console.log('Public:', publicError ? publicError.message : 'Exists (' + (publicData ? publicData.length : 0) + ')');
  console.log('Syndet:', syndetError ? syndetError.message : 'Exists (' + (syndetData ? syndetData.length : 0) + ')');
}

check();
