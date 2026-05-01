/** Wall-clock ms; use from event handlers / effects (not during render). */
export function nowMs(): number {
  return Date.now()
}
