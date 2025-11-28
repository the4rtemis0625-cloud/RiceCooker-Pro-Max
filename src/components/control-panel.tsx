"use client";

import { useEffect, useState } from "react";
import { ActionButtons } from "./rice-cooker/action-buttons";
import { SettingsPanel } from "./rice-cooker/settings-panel";
import { StatusDisplay } from "./rice-cooker/status-display";
import { DeviceConnection } from "./rice-cooker/device-connection";
import { cn } from "@/lib/utils";
import { useDevice, type Status, type DeviceSettings } from "@/hooks/use-device";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface ControlPanelProps {
    initialDeviceId: string | null;
    userId: string;
}

export function ControlPanel({ initialDeviceId, userId }: ControlPanelProps) {
  const [deviceId, setDeviceId] = useState(initialDeviceId);
  const { toast } = useToast();

  const { device, loading, error, setDurations, startDevice, cancelDevice, updateDeviceId } =
    useDevice(deviceId);

  // When the user saves a new device ID, update it in the state and the hook
  const handleSaveDeviceId = (newDeviceId: string) => {
    updateDeviceId(userId, newDeviceId);
    setDeviceId(newDeviceId);
  };

  const handleDisconnect = () => {
    if (device && (device.status === 'DISPENSING' || device.status === 'WASHING' || device.status === 'COOKING')) {
        cancelDevice();
    }
    // This doesn't actually "disconnect" in the new model, but allows changing the device
    // For this app, we'll treat it as a way to clear the device for a new one.
    updateDeviceId(userId, null);
    setDeviceId(null);
  };
  
  useEffect(() => {
    if (error) {
        toast({
            variant: 'destructive',
            title: "Device Error",
            description: error,
        });
    }
  }, [error, toast]);
  
  const status: Status = device?.status ?? (deviceId ? 'READY' : 'NOT_CONNECTED');
  const isRunning = status === "DISPENSING" || status === "WASHING" || status === "COOKING";
  const isConnected = !!deviceId;


  if (loading && isConnected) {
    return (
        <div className="w-full max-w-2xl space-y-8">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-8">
        <DeviceConnection
            deviceId={deviceId}
            onSave={handleSaveDeviceId}
            onDisconnect={handleDisconnect}
            userId={userId}
        />
        
        <StatusDisplay
            status={status}
            timeRemaining={device?.timeRemaining ?? 0}
            progress={device?.progress ?? 0}
            deviceId={deviceId ?? ""}
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
    </div>
  );
}
