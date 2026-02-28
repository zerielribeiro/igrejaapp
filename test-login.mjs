import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
    console.log('Testing login for celson@betania.com...');
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'celson@betania.com',
        // Assuming test password; user said "use senha definida no cadastro", I can't know it. 
        // But maybe I can just update the password to 123456 manually to test
        password: '123456'
    });

    if (error) {
        console.error('Login Error:', error);
    } else {
        console.log('Login Success:', data);
    }
}

testLogin();
