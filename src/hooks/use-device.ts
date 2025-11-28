
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

export type Status =
  | "READY"
  | "DISPENSING"
  | "WASHING"
  | "COOKING"
  | "DONE"
  | "CANCELED"
  | "NOT_CONNECTED";

export interface DeviceSettings {
  dispenseDuration: number;
  washDuration: number;
  cookDuration: number;
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
  dispenseDuration: 10,
  washDuration: 5,
  cookDuration: 30,
};

export function useDevice(deviceId: string | null) {
  const database = useDatabase();
  const [device, setDevice] = useState<DeviceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [localSettings, setLocalSettings] = useState<DeviceSettings>(defaultSettings);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to send a command to the RTDB
  const sendCommand = useCallback((command: string) => {
    if (!deviceId || !database) return;
    // Clear previous command before sending a new one
    const commandRef = ref(database, `devices/${deviceId}/command`);
    set(commandRef, command).catch((err) => {
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


  // Effect to sync remote settings to local state
  useEffect(() => {
    if (device?.settings && JSON.stringify(device.settings) !== JSON.stringify(localSettings)) {
      setLocalSettings(device.settings);
    }
  }, [device?.settings, localSettings]);


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
      setLocalSettings(defaultSettings);
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
          setDevice(data);
          if (data.settings && JSON.stringify(data.settings) !== JSON.stringify(localSettings)) {
            setLocalSettings(data.settings);
          }
          setError(null);
        } else {
          // If device doesn't exist, create it with default state
          const defaultState: Partial<DeviceState> = {
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

    // Cleanup listener
    return () => {
      off(dbRef, "value", listener);
      clearCurrentInterval();
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [deviceId, database, clearCurrentInterval, localSettings]);

  // Effect for client-side progress calculation
  useEffect(() => {
    clearCurrentInterval();

    if (
      device?.currentStage?.startTime &&
      device.status !== "READY" &&
      device.status !== "DONE" &&
      device.status !== "CANCELED" &&
      device.status !== "NOT_CONNECTED"
    ) {
      const { startTime, duration } = device.currentStage;
      
      intervalRef.current = setInterval(() => {
        // The ESP32 is the source of truth for status changes.
        // This interval is only for smooth client-side display of time remaining and progress.
        const now = Date.now();
        const elapsed = (now - startTime) / 1000;
        const remaining = Math.max(0, duration - elapsed);
        const progress = Math.min(100, (elapsed / duration) * 100);

        setDevice((prev) => prev ? { ...prev, timeRemaining: Math.round(remaining), progress } : null);

        if (remaining <= 0) {
            // Don't change state here, wait for the device to report the new state.
            // Just clear the interval.
            clearCurrentInterval();
        }
      }, 500); 
    }

    return () => clearCurrentInterval();
  }, [device?.status, device?.currentStage, clearCurrentInterval]);


  const setDurations = useCallback((newSettings: Partial<DeviceSettings>) => {
    const updatedSettings = { ...localSettings, ...newSettings };
    setLocalSettings(updatedSettings);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (!deviceId || !database) return;
      const dbRef = ref(database, `devices/${deviceId}/settings`);
      update(dbRef, updatedSettings).catch((err) => {
        console.error("Failed to update settings in RTDB:", err);
        setError(err.message || "Failed to save settings.");
      });
    }, 300);
  }, [localSettings, deviceId, database]);


  const startDevice = () => {
    // Send "start" command if not currently in an active state.
    if (
      device &&
      device.status !== "DISPENSING" &&
      device.status !== "WASHING" &&
      device.status !== "COOKING"
    ) {
      sendCommand("start");
    }
  };

  const cookDevice = () => {
    if (
      device &&
      device.status !== "DISPENSING" &&
      device.status !== "WASHING" &&
      device.status !== "COOKING"
    ) {
      sendCommand("cook");
    }
  };

  const cancelDevice = () => {
    // Send "stop" command only if it's in an active state.
    if (
      device &&
      (device.status === "DISPENSING" ||
        device.status === "WASHING" ||
        device.status === "COOKING")
    ) {
      sendCommand("stop");
    }
  };

  return {
    device,
    localSettings,
    loading,
    error,
    setDurations,
    startDevice,
    cookDevice,
    cancelDevice,
  };
}
