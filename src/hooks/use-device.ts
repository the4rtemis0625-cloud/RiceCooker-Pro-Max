
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
  pumpTime: number;
  dispenseTime: number;
  cookTime: number;
}

export interface DeviceState {
  status: Status;
  settings: DeviceSettings;
  lastUpdated: number;
  queue?: string[];
  command?: 'start' | 'cook' | 'cancel' | null;
  currentAction?: 'idle' | 'dispense rice' | 'add water' | 'cook' | 'done' | 'canceled' | null;
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
  const [device, setDevice] = useState<DeviceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sendCommandObject = useCallback((commandData: object) => {
    if (!deviceId || !database) return;
    const deviceRef = ref(database, `devices/${deviceId}`);
    update(deviceRef, commandData).catch((err) => {
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
        currentAction: null,
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
          const data = snapshot.val() as Partial<DeviceState>;
          
          const saneSettings: DeviceSettings = {
            pumpTime: typeof data.settings?.pumpTime === 'number' ? data.settings.pumpTime : defaultSettings.pumpTime,
            dispenseTime: typeof data.settings?.dispenseTime === 'number' ? data.settings.dispenseTime : defaultSettings.dispenseTime,
            cookTime: typeof data.settings?.cookTime === 'number' ? data.settings.cookTime : defaultSettings.cookTime,
          };
          
          let newStatus: Status;
          const currentAction = data.currentAction || 'idle';

          switch (currentAction) {
            case 'idle':
              newStatus = 'READY';
              break;
            case 'dispense rice':
              newStatus = 'DISPENSING';
              break;
            case 'add water':
              newStatus = 'WASHING';
              break;
            case 'cook':
              newStatus = 'COOKING';
              break;
            case 'done':
              newStatus = 'DONE';
              break;
            case 'canceled':
              newStatus = 'CANCELED';
              break;
            default:
              newStatus = 'READY';
              break;
          }
          
          setDevice({ ...data, status: newStatus, settings: saneSettings, currentAction } as DeviceState);

        } else {
          const defaultState: Partial<DeviceState> & { settings: DeviceSettings } = {
            settings: defaultSettings,
            lastUpdated: serverTimestamp() as any,
            currentAction: "idle",
          };
          set(dbRef, defaultState)
            .then(() => setDevice({ ...defaultState, lastUpdated: Date.now(), status: "READY" } as DeviceState))
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
    };
  }, [deviceId, database, clearCurrentInterval, device?.settings]);

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

    return () => clearCurrentInterval();
  }, [device?.status, device?.currentStage, clearCurrentInterval]);


  const setDurations = useCallback((newSettings: Partial<DeviceSettings>) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      if (!deviceId || !database) return;
      const dbRef = ref(database, `devices/${deviceId}/settings`);
      update(dbRef, newSettings).catch((err) => {
        console.error("Failed to update settings in RTDB:", err);
        setError(err.message || "Failed to save settings.");
      });
    }, 500);
  }, [deviceId, database]);


  const startDevice = () => {
    const currentAction = device?.currentAction;
    if (currentAction !== 'dispense rice' && currentAction !== 'add water' && currentAction !== 'cook') {
        sendCommandObject({
            command: "start",
            queue: ["add water", "dispense rice"]
        });
    }
  };

  const cookDevice = () => {
    const currentAction = device?.currentAction;
    if (currentAction !== 'dispense rice' && currentAction !== 'add water' && currentAction !== 'cook') {
      sendCommandObject({
        command: "cook",
        queue: ["cook"]
      });
    }
  };

  const cancelDevice = () => {
    const currentAction = device?.currentAction;
    if (
      currentAction === "dispense rice" ||
      currentAction === "add water" ||
      currentAction === "cook"
    ) {
      sendCommandObject({
        command: "cancel",
        queue: []
      });
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

