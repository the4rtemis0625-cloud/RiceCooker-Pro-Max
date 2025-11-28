"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useFirestore, useDatabase } from "@/firebase";
import {
  doc,
  setDoc,
  serverTimestamp,
  Timestamp,
  DocumentData,
} from "firebase/firestore";
import { ref, onValue, off } from "firebase/database";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors";


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

// Timestamps from Realtime DB can be just numbers
type Timestampish = Timestamp | number;

function toTimestamp(ts: Timestampish | undefined): Timestamp | null {
    if (!ts) return null;
    if (ts instanceof Timestamp) return ts;
    // Assume number is millis since epoch
    if (typeof ts === 'number') return new Timestamp(ts / 1000, 0);
    return null;
}

export interface DeviceState {
  status: Status;
  settings: DeviceSettings;
  lastUpdated: Timestampish;
  currentStage?: {
    name: "DISPENSING" | "WASHING" | "COOKING";
    startTime: Timestampish;
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
  const firestore = useFirestore();
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
      setDevice({ status: "NOT_CONNECTED", settings: defaultSettings, lastUpdated: Date.now() });
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
            // If it doesn't exist in RTDB, we check firestore to create it
            // This is part of the hybrid approach
            const docRef = doc(firestore!, "devices", deviceId);
            const defaultState: DeviceState = {
                status: "READY",
                settings: defaultSettings,
                lastUpdated: serverTimestamp() as any, // RTDB will convert this
            };
            setDoc(docRef, defaultState as any)
                .then(() => setDevice(defaultState))
                .catch(async (serverError) => {
                    const permissionError = new FirestorePermissionError({
                        path: docRef.path,
                        operation: 'create',
                        requestResourceData: defaultState,
                    } satisfies SecurityRuleContext);
                    errorEmitter.emit('permission-error', permissionError);
                });
        }
        setLoading(false);
      },
      (err: any) => {
        console.error(err);
        let errorMessage = "Could not connect to device. Check the device ID and your connection.";
        if (err.code === 'PERMISSION_DENIED') {
            errorMessage = "Permission denied. You do not have access to this device's data.";
        }
        setError(errorMessage);
        setDevice({ status: "NOT_CONNECTED", settings: device?.settings ?? defaultSettings, lastUpdated: Date.now() });
        setLoading(false);
      }
    );

    return () => {
        off(dbRef, 'value', listener);
        clearCurrentInterval();
    };
  }, [deviceId, database, firestore, clearCurrentInterval, device?.settings]);

  // Effect to handle timers and progress updates based on device state from RTDB
  useEffect(() => {
    clearCurrentInterval();

    if (device?.currentStage?.startTime && device.status !== 'READY' && device.status !== 'DONE' && device.status !== 'CANCELED' && device.status !== 'NOT_CONNECTED') {
      const { startTime, duration } = device.currentStage;
      const startMillis = (startTime instanceof Timestamp) ? startTime.toMillis() : startTime;
      
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = (now - startMillis) / 1000;
        const remaining = Math.max(0, duration - elapsed);
        const progress = Math.min(100, (elapsed / duration) * 100);

        setDevice(prev => prev ? { ...prev, timeRemaining: Math.round(remaining), progress } : null);

        if (remaining <= 0) {
            clearCurrentInterval();
        }
      }, 500);
    }
    
    return () => clearCurrentInterval();
  }, [device, clearCurrentInterval]);


  // Writes still go to Firestore
  const updateDeviceInFirestore = (data: Partial<DeviceState> | DocumentData) => {
    if (!deviceId || !firestore) return;
    const docRef = doc(firestore, "devices", deviceId);
    
    const payload = { ...data, lastUpdated: serverTimestamp() };
    
    setDoc(docRef, payload, { merge: true })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: payload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const setDurations = (settings: Partial<DeviceSettings>) => {
    if(device){
        const newSettings = { ...device.settings, ...settings };
        updateDeviceInFirestore({ settings: newSettings });
    }
  };

  const startDevice = () => {
    if (device && (device.status === 'READY' || device.status === 'DONE' || device.status === 'CANCELED')) {
        updateDeviceInFirestore({ 
          status: 'DISPENSING',
          currentStage: {
            name: 'DISPENSING',
            startTime: serverTimestamp(),
            duration: device.settings.dispenseDuration
          }
        });
    }
  };

  const cancelDevice = () => {
    if (device && (device.status === 'DISPENSING' || device.status === 'WASHING' || device.status === 'COOKING')) {
        updateDeviceInFirestore({ status: 'CANCELED', currentStage: null });
    }
  };

  // Convert RTDB timestamps to Firestore Timestamps for the UI
  const deviceWithTimestamps: DeviceState | null = device ? {
      ...device,
      lastUpdated: toTimestamp(device.lastUpdated) || Timestamp.now(),
      currentStage: device.currentStage ? {
          ...device.currentStage,
          startTime: toTimestamp(device.currentStage.startTime) || Timestamp.now()
      } : undefined
  } : null;

  const finalDevice = deviceWithTimestamps as (DeviceState & {lastUpdated: Timestamp, currentStage?: {startTime: Timestamp}}) | null;

  return { device: finalDevice, loading, error, setDurations, startDevice, cancelDevice };
}
