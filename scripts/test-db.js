require("dotenv/config");
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.log("Missing env variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpdate() {
  const { data, error } = await supabase
    .from("startups")
    .update({ tech_stack: ["React"] })
    .limit(1);

  if (error) {
    console.error("DB Error:", error.message);
  } else {
    console.log("Update succeeded or no rows matched. Response:", data);
  }
}

testUpdate();
