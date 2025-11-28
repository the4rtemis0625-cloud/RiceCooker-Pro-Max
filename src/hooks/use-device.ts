
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
  command?: string; // Field for sending commands
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
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const commandTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to send a command to the RTDB
  const sendCommand = useCallback((command: string) => {
    if (!deviceId || !database) return;
    const deviceRef = ref(database, `devices/${deviceId}`);
    update(deviceRef, { command: command }).catch((err) => {
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
          if (data.status === "Online – Queue Ready" as any || data.status === "Online - Queue Ready" as any) {
            newStatus = "READY";
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
                toast({
                  variant: "destructive",
                  title: "Device Connection Timeout",
                  description: "The device did not respond. Please check its connection and try again.",
                });
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
      sendCommand("start");
    }
  };

  const cookDevice = () => {
    const currentStatus = device?.status;
    if (currentStatus === 'READY' || currentStatus === 'DONE' || currentStatus === 'CANCELED') {
      setDevice(prev => prev ? { ...prev, status: 'SENDING_COMMAND' } : null);
      startCommandTimeout();
      sendCommand("cook");
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
      sendCommand("stop");
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
