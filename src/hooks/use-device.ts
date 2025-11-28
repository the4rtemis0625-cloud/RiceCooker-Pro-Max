
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
  lastUpdated: number;
  queue?: string[];
  command?: {
    dispense?: boolean;
    cook?: boolean;
    cancel?: boolean;
  } | null;
  currentAction?: 'idle' | 'dispense rice' | 'add water' | 'cook' | 'done' | 'canceled' | null;
  currentStage?: {
    name: "DISPENSING" | "WASHING" | "COOKING";
    startTime: number;
    duration: number;
  } | null;
}

const defaultSettings: DeviceSettings = {
  pumpTime: 5,
  dispenseTime: 10,
  cookTime: 30,
};

export function useDevice(deviceId: string | null) {
  const database = useDatabase();
  const [device, setDevice] = useState<DeviceState | null>(null);
  const [durations, setDurations] = useState<DeviceSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [progress, setProgress] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearCurrentInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const setDurationsCallback = useCallback((newSettings: Partial<DeviceSettings>) => {
      if (!deviceId || !database) return;

      const dbRef = ref(database, `devices/${deviceId}/settings`);
      update(dbRef, newSettings).catch((err) => {
        console.error("Failed to update settings in RTDB:", err);
        setError(err.message || "Failed to save settings.");
      });
  }, [deviceId, database]);


  useEffect(() => {
    if (!database) {
      setLoading(false);
      return;
    }

    if (!deviceId) {
      setDevice({
        status: "NOT_CONNECTED",
        lastUpdated: Date.now(),
        currentAction: null,
      });
      setDurations(defaultSettings);
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
          const data = snapshot.val() as Partial<DeviceState & { settings: DeviceSettings }>;
          
          const saneSettings: DeviceSettings = {
            pumpTime: typeof data.settings?.pumpTime === 'number' ? data.settings.pumpTime : defaultSettings.pumpTime,
            dispenseTime: typeof data.settings?.dispenseTime === 'number' ? data.settings.dispenseTime : defaultSettings.dispenseTime,
            cookTime: typeof data.settings?.cookTime === 'number' ? data.settings.cookTime : defaultSettings.cookTime,
          };
          
          setDurations(saneSettings);

          let newStatus: Status;
          const currentAction = data.currentAction ?? 'idle';

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
          
          setDevice({ ...data, status: newStatus, currentAction } as DeviceState);

        } else {
          const defaultState = {
            settings: defaultSettings,
            lastUpdated: serverTimestamp(),
            currentAction: "idle",
          };
          set(dbRef, defaultState)
            .then(() => {
              setDevice({ ...defaultState, lastUpdated: Date.now(), status: "READY" } as DeviceState);
              setDurations(defaultSettings);
            })
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
          lastUpdated: Date.now(),
        } as DeviceState);
        setDurations(defaultSettings);
        setLoading(false);
      }
    );

    return () => {
      off(dbRef, "value", listener);
      clearCurrentInterval();
    };
  }, [deviceId, database, clearCurrentInterval]);

  useEffect(() => {
    clearCurrentInterval();

    const currentStage = device?.currentStage;
    const isRunning = device?.status === 'DISPENSING' || device?.status === 'WASHING' || device?.status === 'COOKING';

    if (isRunning && currentStage?.startTime && currentStage?.duration) {
      const { startTime, duration } = currentStage;
      
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = (now - startTime) / 1000;
        const remaining = Math.max(0, duration - elapsed);
        const newProgress = Math.min(100, (elapsed / duration) * 100);

        setTimeRemaining(Math.round(remaining));
        setProgress(newProgress);

        if (remaining <= 0) {
            clearCurrentInterval();
        }
      }, 500); 
    } else {
        setTimeRemaining(0);
        setProgress(0);
    }

    return () => clearCurrentInterval();
  }, [device?.status, device?.currentStage, clearCurrentInterval]);

  const sendCommandObject = (commandData: object) => {
    if (!deviceId || !database) return;
    const deviceRef = ref(database, `devices/${deviceId}`);
    update(deviceRef, commandData).catch((err) => {
      console.error("Failed to send command:", err);
      setError(err.message || "Failed to send command to device.");
    });
  };

  const startDevice = () => {
    const currentAction = device?.currentAction;
    if (currentAction === 'idle' || currentAction === 'done' || currentAction === 'canceled' || !currentAction) {
        sendCommandObject({
            "command/dispense": true,
            "command/cook": false,
            "command/cancel": false,
            queue: ["add water", "dispense rice"]
        });
    }
  };

  const cookDevice = () => {
    const currentAction = device?.currentAction;
    if (currentAction === 'idle' || currentAction === 'done' || currentAction === 'canceled' || !currentAction) {
      sendCommandObject({
        "command/dispense": false,
        "command/cook": true,
        "command/cancel": false,
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
        "command/dispense": false,
        "command/cook": false,
        "command/cancel": true,
        queue: []
      });
    }
  };

  return {
    device,
    durations,
    loading,
    error,
    setDurations: setDurationsCallback,
    startDevice,
    cookDevice,
    cancelDevice,
    timeRemaining,
    progress,
  };
}
