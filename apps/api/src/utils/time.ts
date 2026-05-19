export const nowIso = (): string => new Date().toISOString();

export const addSeconds = (value: string | Date, seconds: number): string => {
  const base = typeof value === "string" ? new Date(value) : value;
  return new Date(base.getTime() + seconds * 1000).toISOString();
};

export const addHours = (value: string | Date, hours: number): string =>
  addSeconds(value, hours * 60 * 60);

export const addDays = (value: string | Date, days: number): string => addHours(value, days * 24);

export const isExpired = (value: string): boolean => new Date(value).getTime() <= Date.now();

export const isoToEpochSeconds = (value: string): number =>
  Math.floor(new Date(value).getTime() / 1000);
