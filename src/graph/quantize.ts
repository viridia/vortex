const QUANTA = 4;

export function quantize(n: number): number {
  return Math.floor(n / QUANTA) * QUANTA;
}
