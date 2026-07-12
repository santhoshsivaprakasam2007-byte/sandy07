import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isInvalid = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("placeholder") || supabaseUrl === "your-project-url";

  if (isInvalid) {
    console.error("Missing or invalid Supabase environment variables in server client.");
  }

  return createServerClient(
    isInvalid ? "https://invalid.supabase.co" : supabaseUrl!,
    isInvalid ? "invalid-key" : supabaseAnonKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
