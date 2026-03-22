const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function checkSchema() {
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

  if (!urlMatch || !keyMatch) {
    console.log('Missing Supabase credentials in .env');
    return;
  }

  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();

  const supabase = createClient(url, key, {
    db: { schema: 'syndet' }
  });

  const tables = ['credit_transactions', 'organisations', 'credit_bundles', 'purchases'];

  for (const table of tables) {
    console.log(`\n--- Checking table: ${table} ---`);
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`Error checking ${table}:`, error.message);
    } else {
      console.log(`Table ${table} exists.`);
      if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]).join(', '));
      } else {
        console.log('Table is empty, cannot determine columns via select *');
      }
    }
  }
}

checkSchema();
