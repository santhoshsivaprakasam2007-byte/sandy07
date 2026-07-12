"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Bell, User, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { logout } from "../app/(auth)/actions";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export default function TopNav({ user }: { user: SupabaseUser }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Capitalize first letter of pathname for title
  const title = pathname === "/dashboard" 
    ? "Dashboard" 
    : pathname.slice(1).charAt(0).toUpperCase() + pathname.slice(2);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold tracking-tight hidden sm:block">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-muted-foreground relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-primary rounded-full"></span>
        </Button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium leading-none mb-1">{user.user_metadata?.full_name || "Student"}</span>
            <span className="text-xs text-muted-foreground leading-none">{user.email}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold uppercase overflow-hidden">
            {user.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0) : "S"}
          </div>
          <form action={logout}>
            <Button variant="ghost" size="icon" type="submit" title="Log out" className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
