"use client";

import { useEffect, useState } from "react";
import { ActionButtons } from "./rice-cooker/action-buttons";
import { SettingsPanel } from "./rice-cooker/settings-panel";
import { StatusDisplay } from "./rice-cooker/status-display";
import { DeviceConnection } from "./rice-cooker/device-connection";
import { cn } from "@/lib/utils";
import { useDevice, type DeviceState } from "@/hooks/use-device";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useDatabase } from "@/firebase";
import { ref, update } from "firebase/database";

interface ControlPanelProps {
    initialDeviceId: string | null;
}

export function ControlPanel({ initialDeviceId }: ControlPanelProps) {
  const [deviceId, setDeviceId] = useState(initialDeviceId);
  const { toast } = useToast();
  const database = useDatabase();
  const auth = useAuth();

  const { device, loading, error, setDurations, startDevice, cancelDevice } = useDevice(deviceId);

  const updateDeviceIdInUserProfile = (newDeviceId: string | null) => {
    const user = auth?.currentUser;
    if (!user || !database) return;
    const userRef = ref(database, `users/${user.uid}`);
    
    update(userRef, { deviceId: newDeviceId })
        .then(() => {
            setDeviceId(newDeviceId);
        })
        .catch((err) => {
            console.error("Error updating device ID:", err);
            toast({
                variant: 'destructive',
                title: "Error saving device",
                description: err.message || "Could not update the device ID in your profile.",
            });
        });
  };

  const handleSaveDeviceId = (newDeviceId: string) => {
    updateDeviceIdInUserProfile(newDeviceId);
  };

  const handleDisconnect = () => {
    if (device && (device.status === 'DISPENSING' || device.status === 'WASHING' || device.status === 'COOKING')) {
        cancelDevice();
    }
    updateDeviceIdInUserProfile(null);
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
  
  const currentDevice = device ?? { status: 'NOT_CONNECTED' } as DeviceState;
  const isRunning = currentDevice.status === "DISPENSING" || currentDevice.status === "WASHING" || currentDevice.status === "COOKING";
  const isConnected = currentDevice.status !== 'NOT_CONNECTED';

  if (loading && deviceId) {
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
        />
        
        <StatusDisplay
            status={currentDevice.status}
            timeRemaining={currentDevice.timeRemaining ?? 0}
            progress={currentDevice.progress ?? 0}
            deviceId={deviceId ?? ""}
        />

        <div className={cn(!isConnected && "opacity-50 pointer-events-none")}>
            <SettingsPanel
            durations={
                currentDevice.settings ?? {
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
            isDisabled={!isConnected || currentDevice.status === 'CANCELED'}
            />
        </div>
    </div>
  );
}
