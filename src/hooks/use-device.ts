
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
  | "NOT_CONNECTED"
  | "SENDING_COMMAND";

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
    add_water?: boolean;
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

  const stageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setDurationsCallback = useCallback((newSettings: Partial<DeviceSettings>) => {
      if (!deviceId || !database) return;
      const dbRef = ref(database, `devices/${deviceId}/settings`);
      
      const currentSettings = { ...durations, ...newSettings};
      setDurations(currentSettings);

      update(dbRef, {
        dispenseDuration: currentSettings.dispenseTime,
        washDuration: currentSettings.pumpTime,
        cookDuration: currentSettings.cookTime * 60,
      }).catch((err) => {
        console.error("Failed to update settings in RTDB:", err);
        setError(err.message || "Failed to save settings.");
      });
  }, [deviceId, database, durations]);


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
      return;
    }

    setLoading(true);
    setError(null);
    const dbRef = ref(database, `devices/${deviceId}`);

    const listener = onValue(
      dbRef,
      (snapshot) => {
        if (stageTimeoutRef.current) {
          clearTimeout(stageTimeoutRef.current);
          stageTimeoutRef.current = null;
        }

        if (snapshot.exists()) {
          const data = snapshot.val() as DeviceState & { settings: { dispenseDuration: number; washDuration: number; cookDuration: number } };
          
          const saneSettings: DeviceSettings = {
            pumpTime: typeof data.settings?.washDuration === 'number' ? data.settings.washDuration : defaultSettings.pumpTime,
            dispenseTime: typeof data.settings?.dispenseDuration === 'number' ? data.settings.dispenseDuration : defaultSettings.dispenseTime,
            cookTime: typeof data.settings?.cookDuration === 'number' ? Math.round(data.settings.cookDuration / 60) : defaultSettings.cookTime,
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
          
          const newState = { ...data, status: newStatus, currentAction } as DeviceState;
          setDevice(newState);

          // Handle timed stages
          if (newState.currentStage && newState.currentStage.startTime > 0) {
            const { name, startTime, duration } = newState.currentStage;
            const elapsedTime = (Date.now() - startTime) / 1000;
            const remainingTime = Math.max(0, duration - elapsedTime);
            
            stageTimeoutRef.current = setTimeout(() => {
                const deviceRef = ref(database, `devices/${deviceId}`);
                if (name === "DISPENSING") {
                    update(deviceRef, {
                        "command/dispense": false,
                        currentAction: "add water",
                        currentStage: { name: "WASHING", startTime: serverTimestamp(), duration: saneSettings.pumpTime }
                    });
                } else if (name === "WASHING") {
                    update(deviceRef, {
                        "command/add_water": false,
                        currentAction: "idle",
                        currentStage: null
                    });
                } else if (name === "COOKING") {
                    update(deviceRef, {
                        "command/cook": false,
                        currentAction: "done",
                        currentStage: null
                    });
                }
            }, remainingTime * 1000);
          }


        } else {
          const defaultState = {
            settings: {
              dispenseDuration: defaultSettings.dispenseTime,
              washDuration: defaultSettings.pumpTime,
              cookDuration: defaultSettings.cookTime * 60,
            },
            lastUpdated: serverTimestamp(),
            currentAction: "idle",
            command: { dispense: false, cook: false, cancel: false, add_water: false }
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
      if(stageTimeoutRef.current) {
        clearTimeout(stageTimeoutRef.current);
      }
    };
  }, [deviceId, database]);
  

  const sendCommandObject = (commandData: object) => {
    if (!deviceId || !database) return;
    
    const deviceRef = ref(database, `devices/${deviceId}`);
    update(deviceRef, commandData).catch((err) => {
      console.error("Failed to send command:", err);
      setError(err.message || "Failed to send command to device.");
    });
  };

  const startDevice = () => {
    sendCommandObject({
      "command/add_water": true,
      "command/dispense": true,
      "command/cook": false,
      "command/cancel": false,
      currentAction: "dispense rice",
      currentStage: {
        name: "DISPENSING",
        startTime: serverTimestamp(),
        duration: durations.dispenseTime
      }
    });
  };

  const cookDevice = () => {
    sendCommandObject({
      "command/cook": true,
      "command/dispense": false,
      "command/add_water": false,
      "command/cancel": false,
      currentAction: "cook",
      currentStage: {
        name: "COOKING",
        startTime: serverTimestamp(),
        duration: durations.cookTime * 60
      }
    });
  };

  const cancelDevice = () => {
    if (!deviceId || !database) return;
    const currentAction = device?.currentAction;
    if (
      currentAction === "dispense rice" ||
      currentAction === "add water" ||
      currentAction === "cook"
    ) {
      const deviceRef = ref(database, `devices/${deviceId}`);
      update(deviceRef, {
        "command/cancel": true,
        "command/dispense": false,
        "command/cook": false,
        "command/add_water": false,
        queue: [],
        currentAction: "canceled",
        currentStage: null
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
  };
}
