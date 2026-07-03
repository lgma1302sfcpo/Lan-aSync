import { Q } from '@nozbe/watermelondb';
import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '../database';
import FotoRegistro from '../database/models/FotoRegistro';
import { apiRequest, uploadPhotoFile } from './api';
import { getSession } from './sessionStorage';

type PullResponse = {
  changes: Record<string, unknown>;
  timestamp: number;
};

export async function syncDatabase() {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      const data = await apiRequest<PullResponse>(`/sync?lastPulledAt=${lastPulledAt || 0}`);
      return {
        changes: data.changes,
        timestamp: data.timestamp,
      };
    },
    pushChanges: async ({ changes, lastPulledAt }) => {
      await apiRequest('/sync', {
        method: 'POST',
        body: JSON.stringify({ changes, lastPulledAt }),
      });
    },
    migrationsEnabledAtVersion: 1,
  });

  await uploadPendingPhotoFiles();
}

async function uploadPendingPhotoFiles() {
  const session = await getSession();
  if (!session) {
    return;
  }

  const fotos = await database.collections
    .get<FotoRegistro>('fotos_registro')
    .query(Q.where('empresa_id', session.usuario.empresa_id), Q.where('remote_url', ''))
    .fetch();

  for (const foto of fotos) {
    if (!foto.localUri || (!foto.localUri.startsWith('file:') && !foto.localUri.startsWith('content:'))) {
      continue;
    }

    try {
      const result = await uploadPhotoFile(
        foto.registroId,
        foto.id,
        foto.localUri,
        foto.nomeArquivo,
        foto.mimeType,
      );

      await database.write(async () => {
        await foto.update(item => {
          item.remoteUrl = result.remote_url;
        });
      });
    } catch (error) {
      console.warn('Nao foi possivel enviar foto agora', error);
    }
  }
}
