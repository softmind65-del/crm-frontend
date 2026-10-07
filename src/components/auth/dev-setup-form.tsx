"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  validateDevIdentity,
  sanitizeReturnPath,
} from "@/lib/auth/dev-session-shared";

export function DevSetupForm() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");

  const [name, setName] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validation = validateDevIdentity(name);

    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      const response = await fetch("/api/dev-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identity: validation.value,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "Failed to start development session.");
        setIsLoading(false);
        return;
      }

      // Hard redirect ensures Server Components immediately evaluate newly set HTTP-only cookies
      const targetDestination = sanitizeReturnPath(nextParam);
      window.location.href = targetDestination;
    } catch {
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Identity Input */}
      <div>
        <Input
          id="dev-setup-name"
          label="Development user"
          placeholder="e.g. Jhon or dev-user-001"
          helperText="Temporary development profile. This will be replaced by Keycloak."
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(undefined);
          }}
          error={error}
          required
          autoFocus
          disabled={isLoading}
        />
      </div>

      {/* Submit Action */}
      <Button
        type="submit"
        variant="primary"
        size="md"
        className="w-full h-10"
        isLoading={isLoading}
      >
        Continue
      </Button>

      
    </form>
  );
}
