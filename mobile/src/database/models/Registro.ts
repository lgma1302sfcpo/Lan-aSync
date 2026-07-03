import { Model, Query } from '@nozbe/watermelondb';
import { children, date, field, readonly, text } from '@nozbe/watermelondb/decorators';
import FotoRegistro from './FotoRegistro';

export default class Registro extends Model {
  static table = 'registros';

  static associations = {
    fotos_registro: { type: 'has_many', foreignKey: 'registro_id' },
  } as const;

  @field('empresa_id') empresaId!: string;
  @field('usuario_id') usuarioId!: string;
  @field('tipo') tipo!: 'COMPRA' | 'VENDA';
  @field('data_hora') dataHora!: number;
  @text('descricao') descricao!: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  @children('fotos_registro') fotos!: Query<FotoRegistro>;
}
