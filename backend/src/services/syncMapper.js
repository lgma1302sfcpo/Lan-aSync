const { toTimestamp } = require('./date');

function isCreatedAfter(row, lastPulledAt) {
  return toTimestamp(row.created_at) > Number(lastPulledAt || 0);
}

function splitRows(rows, lastPulledAt, mapper) {
  return rows.reduce(
    (acc, row) => {
      if (row.deleted_at) {
        acc.deleted.push(String(row.id));
        return acc;
      }

      const bucket = isCreatedAfter(row, lastPulledAt) ? 'created' : 'updated';
      acc[bucket].push(mapper(row));
      return acc;
    },
    { created: [], updated: [], deleted: [] },
  );
}

function mapEmpresa(row) {
  return {
    id: String(row.id),
    nome: row.nome,
    created_at: toTimestamp(row.created_at),
    updated_at: toTimestamp(row.updated_at),
  };
}

function mapUsuario(row) {
  return {
    id: String(row.id),
    nome: row.nome,
    login: row.login,
    empresa_id: String(row.empresa_id),
    created_at: toTimestamp(row.created_at),
    updated_at: toTimestamp(row.updated_at),
  };
}

function mapRegistro(row) {
  return {
    id: String(row.id),
    empresa_id: String(row.empresa_id),
    usuario_id: String(row.usuario_id),
    tipo: row.tipo,
    data_hora: toTimestamp(row.data_hora),
    descricao: row.descricao,
    created_at: toTimestamp(row.created_at),
    updated_at: toTimestamp(row.updated_at),
  };
}

function mapFoto(row) {
  return {
    id: String(row.id),
    registro_id: String(row.registro_id),
    empresa_id: String(row.empresa_id),
    local_uri: row.local_uri || '',
    remote_url: row.remote_url || row.caminho || '',
    nome_arquivo: row.nome_arquivo || '',
    mime_type: row.mime_type || '',
    created_at: toTimestamp(row.created_at),
    updated_at: toTimestamp(row.updated_at),
  };
}

module.exports = {
  mapEmpresa,
  mapFoto,
  mapRegistro,
  mapUsuario,
  splitRows,
};
