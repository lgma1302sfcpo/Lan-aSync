const pool = require('../config/db');
const { toMysqlDate } = require('../services/date');
const {
  mapEmpresa,
  mapFoto,
  mapRegistro,
  mapUsuario,
  splitRows,
} = require('../services/syncMapper');

function normalizeChanges(changes, table) {
  const current = changes && changes[table] ? changes[table] : {};
  return {
    created: current.created || [],
    updated: current.updated || [],
    deleted: current.deleted || [],
  };
}

async function pull(req, res, next) {
  try {
    const lastPulledAt = Number(req.query.lastPulledAt || 0);
    const changedAfter = toMysqlDate(lastPulledAt);
    const syncTimestamp = Date.now();
    const changedUntil = toMysqlDate(syncTimestamp);
    const empresaId = req.user.empresaId;
    const userId = req.user.id;

    const [empresas] = await pool.execute(
      `SELECT id, nome, created_at, updated_at, deleted_at
       FROM empresa
       WHERE id = :empresaId
         AND updated_at > :changedAfter
         AND updated_at <= :changedUntil`,
      { empresaId, changedAfter, changedUntil },
    );

    const [usuarios] = await pool.execute(
      `SELECT id, nome, login, empresa_id, created_at, updated_at, deleted_at
       FROM usuario
       WHERE empresa_id = :empresaId
         AND id = :userId
         AND updated_at > :changedAfter
         AND updated_at <= :changedUntil`,
      { empresaId, userId, changedAfter, changedUntil },
    );

    const [registros] = await pool.execute(
      `SELECT id, empresa_id, usuario_id, tipo, data_hora, descricao, created_at, updated_at, deleted_at
       FROM registro
       WHERE empresa_id = :empresaId
         AND updated_at > :changedAfter
         AND updated_at <= :changedUntil`,
      { empresaId, changedAfter, changedUntil },
    );

    const [fotos] = await pool.execute(
      `SELECT id, registro_id, empresa_id, local_uri, remote_url, caminho, nome_arquivo,
              mime_type, created_at, updated_at, deleted_at
       FROM foto_registro
       WHERE empresa_id = :empresaId
         AND updated_at > :changedAfter
         AND updated_at <= :changedUntil`,
      { empresaId, changedAfter, changedUntil },
    );

    return res.json({
      changes: {
        empresas: splitRows(empresas, lastPulledAt, mapEmpresa),
        usuarios: splitRows(usuarios, lastPulledAt, mapUsuario),
        registros: splitRows(registros, lastPulledAt, mapRegistro),
        fotos_registro: splitRows(fotos, lastPulledAt, mapFoto),
      },
      timestamp: syncTimestamp,
    });
  } catch (error) {
    return next(error);
  }
}

async function upsertRegistro(connection, data, req) {
  if (!data.id) {
    return;
  }

  await connection.execute(
    `INSERT INTO registro (
       id, empresa_id, usuario_id, tipo, data_hora, descricao, created_at, updated_at, deleted_at
     ) VALUES (
       :id, :empresaId, :usuarioId, :tipo, :dataHora, :descricao, NOW(3), NOW(3), NULL
     )
     ON DUPLICATE KEY UPDATE
       tipo = VALUES(tipo),
       data_hora = VALUES(data_hora),
       descricao = VALUES(descricao),
       updated_at = NOW(3),
       deleted_at = NULL`,
    {
      id: String(data.id),
      empresaId: req.user.empresaId,
      usuarioId: req.user.id,
      tipo: data.tipo === 'VENDA' ? 'VENDA' : 'COMPRA',
      dataHora: toMysqlDate(data.data_hora || Date.now()),
      descricao: data.descricao || '',
    },
  );
}

async function upsertFoto(connection, data, req) {
  if (!data.id || !data.registro_id) {
    return;
  }

  await connection.execute(
    `INSERT INTO foto_registro (
       id, registro_id, empresa_id, local_uri, remote_url, caminho, nome_arquivo,
       mime_type, created_at, updated_at, deleted_at
     ) VALUES (
       :id, :registroId, :empresaId, :localUri, :remoteUrl, :caminho, :nomeArquivo,
       :mimeType, NOW(3), NOW(3), NULL
     )
     ON DUPLICATE KEY UPDATE
       local_uri = VALUES(local_uri),
       remote_url = VALUES(remote_url),
       caminho = VALUES(caminho),
       nome_arquivo = VALUES(nome_arquivo),
       mime_type = VALUES(mime_type),
       updated_at = NOW(3),
       deleted_at = NULL`,
    {
      id: String(data.id),
      registroId: String(data.registro_id),
      empresaId: req.user.empresaId,
      localUri: data.local_uri || '',
      remoteUrl: data.remote_url || '',
      caminho: data.remote_url || data.local_uri || '',
      nomeArquivo: data.nome_arquivo || '',
      mimeType: data.mime_type || '',
    },
  );
}

async function push(req, res, next) {
  const connection = await pool.getConnection();

  try {
    const changes = req.body.changes || {};
    const registros = normalizeChanges(changes, 'registros');
    const fotos = normalizeChanges(changes, 'fotos_registro');

    await connection.beginTransaction();

    for (const registro of [...registros.created, ...registros.updated]) {
      await upsertRegistro(connection, registro, req);
    }

    for (const foto of [...fotos.created, ...fotos.updated]) {
      await upsertFoto(connection, foto, req);
    }

    for (const id of registros.deleted) {
      await connection.execute(
        `UPDATE registro
         SET deleted_at = NOW(3), updated_at = NOW(3)
         WHERE id = :id AND empresa_id = :empresaId`,
        { id, empresaId: req.user.empresaId },
      );
    }

    for (const id of fotos.deleted) {
      await connection.execute(
        `UPDATE foto_registro
         SET deleted_at = NOW(3), updated_at = NOW(3)
         WHERE id = :id AND empresa_id = :empresaId`,
        { id, empresaId: req.user.empresaId },
      );
    }

    await connection.commit();
    return res.json({ ok: true, timestamp: Date.now() });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}

module.exports = { pull, push };
