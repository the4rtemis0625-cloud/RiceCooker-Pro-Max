
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useDatabase } from "@/firebase";
import {
  ref,
  onValue,
  off,
  set,
  update,
  serverTimestamp,
} from "firebase/database";
import { useToast } from "./use-toast";

export type Status =
  | "READY"
  | "DISPENSING"
  | "WASHING"
  | "COOKING"
  | "DONE"
  | "CANCELED"
  | "NOT_CONNECTED"
  | "SENDING_COMMAND";

export interface DeviceSettings {
  pumpTime: number;
  dispenseTime: number;
  cookTime: number;
}

export interface DeviceState {
  status: Status;
  settings: DeviceSettings;
  lastUpdated: number;
  queue?: string[]; // Field for sending commands
  currentAction?: 'dispense rice' | 'add water' | 'cook' | null;
  currentStage?: {
    name: "DISPENSING" | "WASHING" | "COOKING";
    startTime: number;
    duration: number;
  } | null;
  timeRemaining?: number;
  progress?: number;
}

const defaultSettings: DeviceSettings = {
  pumpTime: 5,
  dispenseTime: 10,
  cookTime: 30,
};

export function useDevice(deviceId: string | null) {
  const database = useDatabase();
  const { toast } = useToast();
  const [device, setDevice] = useState<DeviceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeoutError, setTimeoutError] = useState(false);
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const commandTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to show toast on timeout error
  useEffect(() => {
    if (timeoutError) {
      toast({
        variant: "destructive",
        title: "Device Connection Timeout",
        description: "The device did not respond. Please check its connection and try again.",
      });
      setTimeoutError(false); // Reset the error state
    }
  }, [timeoutError, toast]);

  // Function to send a command object to the RTDB
  const sendCommandToQueue = useCallback((queue: string[]) => {
    if (!deviceId || !database) return;
    const deviceQueueRef = ref(database, `devices/${deviceId}/queue`);
    set(deviceQueueRef, queue).catch((err) => {
      console.error("Failed to send command:", err);
      setError(err.message || "Failed to send command to device.");
    });
  }, [deviceId, database]);


  const clearCurrentInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Effect to listen for device state changes from RTDB
  useEffect(() => {
    if (!database) {
      setLoading(false);
      return;
    }

    if (!deviceId) {
      setDevice({
        status: "NOT_CONNECTED",
        settings: defaultSettings,
        lastUpdated: Date.now(),
      });
      setLoading(false);
      clearCurrentInterval();
      return;
    }

    setLoading(true);
    setError(null);
    const dbRef = ref(database, `devices/${deviceId}`);

    const listener = onValue(
      dbRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val() as DeviceState;
          
          const saneSettings: DeviceSettings = {
            pumpTime: typeof data.settings?.pumpTime === 'number' ? data.settings.pumpTime : defaultSettings.pumpTime,
            dispenseTime: typeof data.settings?.dispenseTime === 'number' ? data.settings.dispenseTime : defaultSettings.dispenseTime,
            cookTime: typeof data.settings?.cookTime === 'number' ? data.settings.cookTime : defaultSettings.cookTime,
          };
          
          let newStatus = data.status;

          // Map currentAction to status
          if (data.currentAction) {
            switch(data.currentAction) {
              case 'dispense rice':
                newStatus = 'DISPENSING';
                break;
              case 'add water':
                newStatus = 'WASHING';
                break;
              case 'cook':
                newStatus = 'COOKING';
                break;
              default:
                // If currentAction is null or something else, check the old status field
                if (data.status === "Online – Queue Ready" as any || data.status === "Online - Queue Ready" as any) {
                  newStatus = "READY";
                }
                break;
            }
          } else {
             if (data.status === "Online – Queue Ready" as any || data.status === "Online - Queue Ready" as any) {
                newStatus = "READY";
            }
          }

          setDevice({ ...data, status: newStatus, settings: saneSettings });

        } else {
          const defaultState: Partial<DeviceState> & { settings: DeviceSettings } = {
            status: "READY",
            settings: defaultSettings,
            lastUpdated: serverTimestamp() as any,
          };
          set(dbRef, defaultState)
            .then(() => setDevice({ ...defaultState, lastUpdated: Date.now() } as DeviceState))
            .catch((err) => {
                console.error("Failed to create device state in RTDB:", err);
                setError(err.message || "Could not initialize device state.");
            });
        }
        setLoading(false);
      },
      (err: any) => {
        console.error(err);
        let errorMessage =
          "Could not connect to device. Check the device ID and your connection.";
        if (err.code === "PERMISSION_DENIED") {
          errorMessage =
            "Permission denied. You do not have access to this device's data.";
        }
        setError(errorMessage);
        setDevice({
          status: "NOT_CONNECTED",
          settings: device?.settings ?? defaultSettings,
          lastUpdated: Date.now(),
        });
        setLoading(false);
      }
    );

    return () => {
      off(dbRef, "value", listener);
      clearCurrentInterval();
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current);
      }
    };
  }, [deviceId, database, clearCurrentInterval]);

  useEffect(() => {
    clearCurrentInterval();

    if (
      device?.currentStage?.startTime &&
      device.status !== "READY" &&
      device.status !== "DONE" &&
      device.status !== "CANCELED" &&
      device.status !== "NOT_CONNECTED" &&
      device.status !== "SENDING_COMMAND"
    ) {
      const { startTime, duration } = device.currentStage;
      
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = (now - startTime) / 1000;
        const remaining = Math.max(0, duration - elapsed);
        const progress = Math.min(100, (elapsed / duration) * 100);

        setDevice((prev) => prev ? { ...prev, timeRemaining: Math.round(remaining), progress } : null);

        if (remaining <= 0) {
            clearCurrentInterval();
        }
      }, 500); 
    }

    // If the status is no longer "SENDING_COMMAND", clear the timeout.
    if (device?.status !== "SENDING_COMMAND" && commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current);
        commandTimeoutRef.current = null;
    }


    return () => clearCurrentInterval();
  }, [device?.status, device?.currentStage, clearCurrentInterval]);


  const setDurations = useCallback((newSettings: Partial<DeviceSettings>) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    setDevice(prev => prev ? { ...prev, settings: { ...prev.settings, ...newSettings } } : null);

    debounceTimeoutRef.current = setTimeout(() => {
      if (!deviceId || !database) return;

      const currentSettings = device?.settings || defaultSettings;
      const updatedSettings = { ...currentSettings, ...newSettings };

      const dbRef = ref(database, `devices/${deviceId}/settings`);
      update(dbRef, updatedSettings).catch((err) => {
        console.error("Failed to update settings in RTDB:", err);
        setError(err.message || "Failed to save settings.");
      });
    }, 500);
  }, [deviceId, database, device?.settings]);

  const startCommandTimeout = () => {
    if (commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current);
    }
    commandTimeoutRef.current = setTimeout(() => {
        setDevice((prev) => {
            if (prev?.status === "SENDING_COMMAND") {
                setTimeoutError(true);
                return { ...prev, status: "READY" };
            }
            return prev;
        });
    }, 10000); // 10 seconds
  };

  const startDevice = () => {
    const currentStatus = device?.status;
    if (currentStatus === 'READY' || currentStatus === 'DONE' || currentStatus === 'CANCELED') {
      setDevice(prev => prev ? { ...prev, status: 'SENDING_COMMAND' } : null);
      startCommandTimeout();
      const queue = ["add water", "dispense rice"];
      sendCommandToQueue(queue);
    }
  };

  const cookDevice = () => {
    const currentStatus = device?.status;
    if (currentStatus === 'READY' || currentStatus === 'DONE' || currentStatus === 'CANCELED') {
      setDevice(prev => prev ? { ...prev, status: 'SENDING_COMMAND' } : null);
      startCommandTimeout();
      const queue = ["cook"];
      sendCommandToQueue(queue);
    }
  };

  const cancelDevice = () => {
    const currentStatus = device?.status;
    if (
      currentStatus === "DISPENSING" ||
      currentStatus === "WASHING" ||
      currentStatus === "COOKING"
    ) {
      setDevice(prev => prev ? { ...prev, status: 'SENDING_COMMAND' } : null);
      startCommandTimeout();
      // To cancel, we send an empty queue.
      sendCommandToQueue([]);
    }
  };

  return {
    device,
    loading,
    error,
    setDurations,
    startDevice,
    cookDevice,
    cancelDevice,
  };
}
