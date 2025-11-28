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
  };
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
          setDevice(data);
          setError(null);
        } else {
          // If it doesn't exist in RTDB, create it with a default state.
          const defaultState: Omit<DeviceState, 'timeRemaining' | 'progress' | 'currentStage'> = {
            status: "READY",
            settings: defaultSettings,
            lastUpdated: serverTimestamp() as any,
          };
          set(dbRef, defaultState)
            .then(() => setDevice({ ...defaultState, lastUpdated: Date.now() }))
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
    };
  }, [deviceId, database, clearCurrentInterval, device?.settings]);

  // Effect to handle timers and progress updates
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

        setDevice(
          (prev) =>
            prev
              ? { ...prev, timeRemaining: Math.round(remaining), progress }
              : null
        );

        if (remaining <= 0) {
          clearCurrentInterval();
        }
      }, 500);
    }

    return () => clearCurrentInterval();
  }, [device, clearCurrentInterval]);

  const updateDeviceInRtdb = (data: Partial<DeviceState>) => {
    if (!deviceId || !database) return;
    const dbRef = ref(database, `devices/${deviceId}`);
    const payload = { ...data, lastUpdated: serverTimestamp() };
    update(dbRef, payload).catch((err) => {
        console.error("Failed to update device in RTDB:", err);
        setError(err.message || "Failed to send command to device.");
    });
  };

  const setDurations = (settings: Partial<DeviceSettings>) => {
    if (device) {
      const newSettings = { ...device.settings, ...settings };
      updateDeviceInRtdb({ settings: newSettings });
    }
  };

  const startDevice = () => {
    if (
      device &&
      (device.status === "READY" ||
        device.status === "DONE" ||
        device.status === "CANCELED")
    ) {
      updateDeviceInRtdb({
        status: "DISPENSING",
        currentStage: {
          name: "DISPENSING",
          startTime: serverTimestamp() as any,
          duration: device.settings.dispenseDuration,
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
      updateDeviceInRtdb({ status: "CANCELED", currentStage: undefined });
    }
  };

  return {
    device,
    loading,
    error,
    setDurations,
    startDevice,
    cancelDevice,
  };
}
