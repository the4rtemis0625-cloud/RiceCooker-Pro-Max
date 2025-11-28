"use client";

import type { DeviceState } from "@/hooks/use-device";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CheckCircle, Loader, XCircle, Thermometer, Wheat, Droplets, Utensils, WifiOff } from "lucide-react";

const statusConfig = {
  READY: { text: "SYSTEM READY", icon: CheckCircle, color: "text-primary" },
  DISPENSING: { text: "DISPENSING RICE", icon: Wheat, color: "text-accent-foreground" },
  WASHING: { text: "WASHING CYCLE", icon: Droplets, color: "text-accent-foreground" },
  COOKING: { text: "COOKING", icon: Thermometer, color: "text-accent-foreground" },
  DONE: { text: "COOKING COMPLETE", icon: Utensils, color: "text-primary" },
  CANCELED: { text: "OPERATION CANCELED", icon: XCircle, color: "text-destructive" },
  NOT_CONNECTED: { text: "NOT CONNECTED", icon: WifiOff, color: "text-muted-foreground" },
};

type StatusDisplayProps = {
  status: DeviceState['status'];
  timeRemaining: number;
  progress: number;
  deviceId: string;
};

export function StatusDisplay({ status, timeRemaining, progress, deviceId }: StatusDisplayProps) {
  const safeStatus = status || 'NOT_CONNECTED';
  const { text, icon: Icon, color } = statusConfig[safeStatus];
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const isRunning = safeStatus === "DISPENSING" || safeStatus === "WASHING" || safeStatus === "COOKING";
  const isConnected = safeStatus !== 'NOT_CONNECTED';

  return (
    <Card className={cn(
        "text-center border-primary/20",
        isRunning && "bg-accent border-accent shadow-lg",
        !isConnected && "bg-muted/50"
      )}>
      <CardHeader>
        <CardTitle className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
          Current Status
        </CardTitle>
        <CardDescription className="font-mono text-xs text-muted-foreground/50 pt-1">
            Device ID: {isConnected ? deviceId : 'N/A'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center gap-4">
          <Icon className={cn("h-8 w-8", color, isRunning && "animate-spin")} />
          <h2 className={cn("text-3xl font-bold font-mono tracking-wider", isRunning ? 'text-accent-foreground' : 'text-foreground')}>
            {text}
            { isConnected && <span className="blinking-cursor ml-1">_</span> }
          </h2>
        </div>
        
        <div className="h-16">
          {isRunning && (
            <div className="space-y-2">
              <p className={cn("font-mono text-5xl font-bold", isRunning ? 'text-accent-foreground' : 'text-foreground')}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </p>
              <Progress value={progress} className="w-full h-2 bg-primary/20" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
