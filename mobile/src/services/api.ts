import { API_URL } from '../config';
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

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.skipJsonHeader ? {} : { 'Content-Type': 'application/json' }),
    ...(await authHeader()),
    ...(options.headers as Record<string, string> | undefined),
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  return parseResponse(response) as Promise<T>;
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
