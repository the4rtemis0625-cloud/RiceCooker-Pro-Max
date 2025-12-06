
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";

interface DeviceFormProps {
  currentDeviceId?: string;
  onSubmit: (deviceId: string) => Promise<void>;
}

export function DeviceForm({ currentDeviceId, onSubmit }: DeviceFormProps) {
  const [deviceId, setDeviceId] = useState(currentDeviceId || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setDeviceId(currentDeviceId || "");
  }, [currentDeviceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceId.trim() || deviceId.trim() === currentDeviceId) return;

    setIsSubmitting(true);
    await onSubmit(deviceId.trim());
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{currentDeviceId ? "Update Device Registration" : "Register a New Device"}</CardTitle>
        <CardDescription>
          {currentDeviceId 
            ? "Enter a new Device ID to link to your account."
            : "Enter the Device ID to link a new device to your account."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="device-id">Device ID</Label>
            <Input
              id="device-id"
              placeholder="e.g., ricecooker_A4A9A9DAF380"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="font-mono"
            />
          </div>
          <Button type="submit" disabled={isSubmitting || !deviceId.trim() || deviceId.trim() === currentDeviceId}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
