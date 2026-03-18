
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oxzvikzvodrohjycfucj.supabase.co';
const supabaseServiceKey = 'sb_secret_7bo7rsUrXng9CLVTRHSE-g_rrhGH1Lm';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function resetDemoPassword() {
    const userId = '00000000-0000-0000-0000-000000000001';
    const newPassword = 'password123';

    const { data, error } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
    );

    if (error) {
        console.error('Error resetting password:', error);
        process.exit(1);
    }

    console.log('PASSWORD_RESET_SUCCESSFUL');
    console.log('EMAIL: demo@provenmrr.com');
    console.log('PASSWORD: ' + newPassword);
}

resetDemoPassword();
