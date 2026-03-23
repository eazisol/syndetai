const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking tables in public schema...');
  const { data: publicTables, error: publicError } = await supabase
    .from('reports')
    .select('id')
    .limit(1);
  
  if (publicError) {
    console.log('Error querying reports in public schema:', publicError.message);
  } else {
    console.log('Found reports in public schema.');
  }

  const { data: purchaseData, error: purchaseError } = await supabase
    .from('purchases')
    .select('id')
    .limit(1);
  
  if (purchaseError) {
    console.log('Error querying purchases in public schema:', purchaseError.message);
  } else {
    console.log('Found purchases in public schema.');
  }

  console.log('\nChecking tables in syndet schema...');
  const { data: syndetReports, error: syndetError } = await supabase
    .schema('syndet')
    .from('reports')
    .select('id')
    .limit(1);
  
  if (syndetError) {
    console.log('Error querying reports in syndet schema:', syndetError.message);
  } else {
    console.log('Found reports in syndet schema.');
  }

  const { data: syndetPurchases, error: syndetPurchaseError } = await supabase
    .schema('syndet')
    .from('purchases')
    .select('id')
    .limit(1);
  
  if (syndetPurchaseError) {
    console.log('Error querying purchases in syndet schema:', syndetPurchaseError.message);
  } else {
    console.log('Found purchases in syndet schema.');
  }
}

checkSchema();
