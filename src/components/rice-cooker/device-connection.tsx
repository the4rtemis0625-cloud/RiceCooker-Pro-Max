"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plug, PlugZap, Save } from "lucide-react";


type DeviceConnectionProps = {
    deviceId: string | null;
    onSave: (id: string) => void;
    onDisconnect: () => void;
    userId: string;
};

export function DeviceConnection({ deviceId, onSave, onDisconnect }: DeviceConnectionProps) {
  const [inputDeviceId, setInputDeviceId] = useState("");
  
  const handleSave = () => {
    if (inputDeviceId.trim()) {
        onSave(inputDeviceId.trim());
    }
  }

  if (deviceId) {
    return (
        <Card className="border-primary/20">
            <CardHeader>
                <CardTitle className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
                    Device Connection
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <div className="flex-grow space-y-2">
                        <Label htmlFor="device-id-display" className="text-muted-foreground">Connected Device ID</Label>
                        <p id="device-id-display" className="font-mono tracking-wider text-lg h-10 flex items-center">{deviceId}</p>
                    </div>
                    <Button onClick={onDisconnect} variant="destructive" className="self-end">
                        <PlugZap className="mr-2" /> Change Device
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="border-primary/20">
        <CardHeader>
            <CardTitle className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
                Connect Your Device
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex items-center gap-4">
                <div className="flex-grow space-y-2">
                    <Label htmlFor="device-id-input" className="text-muted-foreground">Enter Your Device ID</Label>
                    <Input 
                        id="device-id-input"
                        placeholder="e.g., ricecooker_A4A9A9DAF380"
                        value={inputDeviceId}
                        onChange={(e) => setInputDeviceId(e.target.value)}
                        className="font-mono tracking-wider"
                    />
                </div>
                <Button onClick={handleSave} disabled={!inputDeviceId.trim()} className="self-end">
                    <Save className="mr-2" /> Save & Connect
                </Button>
            </div>
        </CardContent>
    </Card>
  );
}
