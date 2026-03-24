import { createAdminClient } from "./lib/supabase/server.js"; // Use .js for consistency with Node script if needed, or .ts if running with ts-node

async function listAuthUsers() {
    const supabase = createAdminClient();
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error("Error listing users:", error);
        return;
    }
    console.log(JSON.stringify(users.map(u => ({ id: u.id, email: u.email })), null, 2));
}

listAuthUsers();
