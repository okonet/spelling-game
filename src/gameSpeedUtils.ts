/**
 * Game speed validation utilities
 * Shared between game.ts and profileManager.ts to ensure consistent validation
 */

export const DEFAULT_GAME_SPEED = 1.0;
export const MIN_GAME_SPEED = 0.5;
export const MAX_GAME_SPEED = 1.5;

/**
 * Validate and clamp game speed to safe range [MIN_GAME_SPEED, MAX_GAME_SPEED]
 * Returns DEFAULT_GAME_SPEED if the input is undefined or NaN
 */
export function validateGameSpeed(speed: number | undefined): number {
  if (speed === undefined || isNaN(speed)) {
    return DEFAULT_GAME_SPEED;
  }
  return Math.max(MIN_GAME_SPEED, Math.min(MAX_GAME_SPEED, speed));
}
