import { database } from '.';
import Empresa from './models/Empresa';
import Usuario from './models/Usuario';
import type { UsuarioDTO } from '../types/session';

async function upsertEmpresa(empresa: UsuarioDTO['empresa']) {
  const collection = database.collections.get<Empresa>('empresas');

  try {
    const current = await collection.find(empresa.id);
    await current.update(item => {
      item.nome = empresa.nome;
    });
  } catch (_error) {
    await collection.create(item => {
      (item as unknown as { _raw: { id: string } })._raw.id = empresa.id;
      item.nome = empresa.nome;
    });
  }
}

async function upsertUsuario(usuario: UsuarioDTO) {
  const collection = database.collections.get<Usuario>('usuarios');

  try {
    const current = await collection.find(usuario.id);
    await current.update(item => {
      item.nome = usuario.nome;
      item.login = usuario.login;
      item.empresaId = usuario.empresa_id;
    });
  } catch (_error) {
    await collection.create(item => {
      (item as unknown as { _raw: { id: string } })._raw.id = usuario.id;
      item.nome = usuario.nome;
      item.login = usuario.login;
      item.empresaId = usuario.empresa_id;
    });
  }
}

export async function persistLoggedUser(usuario: UsuarioDTO) {
  await database.write(async () => {
    await upsertEmpresa(usuario.empresa);
    await upsertUsuario(usuario);
  });
}
