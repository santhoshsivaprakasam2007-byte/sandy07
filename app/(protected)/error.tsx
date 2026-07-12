"use client";

import { useEffect } from "react";
import { Button } from "../../components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <span className="material-symbols-outlined text-destructive text-3xl">
          warning
        </span>
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Something went wrong!</h2>
        <p className="text-muted-foreground max-w-[500px]">
          We encountered an error while loading this page. This might be due to a network issue or missing data.
        </p>
      </div>
      <Button onClick={() => reset()} variant="default" className="min-w-[120px]">
        Try again
      </Button>
    </div>
  );
}
