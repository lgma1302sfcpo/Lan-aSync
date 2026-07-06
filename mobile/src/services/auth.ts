import { apiRequest } from './api';
import { saveSession } from './sessionStorage';
import type { Session } from '../types/session';

type LoginResponse = Session & {
  timestamp: number;
};

export async function login(loginInput: string, senha: string) {
  const data = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login: loginInput, senha }),
  });

  await saveSession({ token: data.token, usuario: data.usuario });

  return { token: data.token, usuario: data.usuario };
}
