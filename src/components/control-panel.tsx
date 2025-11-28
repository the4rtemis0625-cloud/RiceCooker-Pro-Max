"use client";

import { useState } from "react";
import { ActionButtons } from "./rice-cooker/action-buttons";
import { SettingsPanel } from "./rice-cooker/settings-panel";
import { StatusDisplay } from "./rice-cooker/status-display";
import { DeviceConnection } from "./rice-cooker/device-connection";
import { cn } from "@/lib/utils";
import { useDevice, type Status } from "@/hooks/use-device";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export function ControlPanel() {
  const [deviceId, setDeviceId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  const { device, loading, error, setDurations, startDevice, cancelDevice } =
    useDevice(isConnected ? deviceId : null);

  const handleConnect = () => {
    if (deviceId) {
      setIsConnected(true);
    }
  };

  const handleDisconnect = () => {
    cancelDevice(); // Also cancel any running operation
    setIsConnected(false);
    // Don't clear deviceId, so user can easily reconnect
  };

  if (error) {
    toast({
        variant: 'destructive',
        title: "Connection Error",
        description: error,
    });
    // Reset connection state on error
    if (isConnected) {
        setIsConnected(false);
    }
  }
  
  const status: Status = device?.status ?? (isConnected ? 'READY' : 'NOT_CONNECTED');
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
        {loading && isConnected ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <>
            <StatusDisplay
              status={status}
              timeRemaining={device?.timeRemaining ?? 0}
              progress={device?.progress ?? 0}
              deviceId={isConnected ? deviceId : ""}
            />
            <div className={cn(!isConnected && "opacity-50 pointer-events-none")}>
              <SettingsPanel
                durations={
                  device?.settings ?? {
                    dispenseDuration: 5,
                    washDuration: 15,
                    cookDuration: 30,
                  }
                }
                setDurations={setDurations}
                isDisabled={isRunning || !isConnected}
              />
              <ActionButtons
                onStart={startDevice}
                onCancel={cancelDevice}
                isRunning={isRunning}
                isDisabled={!isConnected || status === 'CANCELED'}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
