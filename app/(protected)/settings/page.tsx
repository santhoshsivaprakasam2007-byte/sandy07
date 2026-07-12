"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";

export default function Settings() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-1">
          Customize your experience and preferences.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize the look and feel of the application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">Select light, dark, or system mode.</p>
              </div>
              <Button variant="outline" size="sm">System</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Configure how you want to receive alerts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive weekly progress summaries.</p>
              </div>
              {/* Requires a switch component, using a button for now */}
              <Button variant="outline" size="sm" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">Enabled</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Study Reminders</p>
                <p className="text-sm text-muted-foreground">Get pinged before scheduled sessions.</p>
              </div>
              <Button variant="outline" size="sm" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">Enabled</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacy & Data</CardTitle>
            <CardDescription>
              Manage your data and privacy settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Analytics Tracking</p>
                <p className="text-sm text-muted-foreground">Help us improve by sharing usage data.</p>
              </div>
              <Button variant="outline" size="sm">Disabled</Button>
            </div>
            <div className="pt-4 border-t border-border">
              <Button variant="outline" className="w-full">Export My Data</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
