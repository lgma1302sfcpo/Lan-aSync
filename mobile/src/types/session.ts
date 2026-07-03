export type EmpresaDTO = {
  id: string;
  nome: string;
};

export type UsuarioDTO = {
  id: string;
  nome: string;
  login: string;
  empresa_id: string;
  empresa: EmpresaDTO;
};

export type Session = {
  token: string;
  usuario: UsuarioDTO;
};
