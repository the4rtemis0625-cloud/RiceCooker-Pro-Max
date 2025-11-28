
"use client";

import { useState, useEffect } from 'react';

function getValueFromLocalStorage<T>(key: string): T | null {
    if (typeof window === 'undefined') {
        return null;
    }
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.warn(`Error reading localStorage key “${key}”:`, error);
        return null;
    }
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        const valueFromStorage = getValueFromLocalStorage<T>(key);
        return valueFromStorage ?? initialValue;
    });

    useEffect(() => {
        const valueFromStorage = getValueFromLocalStorage<T>(key);
        if (valueFromStorage === null) {
            setStoredValue(initialValue);
        }
    }, [key, initialValue]);


    const setValue = (value: T) => {
        if (typeof window === 'undefined') {
            console.warn(`Tried to set localStorage key “${key}” even though no window was found.`);
            return;
        }
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
            setStoredValue(value);
        } catch (error) {
            console.warn(`Error setting localStorage key “${key}”:`, error);
        }
    };

    return [storedValue, setValue];
}
