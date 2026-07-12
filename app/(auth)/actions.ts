"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../utils/supabase/server";

export async function login(formData: FormData) {
  try {
    const supabase = await createClient();

    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
      return { error: error.message };
    }
  } catch (e: any) {
    return { error: "Network error or missing Supabase configuration. Please check your .env.local file." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  try {
    const supabase = await createClient();

    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      options: {
        data: {
          full_name: formData.get("name") as string,
        }
      }
    };

    const { error } = await supabase.auth.signUp(data);

    if (error) {
      return { error: error.message };
    }
  } catch (e: any) {
    return { error: "Network error or missing Supabase configuration. Please check your .env.local file." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function resetPassword(formData: FormData) {
  try {
    const supabase = await createClient();

    const email = formData.get("email") as string;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
    });

    if (error) {
      return { error: error.message };
    }
  } catch (e: any) {
    return { error: "Network error or missing configuration." };
  }

  return { success: "Password reset email sent." };
}

export async function updatePassword(formData: FormData) {
  try {
    const supabase = await createClient();

    const password = formData.get("password") as string;
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return { error: error.message };
    }
  } catch (e: any) {
    return { error: "Network error or missing configuration." };
  }

  redirect("/dashboard");
}

export async function logout() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (e) {
    // Ignore errors on logout
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
