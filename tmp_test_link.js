const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function test() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing env vars');
        return;
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const email = 'ayesha654.rida@gmail.com';
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
            redirectTo: 'http://localhost:3000/library'
        }
    });

    if (error) {
        console.error('Error:', error);
        return;
    }

    const actionLink = data.properties.action_link;
    console.log('Action Link:', actionLink);

    // Try to "consume" the link on server
    try {
        const response = await fetch(actionLink, { redirect: 'manual' });
        console.log('Status:', response.status);
        console.log('Location:', response.headers.get('location'));
        
        const location = response.headers.get('location');
        if (location && location.includes('#')) {
            const hash = location.split('#')[1];
            const params = new URLSearchParams(hash);
            console.log('Access Token exists:', !!params.get('access_token'));
            console.log('Refresh Token exists:', !!params.get('refresh_token'));
        }
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

test();
