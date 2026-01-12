export function dot(a: number[], b: number[]): number {
  let sum = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) sum += a[i] * b[i];
  return sum;
}

export function norm(a: number[]): number {
  return Math.sqrt(dot(a, a));
}

export function cosineSimilarity(a: number[], aNorm: number, b: number[], bNorm: number): number {
  if (aNorm === 0 || bNorm === 0) return 0;
  return dot(a, b) / (aNorm * bNorm);
}


