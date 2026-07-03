import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import Empresa from './models/Empresa';
import FotoRegistro from './models/FotoRegistro';
import Registro from './models/Registro';
import Usuario from './models/Usuario';
import { schema } from './schema';

const adapter = new SQLiteAdapter({
  schema,
  jsi: false,
  onSetUpError: error => {
    console.error('Erro ao configurar WatermelonDB', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Empresa, Usuario, Registro, FotoRegistro],
});

export type Collections = {
  empresas: Empresa;
  usuarios: Usuario;
  registros: Registro;
  fotos_registro: FotoRegistro;
};
