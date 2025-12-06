
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";

interface DeviceFormProps {
  onSubmit: (deviceId: string) => Promise<void>;
}

export function DeviceForm({ onSubmit }: DeviceFormProps) {
  const [deviceId, setDeviceId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceId.trim()) return;

    setIsSubmitting(true);
    await onSubmit(deviceId.trim());
    setIsSubmitting(false);
    setDeviceId(""); // Clear input after submission
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register a New Device</CardTitle>
        <CardDescription>
          Enter the Device ID found on your RiceCooker to link it to your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex items-end gap-4">
          <div className="flex-grow space-y-2">
            <Label htmlFor="device-id">Device ID</Label>
            <Input
              id="device-id"
              placeholder="e.g., ricecooker_A4A9A9DAF380"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="font-mono"
              disabled={isSubmitting}
            />
          </div>
          <Button type="submit" disabled={isSubmitting || !deviceId.trim()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {isSubmitting ? "Adding..." : "Add Device"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
