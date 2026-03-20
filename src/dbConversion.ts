export function dbToAmplitude(db: number) {
  return Math.pow(10, db / 20);
}

export function amplitudeToDb(amp: number) {
  return Math.log10(amp) * 20;
}
