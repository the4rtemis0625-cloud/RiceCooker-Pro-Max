"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useFirestore } from "@/firebase";
import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  DocumentData,
} from "firebase/firestore";
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

export interface DeviceState {
  status: Status;
  settings: DeviceSettings;
  lastUpdated: Timestamp;
  currentStage?: {
    name: "DISPENSING" | "WASHING" | "COOKING";
    startTime: Timestamp;
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
    if (!firestore) {
        setLoading(false);
        return;
    }

    if (!deviceId) {
      setDevice({ status: "NOT_CONNECTED", settings: defaultSettings, lastUpdated: Timestamp.now() });
      setLoading(false);
      clearCurrentInterval();
      return;
    }

    setLoading(true);
    setError(null);
    const docRef = doc(firestore, "devices", deviceId);
    
    const defaultState: DeviceState = {
        status: "READY",
        settings: defaultSettings,
        lastUpdated: Timestamp.now(),
    };

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as DeviceState;
          setDevice(data);
          setError(null);
        } else {
          setDoc(docRef, defaultState)
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'create',
                    requestResourceData: defaultState,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
             });
          setDevice(defaultState);
        }
        setLoading(false);
      },
      async (err: any) => {
        if (err.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'get',
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        }

        let errorMessage = "Could not connect to device. Check the device ID and your connection.";
        if (err.code === 'permission-denied') {
            errorMessage = "Permission denied. You do not have access to this device's data.";
        } else if (err.code === 'unavailable' || (err.message && err.message.includes('offline'))) {
            errorMessage = "Device is offline or unreachable. Please check your internet connection and device ID."
        }
        setError(errorMessage);
        setDevice({ status: "NOT_CONNECTED", settings: device?.settings ?? defaultSettings, lastUpdated: Timestamp.now() });
        setLoading(false);
      }
    );

    return () => {
        unsubscribe();
        clearCurrentInterval();
    };
  }, [deviceId, firestore, clearCurrentInterval, device?.settings]);

  // Effect to handle timers and progress updates based on device state from Firestore
  useEffect(() => {
    clearCurrentInterval();

    if (device?.currentStage?.startTime && device.status !== 'READY' && device.status !== 'DONE' && device.status !== 'CANCELED' && device.status !== 'NOT_CONNECTED') {
      const { startTime, duration } = device.currentStage;
      const startMillis = startTime.toMillis();
      
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = (now - startMillis) / 1000;
        const remaining = Math.max(0, duration - elapsed);
        const progress = Math.min(100, (elapsed / duration) * 100);

        // This is a local update for smoother UI. Firestore is the source of truth.
        setDevice(prev => prev ? { ...prev, timeRemaining: Math.round(remaining), progress } : null);

        if (remaining <= 0) {
            clearCurrentInterval();
        }
      }, 500);
    }
    
    // Cleanup interval on component unmount or when device state changes
    return () => clearCurrentInterval();
  }, [device, clearCurrentInterval]);


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
        updateDeviceInFirestore({ status: 'CANCELED', currentStage: undefined });
    }
  };

  return { device, loading, error, setDurations, startDevice, cancelDevice };
}
