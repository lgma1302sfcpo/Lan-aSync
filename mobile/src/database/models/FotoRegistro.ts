import { Model } from '@nozbe/watermelondb';
import { date, field, readonly, text } from '@nozbe/watermelondb/decorators';

export default class FotoRegistro extends Model {
  static table = 'fotos_registro';

  static associations = {
    registros: { type: 'belongs_to', key: 'registro_id' },
  } as const;

  @field('registro_id') registroId!: string;
  @field('empresa_id') empresaId!: string;
  @field('local_uri') localUri!: string;
  @field('remote_url') remoteUrl!: string;
  @text('nome_arquivo') nomeArquivo!: string;
  @text('mime_type') mimeType!: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
