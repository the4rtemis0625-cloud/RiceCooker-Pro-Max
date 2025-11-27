"use client";

import type { Status } from "../control-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CheckCircle, Loader, XCircle, Thermometer, Wheat, Droplets, Utensils } from "lucide-react";

const statusConfig = {
  READY: { text: "SYSTEM READY", icon: CheckCircle, color: "text-primary" },
  DISPENSING: { text: "DISPENSING RICE", icon: Wheat, color: "text-accent" },
  WASHING: { text: "WASHING CYCLE", icon: Droplets, color: "text-accent" },
  COOKING: { text: "COOKING", icon: Thermometer, color: "text-accent" },
  DONE: { text: "COOKING COMPLETE", icon: Utensils, color: "text-primary" },
  CANCELED: { text: "OPERATION CANCELED", icon: XCircle, color: "text-destructive" },
};

type StatusDisplayProps = {
  status: Status;
  timeRemaining: number;
  progress: number;
};

export function StatusDisplay({ status, timeRemaining, progress }: StatusDisplayProps) {
  const { text, icon: Icon, color } = statusConfig[status];
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const isRunning = status === "DISPENSING" || status === "WASHING" || status === "COOKING";

  return (
    <Card className={cn(
        "text-center border-primary/20",
        isRunning && "border-accent/30 shadow-lg"
      )}>
      <CardHeader>
        <CardTitle className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
          Current Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center gap-4">
          <Icon className={cn("h-8 w-8", color, isRunning && "animate-spin")} />
          <h2 className="text-3xl font-bold font-mono tracking-wider text-foreground">
            {text}
            <span className="blinking-cursor ml-1">_</span>
          </h2>
        </div>
        
        <div className="h-16">
          {isRunning && (
            <div className="space-y-2">
              <p className="font-mono text-5xl font-bold text-accent">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </p>
              <Progress value={progress} className="w-full h-2 bg-primary/10" indicatorClassName="bg-accent" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
