import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Get stored value or use initial value
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? parseStoredValue(JSON.parse(item)) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        // Dispatch custom event for cross-tab sync
        window.dispatchEvent(new StorageEvent('storage', {
          key,
          newValue: JSON.stringify(valueToStore),
        }));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Listen for storage changes (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(parseStoredValue(JSON.parse(e.newValue)));
        } catch {
          console.warn(`Error parsing localStorage value for "${key}"`);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

// Helper to parse dates from stored JSON
function parseStoredValue<T>(value: T): T {
  if (value === null || value === undefined) return value;
  
  if (Array.isArray(value)) {
    return value.map(item => parseStoredValue(item)) as T;
  }
  
  if (typeof value === 'object') {
    const parsed: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (typeof val === 'string' && isISODateString(val)) {
        parsed[key] = new Date(val);
      } else if (typeof val === 'object' && val !== null) {
        parsed[key] = parseStoredValue(val);
      } else {
        parsed[key] = val;
      }
    }
    return parsed as T;
  }
  
  return value;
}

function isISODateString(value: string): boolean {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  return isoDateRegex.test(value);
}

export default useLocalStorage;
