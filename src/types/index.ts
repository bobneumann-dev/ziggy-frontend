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

export interface Categoria {
  id: string;
  nome: string;
  categoriaPaiId?: string;
  categoriaPaiNome?: string;
  quantidadeAtribuicoes: number;
  dataCriacao: string;
}

export interface CategoriaTree {
  id: string;
  nome: string;
  categoriaPaiId?: string;
  filhas: CategoriaTree[];
  quantidadeAtribuicoes: number;
}

export interface Atribuicao {
  id: string;
  nome: string;
  descricao?: string;
  categoriaId?: string;
  categoriaNome?: string;
  quantidadeCargos: number;
  quantidadePessoasExcecao: number;
  totalPessoasElegiveis: number;
  dataCriacao: string;
}

export interface AtribuicaoCargo {
  id: string;
  atribuicaoId: string;
  atribuicaoNome: string;
  cargoId: string;
  cargoNome: string;
  setorNome: string;
}

export interface AtribuicaoPessoa {
  id: string;
  atribuicaoId: string;
  atribuicaoNome: string;
  pessoaId: string;
  pessoaNome: string;
  observacao?: string;
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

// === CATÁLOGO ===
export const TipoItemCatalogo = { Produto: 1, Servico: 2 } as const;
export type TipoItemCatalogo = typeof TipoItemCatalogo[keyof typeof TipoItemCatalogo];

export interface ItemCategoria {
  id: string; nome: string; codigo?: string; ordem: number; ativo: boolean;
  categoriaPaiId?: string; categoriaPaiNome?: string;
  dataCriacao: string;
}
export interface ItemCategoriaTree {
  id: string; nome: string; codigo?: string; ordem: number; ativo: boolean;
  categoriaPaiId?: string; filhas: ItemCategoriaTree[];
}
export interface ItemCatalogo {
  id: string; codigo: string; nome: string; categoriaId?: string; categoriaNome?: string;
  tipo: TipoItemCatalogo;
  vendavel: boolean; compravel: boolean; estocavel: boolean; serializado: boolean;
  unidade: string; precoBase?: number; precoMinimo?: number;
  moedaId?: string; moedaSimbolo?: string; moedaCodigo?: string;
  atribuicaoId?: string; atribuicaoNome?: string;
  ativo: boolean; dataCriacao: string;
}

// === ESTOQUE ===
export const TipoArmazem = { Central: 1, Setor: 2, Viatura: 3, ClienteFinal: 4, Colaborador: 5 } as const;
export type TipoArmazem = typeof TipoArmazem[keyof typeof TipoArmazem];

export interface CategoriaArmazem {
  id: string; nome: string; descricao?: string; ativo: boolean; dataCriacao: string;
}

export interface Armazem {
  id: string; nome: string; categoriaId?: string; categoriaNome?: string; ativo: boolean; dataCriacao: string;
}
export interface EstoqueSaldo {
  armazemId: string; armazemNome: string;
  itemCatalogoId: string; itemCatalogoNome: string;
  quantidadeFisica: number; quantidadeReservada: number;
}

export const TipoMovimentoEstoque = { Entrada: 1, Saida: 2, Transferencia: 3, Ajuste: 4 } as const;
export type TipoMovimentoEstoque = typeof TipoMovimentoEstoque[keyof typeof TipoMovimentoEstoque];

export interface MovimentoEstoque {
  id: string; tipo: TipoMovimentoEstoque;
  itemCatalogoId: string; itemCatalogoNome: string;
  armazemOrigemId?: string; armazemOrigemNome?: string;
  armazemDestinoId?: string; armazemDestinoNome?: string;
  quantidade: number; observacao?: string; dataCriacao: string;
}

// === PATRIMÔNIO ===
export const StatusAtivo = { Disponivel: 1, Reservado: 2, EmUso: 3, Manutencao: 4, Baixado: 5 } as const;
export type StatusAtivo = typeof StatusAtivo[keyof typeof StatusAtivo];

export interface AtivoPatrimonio {
  id: string; serial: string;
  itemCatalogoId: string; itemCatalogoNome: string;
  armazemAtualId: string; armazemAtualNome: string;
  status: StatusAtivo;
  contratoVinculadoId?: string; clienteId?: string; clienteNome?: string;
  dataCriacao: string;
}

// === CADASTROS (País, Departamento, Cidade) ===
export interface Pais {
  id: number;
  nome: string;
  codigoIso: string;
  ddi: string;
}

export interface Departamento {
  id: number;
  nome: string;
  abreviacao?: string;
  paisId: number;
  paisNome: string;
}

export interface Cidade {
  id: number;
  nome: string;
  departamentoId: number;
  departamentoNome: string;
  paisId: number;
  paisNome: string;
}

// === CONTATO / ENDEREÇO ===
export const TipoContato = { Telefone: 1, Celular: 2, Email: 3, WhatsApp: 4, Outro: 99 } as const;
export type TipoContato = typeof TipoContato[keyof typeof TipoContato];

export const TipoDocumento = {
  BR_CPF: 10, BR_CNPJ: 11, BR_RG: 12,
  PY_RUC: 20, PY_CI: 21,
  AR_CUIT: 30, AR_CUIL: 31, AR_DNI: 32,
  Passaporte: 99, Outro: 100
} as const;
export type TipoDocumento = typeof TipoDocumento[keyof typeof TipoDocumento];

export const Nacionalidade = {
  Brasileira: 1, Paraguaia: 2, Argentina: 3, Uruguaia: 4, Boliviana: 5,
  Chilena: 6, Colombiana: 7, Peruana: 8, Venezuelana: 9, Outra: 99
} as const;
export type Nacionalidade = typeof Nacionalidade[keyof typeof Nacionalidade];

export interface ContatoDto {
  id: string;
  tipo: TipoContato;
  valor: string;
  descricao?: string;
  contatoAutomatico: boolean;
  principal: boolean;
}

export interface EnderecoDto {
  id: string;
  logradouro1?: string;
  logradouro2?: string;
  cep?: string;
  cidadeId?: number;
  cidadeNome?: string;
  departamentoNome?: string;
  paisNome?: string;
  principal: boolean;
}

// === CLIENTE / FORNECEDOR ===
export interface ClienteFornecedor {
  id: string;
  nomeRazaoSocial: string;
  documento?: string;
  tipoDocumento?: TipoDocumento;
  nacionalidade?: Nacionalidade;
  ativo: boolean;
  status: number;
  isCliente: boolean;
  isFornecedor: boolean;
  dataCriacao: string;
  contatos: ContatoDto[];
  enderecos: EnderecoDto[];
}

// === COMERCIAL ===
export const EstagioFunil = { Lead: 1, Qualificacao: 2, Visita: 3, Proposta: 4, Negociacao: 5, Ganha: 6, Perdida: 7 } as const;
export type EstagioFunil = typeof EstagioFunil[keyof typeof EstagioFunil];

export interface Oportunidade {
  id: string; clienteId: string; clienteNome: string;
  titulo: string; estagio: EstagioFunil; valorTotal: number;
  readOnly: boolean; contratoGeradoId?: string;
  itens: OportunidadeItem[];
  dataCriacao: string;
}
export interface OportunidadeItem {
  id: string; oportunidadeId: string;
  itemCatalogoId: string; itemCatalogoNome: string;
  quantidade: number; valorUnitario: number; valorTotal: number; ordem: number;
}

export const StatusContratoComercial = { Rascunho: 1, AguardandoInstalacao: 2, Ativo: 3, Cancelado: 4 } as const;
export type StatusContratoComercial = typeof StatusContratoComercial[keyof typeof StatusContratoComercial];

export interface ContratoComercial {
  id: string; clienteId: string; clienteNome: string;
  oportunidadeOrigemId: string; status: StatusContratoComercial;
  valorEntrada: number; valorRecorrente: number; diaVencimento: number;
  itens: ContratoComercialItem[];
  dataCriacao: string;
}
export interface ContratoComercialItem {
  id: string; contratoId: string;
  itemCatalogoId: string; itemCatalogoNome: string;
  quantidade: number; valorUnitario: number; valorTotal: number; ordem: number;
}

export interface ModeloContrato {
  id: string; nome: string; descricao?: string; versao: number; ativo: boolean;
  escopoJson?: string;
  secoes: ModeloSecao[];
  assinaturas: ModeloAssinatura[];
  palavrasChave: ModeloPalavraChave[];
  createdAt: string; updatedAt?: string;
}
export interface ModeloSecao {
  id: string; secaoPaiId?: string; titulo: string; codigoIdentificador?: string;
  ordem: number; paragrafos: ModeloParagrafo[]; filhas: ModeloSecao[];
}
export interface ModeloParagrafo {
  id: string; ordem: number; conteudo: string; isHtml: boolean;
  condicaoExibicao?: string; codigoIdentificador?: string;
}
export interface ModeloAssinatura {
  id: string; papel: string; ordem: number; obrigatoria: boolean;
}
export interface ModeloPalavraChave {
  id: string; tag: string; descricao: string; exemplo?: string;
}

// === PROPOSTA (ORÇAMENTO) ===
export const StatusProposta = { Rascunho: 1, Enviada: 2, Aprovada: 3, Rejeitada: 4 } as const;
export type StatusProposta = typeof StatusProposta[keyof typeof StatusProposta];

export const TipoCobranca = { Fixo: 1, Parcelado: 2, Recorrente: 3 } as const;
export type TipoCobranca = typeof TipoCobranca[keyof typeof TipoCobranca];

export interface Proposta {
  id: string; oportunidadeId?: string; clienteId: string; clienteNome?: string;
  status: StatusProposta; titulo?: string; observacoes?: string;
  validaAte: string; prazoInstalacaoDias?: number;
  subtotal: number; descontoGlobal: number; descontoGlobalPercentual: boolean;
  impostosTotal: number; total: number;
  createdAt: string; updatedAt?: string;
  itens: PropostaItem[]; versoes: PropostaVersao[];
}
export interface PropostaItem {
  id: string; propostaId: string; itemCatalogoId: string;
  itemNomeSnapshot: string; unidadeSnapshot: string;
  quantidade: number; valorUnitario: number;
  desconto: number; descontoPercentual: boolean;
  aliquotaImposto: number; impostoValor: number; totalItem: number;
  tipoCobranca: TipoCobranca; numeroParcelas?: number;
  ordem: number;
}
export interface PropostaVersao {
  id: string; propostaId: string; numeroVersao: number;
  statusNoMomento: StatusProposta;
  pdfUrl?: string; hashConteudo?: string; snapshotJson: string;
  geradoPorUsuarioId?: string; createdAt: string;
}

// === CONTRATO DOCUMENTO ===
export const TipoContratoDocumento = { Contrato: 1, Aditivo: 2, Termo: 3 } as const;
export type TipoContratoDocumento = typeof TipoContratoDocumento[keyof typeof TipoContratoDocumento];

export const StatusAssinatura = { Pendente: 1, Assinado: 2, Recusado: 3 } as const;
export type StatusAssinatura = typeof StatusAssinatura[keyof typeof StatusAssinatura];

export interface ContratoDocumento {
  id: string; contratoId: string; modeloContratoId: string; versaoModelo: number;
  tipo: TipoContratoDocumento;
  conteudoCompilado: string; valoresSubstituicaoJson: string;
  clausulasAplicadasJson: string;
  pdfUrl?: string; hashConteudo?: string;
  geradoPorUsuarioId?: string; createdAt: string;
  assinaturas: ContratoDocumentoAssinatura[];
}
export interface ContratoDocumentoAssinatura {
  id: string; contratoDocumentoId: string;
  papel: string; nome: string; documento?: string; cargo?: string;
  status: StatusAssinatura; assinadoEm?: string;
  assinaturaImagemUrl?: string; provedorAssinatura?: string;
}

// === MOEDA ===
export interface Moeda {
  id: string;
  nome: string;
  codigo: string;
  simbolo: string;
  ativo: boolean;
  createdAt: string;
}

export interface Cotacao {
  id: string;
  moedaBaseId: string;
  moedaBaseCodigo?: string;
  moedaBaseSimbolo?: string;
  moedaCotacaoId: string;
  moedaCotacaoCodigo?: string;
  moedaCotacaoSimbolo?: string;
  taxaCompra: number;
  taxaVenda: number;
  data: string;
  createdAt: string;
}

// === EMPRESA ===
export interface Empresa {
  id: string;
  matrizFilialId: string;
  matrizFilialNome?: string;
  nomeRazaoSocial: string;
  nomeCurto: string;
  documento?: string;
  tipoDocumento?: TipoDocumento;
  logoUrl?: string;
  logoSmallUrl?: string;
  logoDarkUrl?: string;
  website?: string;
  slogan?: string;
  corPrimaria?: string;
  corSecundaria?: string;
  telefone?: string;
  celular?: string;
  email?: string;
  whatsApp?: string;
  logradouro1?: string;
  logradouro2?: string;
  cep?: string;
  cidadeId?: number;
  cidadeNome?: string;
  departamentoNome?: string;
  paisNome?: string;
  dataCriacao: string;
}

export interface Filial {
  id: string;
  nome: string;
  tipo: number;
}
