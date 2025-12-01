
"use client";

import type { DeviceState } from "@/hooks/use-device";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle, Loader, XCircle, Thermometer, Wheat, Droplets, Utensils, WifiOff, PlugZap, Hourglass } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const statusConfig = {
  READY: { text: "SYSTEM READY", icon: CheckCircle, color: "text-primary" },
  SENDING_COMMAND: { text: "SENDING...", icon: Hourglass, color: "text-accent-foreground" },
  DISPENSING: { text: "Dispensing Rice", icon: Wheat, color: "text-accent-foreground" },
  WASHING: { text: "Adding Water", icon: Droplets, color: "text-accent-foreground" },
  COOKING: { text: "COOKING", icon: Thermometer, color: "text-accent-foreground" },
  DONE: { text: "COOKING COMPLETE", icon: Utensils, color: "text-primary" },
  CANCELED: { text: "OPERATION CANCELED", icon: XCircle, color: "text-destructive" },
  NOT_CONNECTED: { text: "NOT CONNECTED", icon: WifiOff, color: "text-muted-foreground" },
};

type StatusDisplayProps = {
  status: DeviceState['status'];
  deviceId: string;
};

export function StatusDisplay({ status, deviceId }: StatusDisplayProps) {
  const safeStatus = status || 'NOT_CONNECTED';
  const config = statusConfig[safeStatus as keyof typeof statusConfig] || statusConfig.NOT_CONNECTED;
  const { text, icon: Icon, color } = config;
  
  const isRunning = safeStatus === "DISPENSING" || safeStatus === "WASHING" || safeStatus === "COOKING";
  const isConnecting = safeStatus === "SENDING_COMMAND";
  const isConnected = safeStatus !== 'NOT_CONNECTED';

  return (
    <Card className={cn(
        "text-center border-primary/20 relative overflow-hidden",
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
      <CardContent className="space-y-6 pb-6">

        {/* Animation Layer */}
        <div className="absolute inset-0 z-0 opacity-20">
          {(safeStatus === "WASHING" || safeStatus === "DISPENSING") && (
            <>
              <Droplets className="absolute h-6 w-6 top-0 -translate-y-full animate-fall" style={{ left: '10%', animationDelay: '0s' }} />
              <Wheat className="absolute h-6 w-6 top-0 -translate-y-full animate-fall" style={{ left: '15%', animationDelay: '0.1s' }} />
              <Droplets className="absolute h-6 w-6 top-0 -translate-y-full animate-fall" style={{ left: '30%', animationDelay: '0.5s' }} />
              <Wheat className="absolute h-6 w-6 top-0 -translate-y-full animate-fall" style={{ left: '35%', animationDelay: '0.6s' }} />
              <Droplets className="absolute h-6 w-6 top-0 -translate-y-full animate-fall" style={{ left: '50%', animationDelay: '0.2s' }} />
              <Wheat className="absolute h-6 w-6 top-0 -translate-y-full animate-fall" style={{ left: '55%', animationDelay: '0.3s' }} />
              <Droplets className="absolute h-6 w-6 top-0 -translate-y-full animate-fall" style={{ left: '70%', animationDelay: '0.8s' }} />
              <Wheat className="absolute h-6 w-6 top-0 -translate-y-full animate-fall" style={{ left: '75%', animationDelay: '0.9s' }} />
              <Droplets className="absolute h-6 w-6 top-0 -translate-y-full animate-fall" style={{ left: '90%', animationDelay: '0.4s' }} />
              <Wheat className="absolute h-6 w-6 top-0 -translate-y-full animate-fall" style={{ left: '95%', animationDelay: '0.5s' }} />
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 relative z-10 min-h-[7rem]">
          <Icon className={cn("h-8 w-8", color, (isRunning && safeStatus === 'COOKING') && "animate-spin")} />
          <h2 className={cn("text-3xl font-bold font-mono tracking-wider", isRunning ? 'text-accent-foreground' : 'text-foreground')}>
            {text}
            { (isConnected && !isRunning) && <span className="blinking-cursor ml-1">_</span> }
          </h2>
        </div>
        
      </CardContent>
    </Card>
  );
}
