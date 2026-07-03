import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'empresas',
      columns: [
        { name: 'nome', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'usuarios',
      columns: [
        { name: 'nome', type: 'string' },
        { name: 'login', type: 'string', isIndexed: true },
        { name: 'empresa_id', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'registros',
      columns: [
        { name: 'empresa_id', type: 'string', isIndexed: true },
        { name: 'usuario_id', type: 'string', isIndexed: true },
        { name: 'tipo', type: 'string' },
        { name: 'data_hora', type: 'number', isIndexed: true },
        { name: 'descricao', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'fotos_registro',
      columns: [
        { name: 'registro_id', type: 'string', isIndexed: true },
        { name: 'empresa_id', type: 'string', isIndexed: true },
        { name: 'local_uri', type: 'string' },
        { name: 'remote_url', type: 'string' },
        { name: 'nome_arquivo', type: 'string' },
        { name: 'mime_type', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
