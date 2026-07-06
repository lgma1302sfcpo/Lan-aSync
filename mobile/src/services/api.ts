import { API_URLS } from '../config';
import { getSession } from './sessionStorage';

const REQUEST_TIMEOUT_MS = 5000;
const UPLOAD_TIMEOUT_MS = 30000;

type RequestOptions = RequestInit & {
  skipJsonHeader?: boolean;
  timeoutMs?: number;
};

async function authHeader(): Promise<Record<string, string>> {
  const session = await getSession();
  return session?.token ? { Authorization: `Bearer ${session.token}` } : {};
}

async function parseResponse(response: Response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || 'Falha na comunicacao com a API');
  }

  return data;
}

function isNetworkError(error: unknown) {
  return error instanceof Error && (
    /Network request failed/i.test(error.message) ||
    error.name === 'AbortError'
  );
}

async function fetchWithTimeout(url: string, options: RequestOptions) {
  const {
    timeoutMs,
    skipJsonHeader: _skipJsonHeader,
    ...fetchOptions
  } = options;
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    timeoutMs || REQUEST_TIMEOUT_MS,
  );

  try {
    return await fetch(url, {
      ...fetchOptions,
      signal: fetchOptions.signal || controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.skipJsonHeader ? {} : { 'Content-Type': 'application/json' }),
    ...(await authHeader()),
    ...(options.headers as Record<string, string> | undefined),
  };

  for (const apiUrl of API_URLS) {
    try {
      const response = await fetchWithTimeout(`${apiUrl}${path}`, {
        ...options,
        headers,
      });

      return parseResponse(response) as Promise<T>;
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error;
      }
    }
  }

  throw new Error(
    `Nao foi possivel conectar na API. Verifique se o backend esta rodando e se o aparelho consegue acessar: ${API_URLS.join(' ou ')}`,
  );
}

export async function uploadPhotoFile(
  registroId: string,
  fotoId: string,
  uri: string,
  name: string,
  type: string,
): Promise<{ remote_url: string }> {
  const data = new FormData();
  data.append('file', {
    uri,
    name: name || `${fotoId}.jpg`,
    type: type || 'image/jpeg',
  } as unknown as Blob);

  return apiRequest<{ remote_url: string }>(
    `/registros/${registroId}/fotos/${fotoId}/file`,
    {
      method: 'POST',
      body: data,
      skipJsonHeader: true,
      timeoutMs: UPLOAD_TIMEOUT_MS,
    },
  );
}
