"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Switch } from "../../../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "../../../components/ui/form";
import { createClient } from "../../../utils/supabase/client";
import { toast } from "sonner";
import { useTheme } from "next-themes";

const settingsSchema = z.object({
  theme: z.string(),
  language: z.string(),
  notificationsEnabled: z.boolean(),
  soundEnabled: z.boolean(),
  focusDuration: z.number().min(1).max(180),
  shortBreak: z.number().min(1).max(60),
  longBreak: z.number().min(1).max(90),
  longBreakInterval: z.number().min(1).max(10),
  autoStartBreak: z.boolean(),
  autoStartFocus: z.boolean(),
});

export default function Settings() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();
  const { setTheme } = useTheme();

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      theme: "system",
      language: "en",
      notificationsEnabled: true,
      soundEnabled: true,
      focusDuration: 25,
      shortBreak: 5,
      longBreak: 15,
      longBreakInterval: 4,
      autoStartBreak: true,
      autoStartFocus: false,
    },
  });

  useEffect(() => {
    async function loadSettings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("theme, timer_settings")
          .eq("id", user.id)
          .single();

        if (profile) {
          const ts = profile.timer_settings || {};
          form.reset({
            theme: profile.theme || "system",
            language: ts.language || "en",
            notificationsEnabled: ts.notificationsEnabled ?? true,
            soundEnabled: ts.soundEnabled ?? true,
            focusDuration: ts.focusDuration ?? 25,
            shortBreak: ts.shortBreak ?? 5,
            longBreak: ts.longBreak ?? 15,
            longBreakInterval: ts.longBreakInterval ?? 4,
            autoStartBreak: ts.autoStartBreak ?? true,
            autoStartFocus: ts.autoStartFocus ?? false,
          });
        }
      }
    }
    loadSettings();
  }, [form, supabase]);

  async function onSubmit(values: z.infer<typeof settingsSchema>) {
    if (!userId) return;
    setIsSaving(true);

    const timerSettings = {
      focusDuration: values.focusDuration,
      shortBreak: values.shortBreak,
      longBreak: values.longBreak,
      longBreakInterval: values.longBreakInterval,
      autoStartBreak: values.autoStartBreak,
      autoStartFocus: values.autoStartFocus,
      soundEnabled: values.soundEnabled,
      notificationsEnabled: values.notificationsEnabled,
      language: values.language,
    };

    const { error } = await supabase
      .from("profiles")
      .update({
        theme: values.theme,
        timer_settings: timerSettings
      })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to save settings");
    } else {
      setTheme(values.theme);
      toast.success("Settings saved successfully");
    }
    setIsSaving(false);
  }

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-1">
          Customize your experience and study preferences.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Appearance & General */}
            <Card>
              <CardHeader>
                <CardTitle>Appearance & General</CardTitle>
                <CardDescription>
                  Customize the look and feel of the application.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Theme</FormLabel>
                        <FormDescription>Select light, dark, or system mode.</FormDescription>
                      </div>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="System" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Language</FormLabel>
                        <FormDescription>Choose your preferred language.</FormDescription>
                      </div>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="English" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Notifications & Sound */}
            <Card>
              <CardHeader>
                <CardTitle>Alerts & Sound</CardTitle>
                <CardDescription>
                  Configure how you want to be notified.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="notificationsEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Push Notifications</FormLabel>
                        <FormDescription>Get pinged when a session ends.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="soundEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Timer Sounds</FormLabel>
                        <FormDescription>Play a tone when the timer completes.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Default Timer Settings */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Default Timer Durations</CardTitle>
                <CardDescription>
                  Set your default Pomodoro session lengths (in minutes).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <FormField
                    control={form.control}
                    name="focusDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Focus Length</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={180} {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="shortBreak"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Break</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={60} {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="longBreak"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Long Break</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={90} {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="longBreakInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Long Break After</FormLabel>
                        <FormDescription className="text-[10px]">Sessions</FormDescription>
                        <FormControl>
                          <Input type="number" min={1} max={10} {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-6">
                  <FormField
                    control={form.control}
                    name="autoStartBreak"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Auto-start Breaks</FormLabel>
                          <FormDescription>Automatically begin breaks when focus ends.</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="autoStartFocus"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Auto-start Focus</FormLabel>
                          <FormDescription>Automatically begin focus when breaks end.</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving} size="lg">
              {isSaving ? "Saving..." : "Save All Settings"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
