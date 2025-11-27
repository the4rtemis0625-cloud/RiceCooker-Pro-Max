"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plug, PlugZap } from "lucide-react";
import { cn } from "@/lib/utils";


type DeviceConnectionProps = {
    deviceId: string;
    setDeviceId: (id: string) => void;
    isConnected: boolean;
    onConnect: () => void;
    onDisconnect: () => void;
};

export function DeviceConnection({ deviceId, setDeviceId, isConnected, onConnect, onDisconnect }: DeviceConnectionProps) {
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
                    <Label htmlFor="device-id" className="text-muted-foreground">Device ID</Label>
                    <Input 
                        id="device-id"
                        placeholder="Enter your Device ID"
                        value={deviceId}
                        onChange={(e) => setDeviceId(e.target.value)}
                        disabled={isConnected}
                        className="font-mono tracking-wider"
                    />
                </div>
                {isConnected ? (
                    <Button onClick={onDisconnect} variant="destructive" className="self-end">
                        <PlugZap className="mr-2" /> Disconnect
                    </Button>
                ) : (
                    <Button onClick={onConnect} disabled={!deviceId} className="self-end">
                        <Plug className="mr-2" /> Connect
                    </Button>
                )}
            </div>
        </CardContent>
    </Card>
  );
}
