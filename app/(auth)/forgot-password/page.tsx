"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/ui/form";
import { resetPassword } from "../actions";
import { toast } from "sonner";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

export default function ForgotPassword() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("email", values.email);
    
    const result = await resetPassword(formData);
    
    if (result?.error) {
      setError(result.error);
    } else {
      toast.success(result.success || "Check your email for reset instructions.");
      form.reset();
    }
    setIsLoading(false);
  }

  return (
    <div className="bg-background min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="fixed bottom-[-100px] right-[-50px] w-[400px] h-[400px] opacity-10 blur-[100px] bg-primary rounded-full z-0"></div>
        <div className="fixed top-[-100px] left-[-50px] w-[300px] h-[300px] opacity-10 blur-[80px] bg-secondary rounded-full z-0"></div>
      </div>

      <main className="relative z-10 w-full max-w-[440px] px-container-margin py-lg animate-in fade-in duration-700">
        <div className="flex flex-col items-center mb-lg text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mb-md shadow-lg shadow-primary/20">
            <span
              className="material-symbols-outlined text-white text-[32px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              key
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Reset Password</h1>
          <p className="text-muted-foreground">Enter your email and we'll send you a reset link</p>
        </div>

        <div className="bg-card/50 backdrop-blur-md border rounded-xl p-8 shadow-sm">
          {error && (
            <div className="bg-destructive/15 text-destructive p-3 rounded-md mb-6 text-sm">
              {error}
            </div>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@university.edu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-12 text-md rounded-xl" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center mt-8 text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </main>
    </div>
  );
}
