import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 * Handles conditional classes and removes conflicting Tailwind utilities
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
