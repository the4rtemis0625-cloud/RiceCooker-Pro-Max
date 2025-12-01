
"use client";

import { useEffect } from "react";
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
import { useLocalStorage } from "@/hooks/use-local-storage";

interface ControlPanelProps {
    initialDeviceId: string | null;
}

export function ControlPanel({ initialDeviceId }: ControlPanelProps) {
  const [deviceId, setDeviceId] = useLocalStorage<string | null>('ricecooker-deviceId', initialDeviceId);
  const { toast } = useToast();
  const database = useDatabase();
  const auth = useAuth();

  const { device, durations, loading, error, setDurations, addWater, dispenseRice, cookDevice, cancelDevice } = useDevice(deviceId);

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
            status={currentDevice.status as any}
            deviceId={deviceId ?? ""}
        />

        <div className={cn(!isConnected && "opacity-50 pointer-events-none")}>
            <SettingsPanel
              durations={durations}
              setDurations={setDurations}
              isDisabled={isRunning || !isConnected}
            />
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
  );
}
