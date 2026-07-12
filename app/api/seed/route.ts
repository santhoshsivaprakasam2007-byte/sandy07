import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {} // Read-only in this route
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  // Generate 7 days of mock data
  const sessions = [];
  const now = new Date();
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    
    // Add 2 focus sessions per day
    sessions.push({
      user_id: user.id,
      session_type: "focus",
      subject: "Deep Work",
      duration_minutes: 45,
      completed: true,
      created_at: d.toISOString(),
    });
    sessions.push({
      user_id: user.id,
      session_type: "focus",
      subject: "Reading",
      duration_minutes: 30,
      completed: true,
      created_at: d.toISOString(),
    });
  }

  const { error } = await supabase.from("study_sessions").insert(sessions);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Mock data injected! Refresh your dashboard." });
}
