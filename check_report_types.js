const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReportTypes() {
  const { data, error } = await supabase.schema('syndet').from('report_types').select('*');
  if (error) {
    console.error('Error fetching report types:', error);
  } else {
    console.log('Report Types:', JSON.stringify(data, null, 2));
  }
}

checkReportTypes();
