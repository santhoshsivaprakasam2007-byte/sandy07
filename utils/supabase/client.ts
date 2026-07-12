import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("placeholder") || supabaseUrl === "your-project-url") {
    console.error("Missing or invalid Supabase environment variables.");
    // Return a dummy client that throws errors to prevent crashing the URL parser on boot
    // but still fails gracefully when actual auth operations are attempted.
    return createBrowserClient(
      "https://invalid.supabase.co",
      "invalid-key"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
