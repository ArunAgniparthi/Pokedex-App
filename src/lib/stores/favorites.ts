import { writable } from "svelte/store";

// Initialize favorites from localStorage, fallback to empty array
const stored = typeof localStorage !== "undefined"? JSON.parse(localStorage.getItem("x") || "[]") : [];

export const favorites = writable <number[]> (stored);

// Sync store with localStorage whenever it changes
favorites.subscribe((value) => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("x", JSON.stringify(value));
    
  }
});
