
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
  
  // This state holds the slider values while the user is interacting with them.
  const [localSettings, setLocalSettings] = useState<DeviceSettings>(defaultSettings);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearCurrentInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // When the device data from the DB changes (e.g., loaded for the first time,
  // or updated externally), sync it to our local settings state.
  useEffect(() => {
    if (device?.settings) {
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
          setError(null);
        } else {
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
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [deviceId, database, clearCurrentInterval]);

  // Effect to handle timers and progress updates for the UI
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
        // We calculate progress based on server time vs local time to avoid sync issues.
        const now = Date.now();
        const elapsed = (now - startTime) / 1000;
        const remaining = Math.max(0, duration - elapsed);
        const progress = Math.min(100, (elapsed / duration) * 100);

        // We only update the local `device` state for the UI, no DB writes here.
        setDevice(
          (prev) =>
            prev
              ? { ...prev, timeRemaining: Math.round(remaining), progress }
              : null
        );

        if (remaining <= 0) {
          clearCurrentInterval();
        }
      }, 500); // Update UI every half a second
    }

    // Cleanup interval on unmount or when dependencies change
    return () => clearCurrentInterval();
  }, [device?.status, device?.currentStage, clearCurrentInterval]);


  // Centralized function for writing updates to the RTDB
  const updateDeviceInRtdb = (data: Partial<Omit<DeviceState, 'settings'>>) => {
    if (!deviceId || !database) return;
    const dbRef = ref(database, `devices/${deviceId}`);
    const payload = { ...data, lastUpdated: serverTimestamp() };
    update(dbRef, payload).catch((err) => {
        console.error("Failed to update device in RTDB:", err);
        setError(err.message || "Failed to send command to device.");
    });
  };

  /**
   * Updates the local state for settings and then debounces the write to Firebase.
   * This is called by the sliders in the SettingsPanel.
   */
  const setDurations = useCallback((newSettings: Partial<DeviceSettings>) => {
    // 1. Immediately update the local state for a responsive UI
    const updatedSettings = { ...localSettings, ...newSettings };
    setLocalSettings(updatedSettings);

    // 2. Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // 3. Set a new timeout to write to the database
    debounceTimeoutRef.current = setTimeout(() => {
      if (!deviceId || !database) return;
      const dbRef = ref(database, `devices/${deviceId}/settings`);
      update(dbRef, updatedSettings).catch((err) => {
        console.error("Failed to update settings in RTDB:", err);
        setError(err.message || "Failed to save settings.");
      });
    }, 300); // 300ms debounce delay
  }, [localSettings, deviceId, database]);


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
      updateDeviceInRtdb({ status: "CANCELED", currentStage: null });
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
