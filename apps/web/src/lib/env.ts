declare const __API_BASE_URL__: string;
declare const __DEV_MODE__: boolean;

export const env = {
  apiBaseUrl: __API_BASE_URL__,
  devMode: __DEV_MODE__
} as const;
