/** Tiny "1h" / "30d" / "15m" duration-string → milliseconds parser (no extra dependency). */
export function parseDurationMs(input: string): number {
  const match = /^(\d+)\s*(ms|s|m|h|d)$/i.exec(input.trim());
  if (!match) throw new Error(`Invalid duration string: "${input}"`);
  const value = Number(match[1]);
  const unit = match[2]!.toLowerCase();
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return value * multipliers[unit]!;
}
