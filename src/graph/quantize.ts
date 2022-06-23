const QUANTA = 16;

export function quantize(n: number): number {
  return Math.floor(n / QUANTA) * QUANTA;
}
