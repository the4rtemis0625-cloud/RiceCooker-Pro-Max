
"use client";

import { useEffect } from "react";
import { ActionButtons } from "./rice-cooker/action-buttons";
import { SettingsPanel } from "./rice-cooker/settings-panel";
import { StatusDisplay } from "./rice-cooker/status-display";
import { cn } from "@/lib/utils";
import { type DeviceState, useDevice } from "@/hooks/use-device";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface ControlPanelProps {
    activeDeviceId: string | null;
}

export function ControlPanel({ activeDeviceId }: ControlPanelProps) {
  const { toast } = useToast();
  const { device, durations, loading, error, setDurations, addWater, dispenseRice, cookDevice, cancelDevice } = useDevice(activeDeviceId);
  
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

  if (loading && activeDeviceId) {
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
        <StatusDisplay
            status={currentDevice.status as any}
            deviceId={activeDeviceId ?? ""}
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
