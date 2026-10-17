import { API_PREFIX, AUTH_HEADER_SCHEME, type ApiResponse } from '@umc/shared';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? API_PREFIX;
const NO_CONTENT = 204;
const UNAUTHORIZED = 401;

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    /** `ValidationIssue[]` when `code` is `VALIDATION_ERROR`. */
    public readonly details?: unknown,
    /** Quote this when reporting a problem; it matches the server logs. */
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/** Lets the session layer supply the in-memory access token without this module importing it. */
export interface AuthBridge {
  getAccessToken: () => string | null;
  /** Obtains a fresh access token, or `null` when the session has ended. */
  refreshAccessToken: () => Promise<string | null>;
}

let authBridge: AuthBridge | null = null;

/** Returns a function that unregisters the bridge. */
export function setAuthBridge(bridge: AuthBridge): () => void {
  authBridge = bridge;
  return () => {
    if (authBridge === bridge) authBridge = null;
  };
}

export interface ApiRequestInit extends RequestInit {
  /** Send without the access token and never retry on 401; for the auth endpoints themselves. */
  skipAuth?: boolean;
}

function send(path: string, init: RequestInit, accessToken: string | null): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `${AUTH_HEADER_SCHEME} ${accessToken}` } : {}),
      ...init.headers,
    },
  });
}

async function parseResponse<T>(response: Response): Promise<T> {
  // Successful deletes and logout reply 204 with no body; callers type these as `void`.
  if (response.status === NO_CONTENT) return undefined as T;

  let body: ApiResponse<T> | undefined;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError(response.status, 'INVALID_RESPONSE', 'Server returned invalid JSON');
  }

  if (!body.success) {
    const { code, message, details } = body.error;
    throw new ApiClientError(response.status, code, message, details, body.meta.requestId);
  }
  return body.data;
}

/** Sends with the access token, refreshing it once and retrying when the server answers 401. */
async function sendAuthorized(
  path: string,
  { skipAuth = false, ...init }: ApiRequestInit,
): Promise<Response> {
  const bridge = skipAuth ? null : authBridge;
  const token = bridge?.getAccessToken() ?? null;
  let response = await send(path, init, token);

  if (response.status === UNAUTHORIZED && bridge && token) {
    // Another request may already have refreshed while this one was in flight.
    const latest = bridge.getAccessToken();
    const retryToken = latest && latest !== token ? latest : await bridge.refreshAccessToken();
    if (retryToken) response = await send(path, init, retryToken);
  }
  return response;
}

export async function apiRequest<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  return parseResponse<T>(await sendAuthorized(path, init));
}

export interface ApiFile {
  blob: Blob;
  /** From `Content-Disposition`, when the server sent one. */
  fileName?: string;
}

const FILE_NAME_PATTERN = /filename="?([^";]+)"?/i;

/** GETs a binary file (e.g. a PDF); failures still arrive as the JSON error envelope. */
export async function apiFile(path: string, init: ApiRequestInit = {}): Promise<ApiFile> {
  const response = await sendAuthorized(path, {
    ...init,
    headers: { Accept: '*/*', ...init.headers },
  });
  if (!response.ok) return parseResponse<never>(response);

  const fileName = FILE_NAME_PATTERN.exec(response.headers.get('Content-Disposition') ?? '')?.[1];
  return { blob: await response.blob(), ...(fileName && { fileName }) };
}
