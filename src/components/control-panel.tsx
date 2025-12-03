
"use client";

import { useEffect, useState } from "react";
import { ActionButtons } from "./rice-cooker/action-buttons";
import { SettingsPanel } from "./rice-cooker/settings-panel";
import { StatusDisplay } from "./rice-cooker/status-display";
import { DeviceConnection } from "./rice-cooker/device-connection";
import { cn } from "@/lib/utils";
import { type DeviceState, type DeviceSettings, useDevice } from "@/hooks/use-device";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useDatabase } from "@/firebase";
import { ref, update } from "firebase/database";

interface ControlPanelProps {
    initialDeviceId: string | null;
}

export function ControlPanel({ initialDeviceId }: ControlPanelProps) {
  const [deviceId, setDeviceId] = useState<string | null>(initialDeviceId);
  const { toast } = useToast();
  const database = useDatabase();
  const auth = useAuth();

  const { device, durations, loading, error, setDurations, addWater, dispenseRice, cookDevice, cancelDevice } = useDevice(deviceId);
  
  useEffect(() => {
    // Sync the local state with the one from the user's profile prop
    if (initialDeviceId !== deviceId) {
        setDeviceId(initialDeviceId);
    }
  }, [initialDeviceId, deviceId]);


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
  
  const currentDevice = device ?? { status: 'NOT_CONNECTED' } as Partial<DeviceState>;
  const isConnected = currentDevice.status !== 'NOT_CONNECTED';
  const isRunning = currentDevice.status === "DISPENSING" || currentDevice.status === "WASHING" || currentDevice.status === "COOKING";
  
  const areActionButtonsDisabled = !isConnected || isRunning || currentDevice.status === 'SENDING_COMMAND';

  if (loading && deviceId) {
    return (
        <div className="w-full space-y-8">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
    );
  }

  return (
    <div className="w-full space-y-8">
        <DeviceConnection
            deviceId={deviceId}
            onSave={handleSaveDeviceId}
            onDisconnect={handleDisconnect}
        />
        
        <StatusDisplay
            status={currentDevice.status as any}
            deviceId={deviceId ?? ""}
        />

        <div className={cn("grid grid-cols-1 md:grid-cols-2 md:gap-8", !isConnected && "opacity-50 pointer-events-none")}>
            <div className="space-y-8">
                <SettingsPanel
                  durations={durations}
                  setDurations={setDurations}
                  isDisabled={isRunning || !isConnected}
                />
            </div>
            <div className="mt-8 md:mt-0">
                <ActionButtons
                  status={currentDevice.status as any}
                  onAddWater={addWater}
                  onDispenseRice={dispenseRice}
                  onCook={cookDevice}
                  onCancel={cancelDevice}
                  isRunning={isRunning}
                  isActionDisabled={areActionButtonsDisabled}
                  isConnected={isConnected}
                />
            </div>
        </div>
    </div>
  );
}
