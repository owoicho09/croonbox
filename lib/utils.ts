import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Kept in a plain (non-component) module so current-time math doesn't trip the React purity lint rule.
export function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
