import { Q } from '@nozbe/watermelondb';
import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '../database';
import FotoRegistro from '../database/models/FotoRegistro';
import { apiRequest, uploadPhotoFile } from './api';
import { getSession } from './sessionStorage';

type PullResponse = {
  changes: SyncChanges;
  timestamp: number;
};

type SyncRecord = {
  id?: string;
  [key: string]: unknown;
};

type TableChanges = {
  created: SyncRecord[];
  updated: SyncRecord[];
  deleted: string[];
};

type SyncChanges = Record<string, TableChanges>;

const SYNC_TABLES = ['empresas', 'usuarios', 'registros', 'fotos_registro'] as const;

async function localRecordExists(table: typeof SYNC_TABLES[number], id: unknown) {
  if (!id) {
    return false;
  }

  try {
    await database.collections.get(table).find(String(id));
    return true;
  } catch (_error) {
    return false;
  }
}

async function moveExistingCreatedRecordsToUpdated(changes: SyncChanges) {
  const nextChanges: SyncChanges = { ...changes };

  for (const table of SYNC_TABLES) {
    const tableChanges = nextChanges[table];
    if (!tableChanges?.created?.length) {
      continue;
    }

    const created: SyncRecord[] = [];
    const updated: SyncRecord[] = [...(tableChanges.updated || [])];

    for (const record of tableChanges.created) {
      if (await localRecordExists(table, record.id)) {
        updated.push(record);
      } else {
        created.push(record);
      }
    }

    nextChanges[table] = {
      created,
      updated,
      deleted: tableChanges.deleted || [],
    };
  }

  return nextChanges;
}

export async function syncDatabase() {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      const data = await apiRequest<PullResponse>(`/sync?lastPulledAt=${lastPulledAt || 0}`);
      const changes = await moveExistingCreatedRecordsToUpdated(data.changes);

      return {
        changes,
        timestamp: data.timestamp,
      };
    },
    pushChanges: async ({ changes, lastPulledAt }) => {
      await apiRequest('/sync', {
        method: 'POST',
        body: JSON.stringify({ changes, lastPulledAt }),
      });
    },
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
