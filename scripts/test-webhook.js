const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const path = require("path");

// Load env vars
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

async function simulateWebhook(startupId) {
    console.log(`🚀 Simulating checkout success for startup: ${startupId}`);
    
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase
        .from("startups")
        .update({ 
            listing_fee_paid: true,
            is_listed_for_sale: true
        })
        .eq("id", startupId);

    if (error) {
        console.error("❌ Failed to update startup:", error.message);
    } else {
        console.log("✅ Startup successfully updated in database.");
        console.log("Check your dashboard to see if the UI updated in real-time!");
    }
}

// Get ID from command line
const startupId = process.argv[2];
if (!startupId) {
    console.error("Please provide a startup ID: node test-webhook.js <startup_id>");
    process.exit(1);
}

simulateWebhook(startupId);
