
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

export function useDevice(activeDeviceId: string | null) {
  const database = useDatabase();
  const [device, setDevice] = useState<DeviceState | null>(null);
  const [durations, _setDurations] = useState<DeviceSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const durationsRef = useRef(durations);

  const setDurations = useCallback((newSettings: Partial<DeviceSettings>) => {
      const updatedSettings = { ...durationsRef.current, ...newSettings };
      durationsRef.current = updatedSettings;
      _setDurations(updatedSettings);

      if (!activeDeviceId || !database) return;
      
      const dbRef = ref(database, `devices/${activeDeviceId}/settings`);
      
      const settingsToUpdate = {
        dispenseDuration: updatedSettings.dispenseTime,
        washDuration: updatedSettings.pumpTime,
        cookDuration: updatedSettings.cookTime * 60,
      };

      update(dbRef, settingsToUpdate).catch((err) => {
        console.error("Failed to update settings in RTDB:", err);
        setError(err.message || "Failed to save settings.");
      });
  }, [activeDeviceId, database]);


  useEffect(() => {
    if (!database) {
      setLoading(false);
      return;
    }

    if (!activeDeviceId) {
      setDevice({
        status: "NOT_CONNECTED",
        lastUpdated: Date.now(),
        currentAction: null,
      });
      _setDurations(defaultSettings);
      durationsRef.current = defaultSettings;
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const dbRef = ref(database, `devices/${activeDeviceId}`);

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
          
          _setDurations(saneSettings);
          durationsRef.current = saneSettings;

          let newStatus: Status;
          const currentAction = data.currentAction ?? 'idle';

          switch (currentAction) {
            case 'idle':
              newStatus = data.command?.dispense || data.command?.add_water || data.command?.cook ? 'SENDING_COMMAND' : 'READY';
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
          if (newState.currentStage && newState.currentStage.startTime > 0 && newState.currentStage.duration > 0) {
            const { name, startTime, duration } = newState.currentStage;
            const elapsedTime = (Date.now() - startTime) / 1000;
            const remainingTime = Math.max(0, duration - elapsedTime);
            
            stageTimeoutRef.current = setTimeout(() => {
                const deviceRef = ref(database, `devices/${activeDeviceId}`);
                if (name === "WASHING") {
                    update(deviceRef, {
                        "command/add_water": false,
                        currentAction: "idle",
                        currentStage: null
                    });
                } else if (name === "DISPENSING") {
                    update(deviceRef, {
                        "command/dispense": false,
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
              const initialState = { ...defaultState, lastUpdated: Date.now(), status: "READY" } as DeviceState;
              setDevice(initialState);
              _setDurations(defaultSettings);
              durationsRef.current = defaultSettings;
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
        _setDurations(defaultSettings);
        durationsRef.current = defaultSettings;
        setLoading(false);
      }
    );

    return () => {
      off(dbRef, "value", listener);
      if(stageTimeoutRef.current) {
        clearTimeout(stageTimeoutRef.current);
      }
    };
  }, [activeDeviceId, database]);
  

  const sendCommandObject = (commandData: object) => {
    if (!activeDeviceId || !database) return;
    
    const deviceRef = ref(database, `devices/${activeDeviceId}`);
    update(deviceRef, commandData).catch((err) => {
      console.error("Failed to send command:", err);
      setError(err.message || "Failed to send command to device.");
    });
  };

  const addWater = () => {
    sendCommandObject({
      "command/add_water": true,
      "command/dispense": false,
      "command/cook": false,
      "command/cancel": false,
      currentAction: "add water",
      currentStage: {
        name: "WASHING",
        startTime: serverTimestamp(),
        duration: durationsRef.current.pumpTime
      }
    });
  };

  const dispenseRice = () => {
    sendCommandObject({
      "command/dispense": true,
      "command/add_water": false,
      "command/cook": false,
      "command/cancel": false,
      currentAction: "dispense rice",
      currentStage: {
        name: "DISPENSING",
        startTime: serverTimestamp(),
        duration: durationsRef.current.dispenseTime
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
        duration: durationsRef.current.cookTime * 60
      }
    });
  };

  const cancelDevice = () => {
    if (!activeDeviceId || !database) return;
    const currentAction = device?.currentAction;
    if (
      currentAction === "dispense rice" ||
      currentAction === "add water" ||
      currentAction === "cook"
    ) {
      const deviceRef = ref(database, `devices/${activeDeviceId}`);
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
    setDurations,
    addWater,
    dispenseRice,
    cookDevice,
    cancelDevice,
  };
}
