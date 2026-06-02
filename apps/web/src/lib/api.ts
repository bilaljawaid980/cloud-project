import { env } from "./env";
import { getAuthToken } from "./auth";

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  public constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

const buildApiUrl = (baseUrl: string, path: string): string => {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
};

const fetchWithApiFallback = async (
  path: string,
  options: RequestInit
): Promise<Response> => {
  try {
    return await fetch(buildApiUrl(env.apiBaseUrl, path), options);
  } catch (error) {
    const fallbackBaseUrl = env.fallbackApiBaseUrl?.trim();
    if (!fallbackBaseUrl || fallbackBaseUrl === env.apiBaseUrl) {
      throw error;
    }

    return await fetch(buildApiUrl(fallbackBaseUrl, path), options);
  }
};

export const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const headers = new Headers(options.headers);

  const isFormDataBody = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!headers.has("Content-Type") && options.body && !isFormDataBody) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false) {
    const token = getAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  let response: Response;
  try {
    response = await fetchWithApiFallback(path, {
      ...options,
      headers
    });
  } catch (error) {
    throw new ApiClientError(
      "Could not reach the API. Please refresh and try again.",
      0,
      error
    );
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? ((await response.json()) as unknown) : undefined;

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error?: { message?: string } }).error?.message === "string"
        ? (payload as { error: { message: string } }).error.message
        : `Request failed with status ${response.status}`;

    throw new ApiClientError(message, response.status, payload);
  }

  return payload as T;
};
