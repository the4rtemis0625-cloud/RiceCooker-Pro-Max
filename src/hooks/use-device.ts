
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
  currentStage?: {
    name: "DISPENSING" | "WASHING" | "COOKING";
    startTime: number;
    duration: number;
  } | null;
  timeRemaining?: number;
  progress?: number;
}

const defaultSettings: DeviceSettings = {
  dispenseDuration: 5,
  washDuration: 15,
  cookDuration: 30,
};

export function useDevice(deviceId: string | null) {
  const database = useDatabase();
  const [device, setDevice] = useState<DeviceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [localSettings, setLocalSettings] = useState<DeviceSettings>(defaultSettings);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearCurrentInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  
  const updateDeviceInRtdb = useCallback((data: Partial<Omit<DeviceState, 'settings'>>) => {
    if (!deviceId || !database) return;
    const dbRef = ref(database, `devices/${deviceId}`);
    const payload = { ...data, lastUpdated: serverTimestamp() };
    update(dbRef, payload).catch((err) => {
        console.error("Failed to update device in RTDB:", err);
        setError(err.message || "Failed to send command to device.");
    });
  }, [deviceId, database]);

  useEffect(() => {
    if (device) {
      setLocalSettings(device.settings);
    }
  }, [device?.settings]);


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
          if (data.settings) {
            setLocalSettings(data.settings);
          }
          setError(null);
        } else {
          const defaultState: Omit<DeviceState, 'timeRemaining' | 'progress' | 'currentStage'> = {
            status: "READY",
            settings: defaultSettings,
            lastUpdated: serverTimestamp() as any,
          };
          set(dbRef, defaultState)
            .then(() => setDevice({ ...defaultState, lastUpdated: Date.now(), settings: defaultSettings }))
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
  }, [deviceId, database, clearCurrentInterval]);

  useEffect(() => {
    clearCurrentInterval();

    if (
      device?.currentStage?.startTime &&
      device.status !== "READY" &&
      device.status !== "DONE" &&
      device.status !== "CANCELED" &&
      device.status !== "NOT_CONNECTED"
    ) {
      const { startTime, duration, name } = device.currentStage;
      
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = (now - startTime) / 1000;
        const remaining = Math.max(0, duration - elapsed);
        const progress = Math.min(100, (elapsed / duration) * 100);

        setDevice(
          (prev) =>
            prev
              ? { ...prev, timeRemaining: Math.round(remaining), progress }
              : null
        );

        if (remaining <= 0) {
            clearCurrentInterval();
            if (name === 'DISPENSING') {
                updateDeviceInRtdb({
                    status: 'WASHING',
                    currentStage: {
                        name: 'WASHING',
                        startTime: serverTimestamp() as any,
                        duration: localSettings.washDuration,
                    },
                });
            } else if (name === 'WASHING') {
                updateDeviceInRtdb({ status: 'READY', currentStage: null });
            }
        }
      }, 500); 
    }

    return () => clearCurrentInterval();
  }, [device?.status, device?.currentStage, clearCurrentInterval, updateDeviceInRtdb, localSettings.washDuration]);


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
    if (
      device &&
      (device.status === "READY" ||
        device.status === "DONE")
    ) {
      updateDeviceInRtdb({
        status: "DISPENSING",
        currentStage: {
          name: "DISPENSING",
          startTime: serverTimestamp() as any,
          duration: localSettings.dispenseDuration,
        },
      });
    }
  };

  const cancelDevice = () => {
    if (
      device &&
      (device.status === "DISPENSING" ||
        device.status === "WASHING" ||
        device.status === "COOKING")
    ) {
      updateDeviceInRtdb({ status: "READY", currentStage: null });
    }
  };

  return {
    device,
    localSettings,
    loading,
    error,
    setDurations,
    startDevice,
    cancelDevice,
  };
}
