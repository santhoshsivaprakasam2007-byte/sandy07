import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log("No user found. We need a user to insert a task.");
    // Let's just try to insert without user and see the RLS error or schema error
  }
  
  // Just try to insert a fake task
  const payload = {
    user_id: "00000000-0000-0000-0000-000000000000",
    title: "Test Task"
  };
  
  const { data, error } = await supabase.from("tasks").insert([payload]);
  console.log("Error:", JSON.stringify(error, null, 2));
}

test();
