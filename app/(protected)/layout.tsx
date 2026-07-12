import { redirect } from "next/navigation";
import { createClient } from "../../utils/supabase/server";
import Sidebar from "../../components/Sidebar";
import TopNav from "../../components/TopNav";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <div className="hidden md:block w-64 shrink-0 border-r border-border bg-card">
        <Sidebar user={user} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <TopNav user={user} />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
