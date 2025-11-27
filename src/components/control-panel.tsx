"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ActionButtons } from "./rice-cooker/action-buttons";
import { SettingsPanel } from "./rice-cooker/settings-panel";
import { StatusDisplay } from "./rice-cooker/status-display";
import { DeviceConnection } from "./rice-cooker/device-connection";
import { cn } from "@/lib/utils";

export type Status = "READY" | "DISPENSING" | "WASHING" | "COOKING" | "DONE" | "CANCELED" | "NOT_CONNECTED";

export function ControlPanel() {
  const [status, setStatus] = useState<Status>("NOT_CONNECTED");
  const [dispenseDuration, setDispenseDuration] = useState(5);
  const [washDuration, setWashDuration] = useState(15);
  const [cookDuration, setCookDuration] = useState(30);

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const [deviceId, setDeviceId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearCurrentInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleConnect = () => {
    if(deviceId) {
      setIsConnected(true);
      setStatus("READY");
    }
  };

  const handleDisconnect = () => {
    handleCancel(); // Also cancel any running operation
    setIsConnected(false);
    setDeviceId("");
    setStatus("NOT_CONNECTED");
  };

  const handleStart = () => {
    if (status === "READY" || status === "DONE" || status === "CANCELED") {
      setStatus("DISPENSING");
    }
  };

  const handleCancel = () => {
    clearCurrentInterval();
    if(isConnected) {
      setStatus("CANCELED");
    }
  };

  useEffect(() => {
    if (!isConnected) {
      setStatus("NOT_CONNECTED");
      return;
    }

    if (status === "DONE" || status === "CANCELED") {
      const timeout = setTimeout(() => {
        setStatus("READY");
      }, 3000);
      return () => clearTimeout(timeout);
    }

    if (status === "READY") {
      setProgress(0);
      setTimeRemaining(0);
      return;
    }
    
    clearCurrentInterval();

    let duration = 0;
    let nextStatus: Status | null = null;

    switch (status) {
      case "DISPENSING":
        duration = dispenseDuration;
        nextStatus = "WASHING";
        break;
      case "WASHING":
        duration = washDuration;
        nextStatus = "COOKING";
        break;
      case "COOKING":
        duration = cookDuration;
        nextStatus = "DONE";
        break;
    }
    
    if (duration > 0) {
      setTimeRemaining(duration);
      setProgress(0);

      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          const currentProgress = ((duration - newTime) / duration) * 100;
          setProgress(currentProgress);

          if (newTime <= 0) {
            clearCurrentInterval();
            if (nextStatus) setStatus(nextStatus);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => clearCurrentInterval();
  }, [status, dispenseDuration, washDuration, cookDuration, clearCurrentInterval, isConnected]);

  const isRunning = status === "DISPENSING" || status === "WASHING" || status === "COOKING";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 space-y-4">
      <div className="w-full max-w-2xl space-y-8">
        <DeviceConnection 
            deviceId={deviceId}
            setDeviceId={setDeviceId}
            isConnected={isConnected}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
        />
        <StatusDisplay 
            status={status} 
            timeRemaining={timeRemaining} 
            progress={progress}
            deviceId={deviceId}
        />
        <div className={cn(!isConnected && "opacity-50 pointer-events-none")}>
            <SettingsPanel 
              durations={{ dispenseDuration, washDuration, cookDuration }}
              setDurations={{ setDispenseDuration, setWashDuration, setCookDuration }}
              isDisabled={isRunning || !isConnected}
            />
            <ActionButtons onStart={handleStart} onCancel={handleCancel} isRunning={isRunning} isDisabled={!isConnected} />
        </div>
      </div>
    </main>
  );
}
