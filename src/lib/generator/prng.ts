const FNV_OFFSET_BASIS = 2_166_136_261;
const FNV_PRIME = 16_777_619;

export const hashSeed = (value: string): number => {
  let hash = FNV_OFFSET_BASIS;

  for (const byte of new TextEncoder().encode(value)) {
    hash ^= byte;
    hash = Math.imul(hash, FNV_PRIME);
  }

  return hash >>> 0;
};

export const normalizeSeed = (seed: string, fallback: string): string => {
  const normalized = seed.trim().normalize('NFKC');
  const resolved = normalized.length > 0 ? normalized : fallback;
  return [...resolved.normalize('NFKC')].slice(0, 64).join('');
};

export const createPrng = (seed: number): (() => number) => {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
};
