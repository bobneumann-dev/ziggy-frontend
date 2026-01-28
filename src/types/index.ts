export const StatusUsuario = {
  Ativo: 1,
  Inativo: 2,
  Bloqueado: 3,
} as const;

export type StatusUsuario = typeof StatusUsuario[keyof typeof StatusUsuario];

export const StatusPessoa = {
  Ativo: 1,
  Afastado: 2,
  Desligado: 3,
} as const;

export type StatusPessoa = typeof StatusPessoa[keyof typeof StatusPessoa];

export interface Usuario {
  id: string;
  login: string;
  status: StatusUsuario;
  roles: string;
  foto?: string;
  idioma?: string;
  preferencias?: string;
  pessoaId?: string;
  pessoaNome?: string;
  dataCriacao: string;
}

export interface Pessoa {
  id: string;
  nomeCompleto: string;
  email: string;
  telefone?: string;
  dataNascimento?: string;
  documento?: string;
  foto?: string;
  status: StatusPessoa;
  cargoAtualId?: string;
  cargoAtualNome?: string;
  setorAtualId?: string;
  setorAtualNome?: string;
  dataCriacao: string;
}

export interface Setor {
  id: string;
  nome: string;
  setorPaiId?: string;
  setorPaiNome?: string;
  quantidadeCargos: number;
  quantidadePessoas: number;
  dataCriacao: string;
}

export interface SetorTree {
  id: string;
  nome: string;
  setorPaiId?: string;
  filhos: SetorTree[];
  quantidadeCargos: number;
  quantidadePessoas: number;
}

export interface Cargo {
  id: string;
  nome: string;
  setorId: string;
  setorNome: string;
  cargoPaiId?: string;
  cargoPaiNome?: string;
  quantidadePessoas: number;
  quantidadeAtribuicoes: number;
  dataCriacao: string;
}

export interface Atribuicao {
  id: string;
  nome: string;
  descricao?: string;
  quantidadeCargos: number;
  quantidadePessoasExcecao: number;
  totalPessoasElegiveis: number;
  dataCriacao: string;
}

export interface PessoaElegivel {
  pessoaId: string;
  pessoaNome: string;
  email: string;
  cargoNome?: string;
  setorNome?: string;
  tipoVinculo: string;
  ativa: boolean;
}

export interface PessoaSetorCargo {
  id: string;
  pessoaId: string;
  pessoaNome: string;
  setorId: string;
  setorNome: string;
  cargoId: string;
  cargoNome: string;
  dataInicio: string;
  dataFim?: string;
  ativo: boolean;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}
