"use client";

import * as React from "react";

const STORAGE_KEY = "toeic-mastery:mascot-minimized";

type Listener = () => void;
let listeners: Listener[] = [];

function emitChange() {
  for (const listener of listeners) listener();
}

function subscribe(listener: Listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

/** Persisted "mascot minimized" flag, shared across every mounted instance
 * (dashboard, exam, results) via the browser tab's localStorage. */
export function useMascotMinimized(): [boolean, (next: boolean) => void] {
  const minimized = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setMinimized = React.useCallback((next: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // localStorage unavailable — the toggle still works for this session via emitChange.
    }
    emitChange();
  }, []);

  return [minimized, setMinimized];
}
