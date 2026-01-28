import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Users,
  ChevronRight,
  ChevronDown,
  UserPlus,
  Briefcase,
  X
} from 'lucide-react';
import api from '../lib/api';
import type {
  Atribuicao,
  AtribuicaoCargo,
  AtribuicaoPessoa,
  Categoria,
  CategoriaTree,
  Pessoa,
  Setor,
  Cargo
} from '../types';

export default function Atribuicoes() {
  const [atribuicoesLoading, setAtribuicoesLoading] = useState(true);
  const [atribuicoes, setAtribuicoes] = useState<Atribuicao[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaTree, setCategoriaTree] = useState<CategoriaTree | null>(null);
  const [expandedCategorias, setExpandedCategorias] = useState<Set<string>>(new Set());

  const [selectedAtribuicaoId, setSelectedAtribuicaoId] = useState<string | null>(null);
  const [selectedAtribuicao, setSelectedAtribuicao] = useState<Atribuicao | null>(null);

  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);

  const [atribPessoas, setAtribPessoas] = useState<AtribuicaoPessoa[]>([]);
  const [atribCargos, setAtribCargos] = useState<AtribuicaoCargo[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [draggingAtribuicaoId, setDraggingAtribuicaoId] = useState<string | null>(null);
  const [dropTargetCategoriaId, setDropTargetCategoriaId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAtribuicaoId, setEditingAtribuicaoId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    categoriaId: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const nomeInputRef = useRef<HTMLInputElement | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Atribuicao | null>(null);

  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);
  const [categoriaForm, setCategoriaForm] = useState({ nome: '', categoriaPaiId: '' });
  const [categoriaErrors, setCategoriaErrors] = useState<Record<string, string>>({});

  const [addPessoaId, setAddPessoaId] = useState('');
  const [addSetorId, setAddSetorId] = useState('');
  const [addCargoId, setAddCargoId] = useState('');
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});

  const fetchAtribuicoes = async () => {
    setAtribuicoesLoading(true);
    try {
      const response = await api.get<Atribuicao[]>('/atribuicoes');
      setAtribuicoes(response.data);
    } catch (error) {
      console.error('Erro ao carregar atribuicoes:', error);
    } finally {
      setAtribuicoesLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const [categoriasResponse, treeResponse] = await Promise.all([
        api.get<Categoria[]>('/categorias'),
        api.get<CategoriaTree>('/categorias/tree')
      ]);
      setCategorias(categoriasResponse.data);
      setCategoriaTree(treeResponse.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const fetchPeopleAndCargos = async () => {
    try {
      const [pessoasResponse, setoresResponse, cargosResponse] = await Promise.all([
        api.get<Pessoa[]>('/pessoas'),
        api.get<Setor[]>('/setores'),
        api.get<Cargo[]>('/cargos'),
      ]);
      setPessoas(pessoasResponse.data);
      setSetores(setoresResponse.data);
      setCargos(cargosResponse.data);
    } catch (error) {
      console.error('Erro ao carregar pessoas, setores e cargos:', error);
    }
  };

  const fetchRelacionamentos = async (atribId: string) => {
    setLoadingDetails(true);
    try {
      const [pessoasResponse, cargosResponse] = await Promise.all([
        api.get<AtribuicaoPessoa[]>(`/atribuicoes/${atribId}/pessoas`),
        api.get<AtribuicaoCargo[]>(`/atribuicoes/${atribId}/cargos`)
      ]);
      setAtribPessoas(pessoasResponse.data);
      setAtribCargos(cargosResponse.data);
    } catch (error) {
      console.error('Erro ao carregar detalhes da atribuicao:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchAtribuicoes();
    fetchCategorias();
    fetchPeopleAndCargos();
  }, []);

  useEffect(() => {
    if (!selectedAtribuicaoId) {
      setSelectedAtribuicao(null);
      return;
    }
    const found = atribuicoes.find(item => item.id === selectedAtribuicaoId) || null;
    setSelectedAtribuicao(found);
  }, [atribuicoes, selectedAtribuicaoId]);

  const handleSelectAtribuicao = async (atrib: Atribuicao) => {
    setSelectedAtribuicaoId(atrib.id);
    setSelectedAtribuicao(atrib);
    setActionErrors({});
    setAddPessoaId('');
    setAddSetorId('');
    setAddCargoId('');
    await fetchRelacionamentos(atrib.id);
  };

  const handleOpenModal = (atrib?: Atribuicao, presetCategoriaId?: string) => {
    if (atrib) {
      setEditingAtribuicaoId(atrib.id);
      setFormData({
        nome: atrib.nome || '',
        descricao: atrib.descricao || '',
        categoriaId: atrib.categoriaId || ''
      });
    } else {
      setEditingAtribuicaoId(null);
      setFormData({
        nome: '',
        descricao: '',
        categoriaId: presetCategoriaId || ''
      });
    }
    setFormErrors({});
    setIsModalOpen(true);
    setTimeout(() => nomeInputRef.current?.focus(), 0);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAtribuicaoId(null);
    setFormData({
      nome: '',
      descricao: '',
      categoriaId: ''
    });
    setFormErrors({});
  };

  const handleOpenCategoriaModal = (parentId?: string) => {
    setCategoriaForm({ nome: '', categoriaPaiId: parentId || '' });
    setCategoriaErrors({});
    setIsCategoriaModalOpen(true);
  };

  const handleCloseCategoriaModal = () => {
    setIsCategoriaModalOpen(false);
    setCategoriaForm({ nome: '', categoriaPaiId: '' });
    setCategoriaErrors({});
  };

  const handleSubmitCategoria = async (e: FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!categoriaForm.nome.trim()) errors.nome = 'Informe o nome da categoria.';
    if (Object.keys(errors).length) {
      setCategoriaErrors(errors);
      return;
    }

    try {
      setAtribuicoesLoading(true);
      await api.post('/categorias', {
        nome: categoriaForm.nome,
        categoriaPaiId: categoriaForm.categoriaPaiId || null
      });
      await fetchCategorias();
      handleCloseCategoriaModal();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      setCategoriaErrors(prev => ({
        ...prev,
        geral: 'Nao foi possivel salvar a categoria.'
      }));
    } finally {
      setAtribuicoesLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.nome.trim()) errors.nome = 'Informe o nome da atribuicao.';
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    try {
      setAtribuicoesLoading(true);
      const payload = {
        nome: formData.nome,
        descricao: formData.descricao || null,
        categoriaId: formData.categoriaId || null
      };

      if (editingAtribuicaoId) {
        await api.put(`/atribuicoes/${editingAtribuicaoId}`, payload);
      } else {
        await api.post('/atribuicoes', payload);
      }

      await Promise.all([fetchAtribuicoes(), fetchCategorias()]);
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar atribuicao:', error);
      setFormErrors(prev => ({
        ...prev,
        geral: 'Nao foi possivel salvar a atribuicao.'
      }));
    } finally {
      setAtribuicoesLoading(false);
    }
  };

  const handleDelete = (atrib: Atribuicao) => {
    setDeleteTarget(atrib);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setAtribuicoesLoading(true);
      await api.delete(`/atribuicoes/${deleteTarget.id}`);
      await Promise.all([fetchAtribuicoes(), fetchCategorias()]);
      if (selectedAtribuicaoId === deleteTarget.id) {
        setSelectedAtribuicaoId(null);
        setAtribPessoas([]);
        setAtribCargos([]);
      }
      setIsDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Erro ao deletar atribuicao:', error);
    } finally {
      setAtribuicoesLoading(false);
    }
  };

  const handleCloseDelete = () => {
    setIsDeleteOpen(false);
    setDeleteTarget(null);
  };

  const handleAddPessoa = async () => {
    if (!selectedAtribuicao) return;
    if (!addPessoaId) {
      setActionErrors(prev => ({ ...prev, pessoa: 'Selecione uma pessoa.' }));
      return;
    }

    try {
      setLoadingDetails(true);
      await api.post('/atribuicoes/pessoa', {
        atribuicaoId: selectedAtribuicao.id,
        pessoaId: addPessoaId
      });
      await fetchRelacionamentos(selectedAtribuicao.id);
      setAddPessoaId('');
      setActionErrors(prev => ({ ...prev, pessoa: '' }));
    } catch (error) {
      console.error('Erro ao adicionar pessoa:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleRemovePessoa = async (id: string) => {
    if (!selectedAtribuicao) return;
    try {
      setLoadingDetails(true);
      await api.delete(`/atribuicoes/pessoa/${id}`);
      await fetchRelacionamentos(selectedAtribuicao.id);
    } catch (error) {
      console.error('Erro ao remover pessoa:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAddCargo = async () => {
    if (!selectedAtribuicao) return;
    const errors: Record<string, string> = {};
    if (!addCargoId) errors.cargo = 'Selecione um cargo.';
    if (Object.keys(errors).length) {
      setActionErrors(prev => ({ ...prev, ...errors }));
      return;
    }

    try {
      setLoadingDetails(true);
      await api.post('/atribuicoes/cargo', {
        atribuicaoId: selectedAtribuicao.id,
        cargoId: addCargoId
      });
      await fetchRelacionamentos(selectedAtribuicao.id);
      setAddCargoId('');
      setActionErrors(prev => ({ ...prev, cargo: '' }));
    } catch (error) {
      console.error('Erro ao adicionar cargo:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleRemoveCargo = async (id: string) => {
    if (!selectedAtribuicao) return;
    try {
      setLoadingDetails(true);
      await api.delete(`/atribuicoes/cargo/${id}`);
      await fetchRelacionamentos(selectedAtribuicao.id);
    } catch (error) {
      console.error('Erro ao remover cargo:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDropCategoria = async (categoriaId: string | null, atribId: string) => {
    try {
      setAtribuicoesLoading(true);
      await api.put(`/atribuicoes/${atribId}`, { categoriaId });
      await Promise.all([fetchAtribuicoes(), fetchCategorias()]);
    } catch (error) {
      console.error('Erro ao mover atribuicao:', error);
    } finally {
      setAtribuicoesLoading(false);
    }
  };

  const toggleCategoria = (id: string) => {
    setExpandedCategorias(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const categoriasOptions = useMemo(() => {
    const options: { id: string; label: string }[] = [];

    const addNode = (node: CategoriaTree, level: number) => {
      options.push({ id: node.id, label: `${'-'.repeat(level * 2)} ${node.nome}`.trim() });
      node.filhas?.forEach(child => addNode(child, level + 1));
    };

    if (categoriaTree?.filhas?.length) {
      categoriaTree.filhas.forEach(node => addNode(node, 0));
    } else {
      categorias.forEach(categoria => {
        options.push({ id: categoria.id, label: categoria.nome });
      });
    }

    return options;
  }, [categoriaTree, categorias]);

  const atribuicoesByCategoria = useMemo(() => {
    const map = new Map<string, Atribuicao[]>();
    atribuicoes.forEach(atrib => {
      const key = atrib.categoriaId || 'sem-categoria';
      const list = map.get(key) || [];
      list.push(atrib);
      map.set(key, list);
    });
    return map;
  }, [atribuicoes]);

  const availablePessoas = useMemo(() => {
    const assigned = new Set(atribPessoas.map(item => item.pessoaId));
    return pessoas.filter(p => !assigned.has(p.id));
  }, [pessoas, atribPessoas]);

  const filteredCargos = useMemo(() => {
    if (!addSetorId) return cargos;
    return cargos.filter(cargo => cargo.setorId === addSetorId);
  }, [cargos, addSetorId]);

  const renderAtribuicaoRow = (atrib: Atribuicao, level: number) => (
    <div
      key={atrib.id}
      className={`atribuicao-row flex items-start justify-between py-2 px-4 cursor-pointer transition-colors ${
        selectedAtribuicaoId === atrib.id ? 'atribuicao-row-selected' : ''
      } ${draggingAtribuicaoId === atrib.id ? 'atribuicao-dragging' : ''}`}
      style={{ paddingLeft: `${level * 24 + 16}px` }}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', atrib.id);
        event.dataTransfer.effectAllowed = 'move';
        setDraggingAtribuicaoId(atrib.id);
        const preview = document.createElement('div');
        preview.className = 'atribuicao-drag-preview';
        preview.textContent = atrib.nome;
        document.body.appendChild(preview);
        event.dataTransfer.setDragImage(preview, 12, 12);
        setTimeout(() => {
          if (preview.parentNode) preview.parentNode.removeChild(preview);
        }, 0);
      }}
      onDragEnd={() => {
        setDraggingAtribuicaoId(null);
        setDropTargetCategoriaId(null);
      }}
      onClick={() => handleSelectAtribuicao(atrib)}
    >
      <div className="flex-1" onClick={() => handleSelectAtribuicao(atrib)}>
        <div className="text-sm font-medium text-primary">{atrib.nome}</div>
        {atrib.descricao && <p className="text-xs text-muted mt-1">{atrib.descricao}</p>}
        <div className="flex items-center space-x-3 mt-2 text-xs text-muted">
          <span>{atrib.quantidadeCargos} cargos</span>
          <span>{atrib.quantidadePessoasExcecao} excecoes</span>
          <span>{atrib.totalPessoasElegiveis} elegiveis</span>
        </div>
      </div>
      <div className="flex space-x-2 ml-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSelectAtribuicao(atrib);
          }}
          className="text-indigo-600 hover:text-indigo-900"
          aria-label="Ver detalhes"
        >
          <Users className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpenModal(atrib);
          }}
          className="text-indigo-600 hover:text-indigo-900"
          aria-label="Editar atribuicao"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(atrib);
          }}
          className="text-red-600 hover:text-red-900"
          aria-label="Excluir atribuicao"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderCategoriaNode = (node: CategoriaTree, level = 0) => {
    const isExpanded = expandedCategorias.has(node.id);
    const atribs = atribuicoesByCategoria.get(node.id) || [];
    const hasChildren = (node.filhas && node.filhas.length > 0) || atribs.length > 0;
    const shouldShowChildren = hasChildren ? isExpanded : true;
    const isDropTarget = dropTargetCategoriaId === node.id;

    return (
      <div key={node.id}>
        <div
          className={`atribuicao-row flex items-center justify-between py-2 px-4 cursor-pointer ${
            isDropTarget ? 'atribuicao-drop-target' : ''
          }`}
          style={{ paddingLeft: `${level * 24 + 16}px` }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const atribId = event.dataTransfer.getData('text/plain');
            if (atribId) {
              handleDropCategoria(node.id, atribId);
            }
            setDropTargetCategoriaId(null);
          }}
          onDragEnter={() => setDropTargetCategoriaId(node.id)}
          onDragLeave={() => setDropTargetCategoriaId(null)}
          onClick={() => hasChildren ? toggleCategoria(node.id) : null}
        >
          <div className="flex items-center">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategoria(node.id);
                }}
                className="mr-2"
                aria-label="Expandir categoria"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted" />
                )}
              </button>
            ) : (
              <span className="mr-6" />
            )}
            <span className="text-sm font-semibold text-primary">{node.nome}</span>
            <span className="text-xs text-muted ml-2">({node.quantidadeAtribuicoes})</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="text-indigo-600 hover:text-indigo-900 flex items-center space-x-1"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenModal(undefined, node.id);
              }}
              aria-label="Nova atribuicao"
            >
              <Plus className="w-4 h-4" />
              <span className="text-xs font-semibold">Atrib.</span>
            </button>
            <button
              className="text-emerald-600 hover:text-emerald-800 flex items-center space-x-1"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenCategoriaModal(node.id);
              }}
              aria-label="Nova categoria"
            >
              <Plus className="w-4 h-4" />
              <span className="text-xs font-semibold">Categoria</span>
            </button>
          </div>
        </div>

        {shouldShowChildren && (
          <div>
            {node.filhas?.map(child => renderCategoriaNode(child, level + 1))}
            {atribs.map(atrib => renderAtribuicaoRow(atrib, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const semCategoria = atribuicoesByCategoria.get('sem-categoria') || [];

  if (atribuicoesLoading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Atribuicoes
        </h1>
        <div className="flex items-center space-x-3">
          <button
            className="glass-button flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold"
            onClick={() => handleOpenCategoriaModal()}
          >
            <Plus className="w-4 h-4" />
            <span>Categoria</span>
          </button>
          <button
            className="glass-button flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold"
            onClick={() => handleOpenModal()}
          >
            <Plus className="w-4 h-4" />
            <span>Nova Atribuicao</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-6">
        <div className="glass-card overflow-hidden">
          <div className="section-header">
            <h2 className="text-lg font-semibold text-primary">Categorias e Atribuicoes</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {categoriaTree?.filhas?.length ? (
              <div>
                {categoriaTree.filhas.map(node => renderCategoriaNode(node))}
              </div>
            ) : (
              <div className="p-6 text-sm text-muted flex items-center justify-between">
                <span>Nenhuma categoria encontrada.</span>
                <button
                  className="text-indigo-600 hover:text-indigo-900"
                  onClick={() => handleOpenCategoriaModal()}
                  aria-label="Nova categoria"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
            {semCategoria.length > 0 && (
              <div className="border-t border-gray-200">
                <div
                  className={`flex items-center justify-between py-2 px-4 ${
                    dropTargetCategoriaId === 'sem-categoria' ? 'atribuicao-drop-target' : ''
                  }`}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const atribId = event.dataTransfer.getData('text/plain');
                    if (atribId) {
                      handleDropCategoria(null, atribId);
                    }
                    setDropTargetCategoriaId(null);
                  }}
                  onDragEnter={() => setDropTargetCategoriaId('sem-categoria')}
                  onDragLeave={() => setDropTargetCategoriaId(null)}
                >
                  <span className="text-sm font-semibold text-primary">Sem categoria</span>
                  <button
                    className="text-indigo-600 hover:text-indigo-900"
                    onClick={() => handleOpenModal(undefined, '')}
                    aria-label="Nova atribuicao"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {semCategoria.map(atrib => renderAtribuicaoRow(atrib, 1))}
              </div>
            )}
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="section-header">
            <h2 className="text-lg font-semibold text-primary">Detalhes</h2>
          </div>
          {!selectedAtribuicao ? (
            <div className="p-8 text-center text-muted">
              Selecione uma atribuicao para gerenciar pessoas e setores.
            </div>
          ) : (
            <div>
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-primary">{selectedAtribuicao.nome}</h3>
                    {selectedAtribuicao.descricao && (
                      <p className="text-sm text-muted mt-1">{selectedAtribuicao.descricao}</p>
                    )}
                    <div className="text-xs text-muted mt-2">
                      Categoria: {selectedAtribuicao.categoriaNome || 'Sem categoria'}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="text-indigo-600 hover:text-indigo-900"
                      onClick={() => handleOpenModal(selectedAtribuicao)}
                      aria-label="Editar atribuicao"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleDelete(selectedAtribuicao)}
                      aria-label="Excluir atribuicao"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {loadingDetails ? (
                <div className="flex items-center justify-center h-64 text-muted">Carregando...</div>
              ) : (
                <div className="p-6 space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-primary">Pessoas vinculadas</h4>
                      <span className="text-xs text-muted">{atribPessoas.length} pessoas</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                      <select
                        className={`glass-modal-input flex-1 ${actionErrors.pessoa ? 'glass-modal-input-error' : ''}`}
                        value={addPessoaId}
                        onChange={(e) => setAddPessoaId(e.target.value)}
                      >
                        <option value="">Selecione uma pessoa</option>
                        {availablePessoas.map(pessoa => (
                          <option key={pessoa.id} value={pessoa.id}>{pessoa.nomeCompleto}</option>
                        ))}
                      </select>
                      <button
                        className="glass-button flex items-center space-x-2 px-4 py-2 rounded-xl"
                        onClick={handleAddPessoa}
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                    {actionErrors.pessoa && <p className="glass-modal-error">{actionErrors.pessoa}</p>}
                    <div className="space-y-2">
                      {atribPessoas.length === 0 ? (
                        <div className="text-sm text-muted">Nenhuma pessoa adicionada.</div>
                      ) : (
                        atribPessoas.map(pessoa => (
                          <div key={pessoa.id} className="atribuicao-detail-card flex items-center justify-between px-3 py-2 rounded-xl">
                            <div>
                              <div className="text-sm font-medium text-primary">{pessoa.pessoaNome}</div>
                              {pessoa.observacao && <div className="text-xs text-muted">{pessoa.observacao}</div>}
                            </div>
                            <button
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleRemovePessoa(pessoa.id)}
                              aria-label="Remover pessoa"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-primary">Setores e cargos</h4>
                      <span className="text-xs text-muted">{atribCargos.length} cargos</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 mb-3">
                      <select
                        className="glass-modal-input"
                        value={addSetorId}
                        onChange={(e) => {
                          setAddSetorId(e.target.value);
                          setAddCargoId('');
                        }}
                      >
                        <option value="">Todos os setores</option>
                        {setores.map(setor => (
                          <option key={setor.id} value={setor.id}>{setor.nome}</option>
                        ))}
                      </select>
                      <div className="flex items-center space-x-2">
                        <select
                          className={`glass-modal-input flex-1 ${actionErrors.cargo ? 'glass-modal-input-error' : ''}`}
                          value={addCargoId}
                          onChange={(e) => setAddCargoId(e.target.value)}
                        >
                          <option value="">Selecione um cargo</option>
                          {filteredCargos.map(cargo => (
                            <option key={cargo.id} value={cargo.id}>
                              {cargo.nome} ({cargo.setorNome})
                            </option>
                          ))}
                        </select>
                        <button
                          className="glass-button flex items-center space-x-2 px-4 py-2 rounded-xl"
                          onClick={handleAddCargo}
                        >
                          <Briefcase className="w-4 h-4" />
                          <span>Adicionar</span>
                        </button>
                      </div>
                      {actionErrors.cargo && <p className="glass-modal-error">{actionErrors.cargo}</p>}
                    </div>
                    <div className="space-y-2">
                      {atribCargos.length === 0 ? (
                        <div className="text-sm text-muted">Nenhum cargo adicionado.</div>
                      ) : (
                        atribCargos.map(cargo => (
                          <div key={cargo.id} className="atribuicao-detail-card flex items-center justify-between px-3 py-2 rounded-xl">
                            <div>
                              <div className="text-sm font-medium text-primary">{cargo.cargoNome}</div>
                              <div className="text-xs text-muted">{cargo.setorNome}</div>
                            </div>
                            <button
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleRemoveCargo(cargo.id)}
                              aria-label="Remover cargo"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="glass-modal-backdrop" onClick={handleCloseModal}>
          <div className="glass-modal" onClick={e => e.stopPropagation()}>
            <div className="glass-modal-header">
              <h2 className="text-2xl font-bold">
                {editingAtribuicaoId ? 'Editar Atribuicao' : 'Nova Atribuicao'}
              </h2>
              <button className="glass-modal-close" onClick={handleCloseModal} aria-label="Fechar">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="glass-modal-body">
              <div className="space-y-4">
                <div>
                  <label className="glass-modal-label">
                    Nome <span className="glass-modal-required">*</span>
                  </label>
                  <input
                    ref={nomeInputRef}
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    className={`glass-modal-input ${formErrors.nome ? 'glass-modal-input-error' : ''}`}
                    placeholder="Nome da atribuicao"
                  />
                  {formErrors.nome && <p className="glass-modal-error">{formErrors.nome}</p>}
                </div>

                <div>
                  <label className="glass-modal-label">Descricao</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    className="glass-modal-input min-h-[90px]"
                    placeholder="Descreva a atribuicao"
                  />
                </div>

                <div>
                  <label className="glass-modal-label">Categoria</label>
                  <select
                    value={formData.categoriaId}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoriaId: e.target.value }))}
                    className="glass-modal-input"
                  >
                    <option value="">Sem categoria</option>
                    {categoriasOptions.map(option => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formErrors.geral && <p className="glass-modal-error mt-3">{formErrors.geral}</p>}

              <div className="glass-modal-footer">
                <button type="button" onClick={handleCloseModal} className="glass-modal-button-secondary">
                  Cancelar
                </button>
                <button type="submit" className="glass-modal-button-primary">
                  {editingAtribuicaoId ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteOpen && deleteTarget && (
        <div className="glass-modal-backdrop" onClick={handleCloseDelete}>
          <div className="glass-modal glass-modal-confirm" onClick={e => e.stopPropagation()}>
            <div className="glass-modal-header">
              <h2 className="text-xl font-bold">Confirmar exclusao</h2>
              <button className="glass-modal-close" onClick={handleCloseDelete} aria-label="Fechar">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="glass-modal-body">
              <p className="text-sm text-secondary">
                Tem certeza que deseja remover "{deleteTarget.nome}"? Esta acao nao pode ser desfeita.
              </p>
              <div className="glass-modal-footer">
                <button type="button" onClick={handleCloseDelete} className="glass-modal-button-secondary">
                  Cancelar
                </button>
                <button type="button" onClick={handleConfirmDelete} className="glass-modal-button-primary">
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCategoriaModalOpen && (
        <div className="glass-modal-backdrop" onClick={handleCloseCategoriaModal}>
          <div className="glass-modal" onClick={e => e.stopPropagation()}>
            <div className="glass-modal-header">
              <h2 className="text-2xl font-bold">Nova Categoria</h2>
              <button className="glass-modal-close" onClick={handleCloseCategoriaModal} aria-label="Fechar">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCategoria} className="glass-modal-body">
              <div className="space-y-4">
                <div>
                  <label className="glass-modal-label">
                    Nome <span className="glass-modal-required">*</span>
                  </label>
                  <input
                    type="text"
                    value={categoriaForm.nome}
                    onChange={(e) => setCategoriaForm(prev => ({ ...prev, nome: e.target.value }))}
                    className={`glass-modal-input ${categoriaErrors.nome ? 'glass-modal-input-error' : ''}`}
                    placeholder="Nome da categoria"
                  />
                  {categoriaErrors.nome && <p className="glass-modal-error">{categoriaErrors.nome}</p>}
                </div>

                <div>
                  <label className="glass-modal-label">Categoria Pai</label>
                  <select
                    value={categoriaForm.categoriaPaiId}
                    onChange={(e) => setCategoriaForm(prev => ({ ...prev, categoriaPaiId: e.target.value }))}
                    className="glass-modal-input"
                  >
                    <option value="">Sem pai</option>
                    {categoriasOptions.map(option => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {categoriaErrors.geral && <p className="glass-modal-error mt-3">{categoriaErrors.geral}</p>}

              <div className="glass-modal-footer">
                <button type="button" onClick={handleCloseCategoriaModal} className="glass-modal-button-secondary">
                  Cancelar
                </button>
                <button type="submit" className="glass-modal-button-primary">
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

