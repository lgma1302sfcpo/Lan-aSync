import { API_URLS } from '../config';
import { getSession } from './sessionStorage';

type RequestOptions = RequestInit & {
  skipJsonHeader?: boolean;
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
  return error instanceof Error && /Network request failed/i.test(error.message);
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
      const response = await fetch(`${apiUrl}${path}`, {
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
    },
  );
}
