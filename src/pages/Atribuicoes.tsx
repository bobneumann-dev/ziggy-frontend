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
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import LoadingState from '../components/LoadingState';
import SearchSelect, { type SearchSelectOption } from '../components/SearchSelect';
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
  const { t } = useTranslation();
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
  const [draggingCategoriaId, setDraggingCategoriaId] = useState<string | null>(null);
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
  const [editingCategoriaId, setEditingCategoriaId] = useState<string | null>(null);
  const [categoriaForm, setCategoriaForm] = useState({ nome: '', categoriaPaiId: '' });
  const [categoriaErrors, setCategoriaErrors] = useState<Record<string, string>>({});

  const [addPessoaId, setAddPessoaId] = useState('');
  const [addSetorId, setAddSetorId] = useState('');
  const [addCargoId, setAddCargoId] = useState('');
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});

  const fetchAtribuicoes = async () => {
    setAtribuicoesLoading(true);
    try {
      const response = await api.get<Atribuicao[]>('/api/atribuicoes');
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
        api.get<Categoria[]>('/api/categorias'),
        api.get<CategoriaTree>('/api/categorias/tree')
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
        api.get<Pessoa[]>('/api/pessoas'),
        api.get<Setor[]>('/api/setores'),
        api.get<Cargo[]>('/api/cargos'),
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
        api.get<AtribuicaoPessoa[]>(`/api/atribuicoes/${atribId}/pessoas`),
        api.get<AtribuicaoCargo[]>(`/api/atribuicoes/${atribId}/cargos`)
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
    setEditingCategoriaId(null);
    setCategoriaForm({ nome: '', categoriaPaiId: parentId || '' });
    setCategoriaErrors({});
    setIsCategoriaModalOpen(true);
  };

  const handleOpenCategoriaEdit = (categoria: CategoriaTree) => {
    setEditingCategoriaId(categoria.id);
    setCategoriaForm({
      nome: categoria.nome || '',
      categoriaPaiId: categoria.categoriaPaiId || ''
    });
    setCategoriaErrors({});
    setIsCategoriaModalOpen(true);
  };

  const handleCloseCategoriaModal = () => {
    setIsCategoriaModalOpen(false);
    setEditingCategoriaId(null);
    setCategoriaForm({ nome: '', categoriaPaiId: '' });
    setCategoriaErrors({});
  };

  const findCategoriaNode = useCallback((node: CategoriaTree | null, id: string): CategoriaTree | null => {
    if (!node) return null;
    if (node.id === id) return node;
    for (const child of node.filhas || []) {
      const found = findCategoriaNode(child, id);
      if (found) return found;
    }
    return null;
  }, []);

  const isCategoriaDescendant = useCallback((rootId: string, possibleChildId: string) => {
    const root = findCategoriaNode(categoriaTree, rootId);
    if (!root) return false;
    const stack = [...(root.filhas || [])];
    while (stack.length) {
      const current = stack.pop();
      if (!current) continue;
      if (current.id === possibleChildId) return true;
      if (current.filhas?.length) {
        stack.push(...current.filhas);
      }
    }
    return false;
  }, [categoriaTree, findCategoriaNode]);

  const handleSubmitCategoria = async (e: FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!categoriaForm.nome.trim()) errors.nome = t('attributions.validation.requiredCategoryName');
    if (editingCategoriaId && categoriaForm.categoriaPaiId) {
      if (categoriaForm.categoriaPaiId === editingCategoriaId) {
        errors.categoriaPaiId = t('attributions.validation.parentCategorySelf');
      } else if (isCategoriaDescendant(editingCategoriaId, categoriaForm.categoriaPaiId)) {
        errors.categoriaPaiId = t('attributions.validation.parentCategoryChild');
      }
    }
    if (Object.keys(errors).length) {
      setCategoriaErrors(errors);
      return;
    }

    try {
      setAtribuicoesLoading(true);
      const payload = {
        nome: categoriaForm.nome,
        categoriaPaiId: categoriaForm.categoriaPaiId || null
      };
      if (editingCategoriaId) {
        await api.put(`/api/categorias/${editingCategoriaId}`, payload);
      } else {
        await api.post('/api/categorias', payload);
      }
      await fetchCategorias();
      handleCloseCategoriaModal();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      setCategoriaErrors(prev => ({
        ...prev,
        geral: t('attributions.validation.categorySaveFailed')
      }));
    } finally {
      setAtribuicoesLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.nome.trim()) errors.nome = t('attributions.validation.requiredName');
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
        await api.put(`/api/atribuicoes/${editingAtribuicaoId}`, payload);
      } else {
        await api.post('/api/atribuicoes', payload);
      }

      await Promise.all([fetchAtribuicoes(), fetchCategorias()]);
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar atribuicao:', error);
      setFormErrors(prev => ({
        ...prev,
        geral: t('attributions.validation.saveFailed')
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
      await api.delete(`/api/atribuicoes/${deleteTarget.id}`);
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
      setActionErrors(prev => ({ ...prev, pessoa: t('attributions.validation.selectPerson') }));
      return;
    }

    try {
      setLoadingDetails(true);
      await api.post('/api/atribuicoes/pessoa', {
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
      await api.delete(`/api/atribuicoes/pessoa/${id}`);
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
    if (!addCargoId) errors.cargo = t('attributions.validation.selectPosition');
    if (Object.keys(errors).length) {
      setActionErrors(prev => ({ ...prev, ...errors }));
      return;
    }

    try {
      setLoadingDetails(true);
      await api.post('/api/atribuicoes/cargo', {
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
      await api.delete(`/api/atribuicoes/cargo/${id}`);
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
      await api.put(`/api/atribuicoes/${atribId}`, { categoriaId });
      await Promise.all([fetchAtribuicoes(), fetchCategorias()]);
    } catch (error) {
      console.error('Erro ao mover atribuicao:', error);
    } finally {
      setAtribuicoesLoading(false);
    }
  };

  const handleMoveCategoria = async (categoriaId: string, categoriaPaiId: string) => {
    if (categoriaId === categoriaPaiId) return;
    if (isCategoriaDescendant(categoriaId, categoriaPaiId)) return;

    try {
      setAtribuicoesLoading(true);
      await api.put(`/api/categorias/${categoriaId}`, { categoriaPaiId });
      await fetchCategorias();
    } catch (error) {
      console.error('Erro ao mover categoria:', error);
    } finally {
      setAtribuicoesLoading(false);
    }
  };

  const handleDragLeaveRow = (event: React.DragEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setDropTargetCategoriaId(null);
  };

  const handleDragOverRow = (id: string) => (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    if (dropTargetCategoriaId !== id) {
      setDropTargetCategoriaId(id);
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

  const categoriaSelectOptions = useMemo<SearchSelectOption[]>(
    () => categoriasOptions.map(option => ({ value: option.id, label: option.label })),
    [categoriasOptions]
  );

  const pessoaOptions = useMemo<SearchSelectOption[]>(
    () => availablePessoas.map(pessoa => ({ value: pessoa.id, label: pessoa.nomeCompleto })),
    [availablePessoas]
  );

  const setorOptions = useMemo<SearchSelectOption[]>(
    () => setores.map(setor => ({ value: setor.id, label: setor.nome })),
    [setores]
  );

  const cargoOptions = useMemo<SearchSelectOption[]>(
    () => filteredCargos.map(cargo => ({ value: cargo.id, label: `${cargo.nome} (${cargo.setorNome})` })),
    [filteredCargos]
  );

  const renderAtribuicaoRow = (atrib: Atribuicao, level: number) => (
    <div
      key={atrib.id}
      className={`atribuicao-row flex items-start justify-between py-2 px-4 cursor-pointer transition-colors ${selectedAtribuicaoId === atrib.id ? 'atribuicao-row-selected' : ''
        } ${draggingAtribuicaoId === atrib.id ? 'atribuicao-dragging' : ''}`}
      style={{ paddingLeft: `${level * 24 + 16}px` }}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('application/x-ziggy-atribuicao', atrib.id);
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
          <span>{t('attributions.countPositions', { count: atrib.quantidadeCargos })}</span>
          <span>{t('attributions.countExceptions', { count: atrib.quantidadePessoasExcecao })}</span>
          <span>{t('attributions.countEligible', { count: atrib.totalPessoasElegiveis })}</span>
        </div>
      </div>
      <div className="action-button-group ml-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSelectAtribuicao(atrib);
          }}
          className="action-button"
          aria-label={t('attributions.viewDetails')}
        >
          <Users className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpenModal(atrib);
          }}
          className="action-button"
          aria-label={t('common.edit')}
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(atrib);
          }}
          className="action-button"
          aria-label={t('common.delete')}
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
          className={`atribuicao-row flex items-center justify-between py-2 px-4 cursor-pointer ${isDropTarget ? 'atribuicao-drop-target' : ''
            } ${draggingCategoriaId === node.id ? 'opacity-50' : ''}`}
          style={{ paddingLeft: `${level * 24 + 16}px` }}
          draggable
          onDragOver={handleDragOverRow(node.id)}
          onDrop={(event) => {
            event.preventDefault();
            const categoriaId = event.dataTransfer.getData('application/x-ziggy-categoria');
            const atribId =
              event.dataTransfer.getData('application/x-ziggy-atribuicao') ||
              event.dataTransfer.getData('text/plain');
            if (categoriaId) {
              handleMoveCategoria(categoriaId, node.id);
            }
            if (atribId) {
              handleDropCategoria(node.id, atribId);
            }
            setDropTargetCategoriaId(null);
          }}
          onDragEnter={handleDragOverRow(node.id)}
          onDragLeave={handleDragLeaveRow}
          onClick={() => hasChildren ? toggleCategoria(node.id) : null}
          onDragStart={(event) => {
            event.dataTransfer.setData('application/x-ziggy-categoria', node.id);
            event.dataTransfer.effectAllowed = 'move';
            setDraggingCategoriaId(node.id);
            const preview = document.createElement('div');
            preview.className = 'atribuicao-drag-preview';
            preview.textContent = node.nome;
            document.body.appendChild(preview);
            event.dataTransfer.setDragImage(preview, 12, 12);
            setTimeout(() => {
              if (preview.parentNode) preview.parentNode.removeChild(preview);
            }, 0);
          }}
          onDragEnd={() => {
            setDraggingCategoriaId(null);
            setDropTargetCategoriaId(null);
          }}
        >
          <div className="flex items-center">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategoria(node.id);
                }}
                className="mr-2"
                aria-label={t('attributions.expandCategory')}
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
          <div className="action-button-group">
            <button
              className="action-button flex items-center space-x-1"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenModal(undefined, node.id);
              }}
              aria-label={t('attributions.newAttribution')}
            >
              <Plus className="w-4 h-4" />
              <span className="text-xs font-semibold">{t('attributions.shortAttribution')}</span>
            </button>
            <button
              className="action-button flex items-center space-x-1"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenCategoriaEdit(node);
              }}
              aria-label={t('attributions.editCategory')}
            >
              <Edit className="w-4 h-4" />
              <span className="text-xs font-semibold">{t('common.edit')}</span>
            </button>
            <button
              className="action-button flex items-center space-x-1"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenCategoriaModal(node.id);
              }}
              aria-label={t('attributions.newCategory')}
            >
              <Plus className="w-4 h-4" />
              <span className="text-xs font-semibold">{t('attributions.category')}</span>
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
    return <LoadingState />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">{t('attributions.title')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {t('attributions.pageDescription')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            className="glass-button flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold"
            onClick={() => handleOpenCategoriaModal()}
          >
            <Plus className="w-4 h-4" />
            <span>{t('attributions.newCategory')}</span>
          </button>
          <button
            className="glass-button flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold"
            onClick={() => handleOpenModal()}
          >
            <Plus className="w-4 h-4" />
            <span>{t('attributions.newAttribution')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-6">
        <div className="glass-card overflow-hidden">
          <div className="section-header">
            <h2 className="text-lg font-semibold text-primary">{t('attributions.categoriesAndAttributions')}</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {categoriaTree?.filhas?.length ? (
              <div>
                {categoriaTree.filhas.map(node => renderCategoriaNode(node))}
              </div>
            ) : (
              <div className="p-6 text-sm text-muted flex items-center justify-between">
                <span>{t('attributions.noCategories')}</span>
                <button
                  className="glass-button"
                  onClick={() => handleOpenCategoriaModal()}
                  aria-label={t('attributions.newCategory')}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
            {semCategoria.length > 0 && (
              <div className="border-t border-gray-200">
                <div
                  className={`flex items-center justify-between py-2 px-4 ${dropTargetCategoriaId === 'sem-categoria' ? 'atribuicao-drop-target' : ''
                    }`}
                  onDragOver={handleDragOverRow('sem-categoria')}
                  onDrop={(event) => {
                    event.preventDefault();
                    const atribId = event.dataTransfer.getData('text/plain');
                    if (atribId) {
                      handleDropCategoria(null, atribId);
                    }
                    setDropTargetCategoriaId(null);
                  }}
                  onDragEnter={handleDragOverRow('sem-categoria')}
                  onDragLeave={handleDragLeaveRow}
                >
                  <span className="text-sm font-semibold text-primary">{t('attributions.noCategory')}</span>
                  <button
                    className="glass-button"
                    onClick={() => handleOpenModal(undefined, '')}
                    aria-label={t('attributions.newAttribution')}
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
            <h2 className="text-lg font-semibold text-primary">{t('attributions.details')}</h2>
          </div>
          {!selectedAtribuicao ? (
            <div className="p-8 text-center text-muted">
              {t('attributions.selectAttributionPrompt')}
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
                      {t('attributions.categoryLabel', {
                        name: selectedAtribuicao.categoriaNome || t('attributions.noCategory')
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="action-button-group inline-flex">
                      <button
                        className="action-button"
                        onClick={() => handleOpenModal(selectedAtribuicao)}
                        aria-label={t('common.edit')}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="action-button"
                        onClick={() => handleDelete(selectedAtribuicao)}
                        aria-label={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {loadingDetails ? (
                <LoadingState />
              ) : (
                <div className="p-6 space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-primary">{t('attributions.linkedPeople')}</h4>
                      <span className="text-xs text-muted">
                        {t('attributions.countPeople', { count: atribPessoas.length })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                      <SearchSelect
                        options={pessoaOptions}
                        value={pessoaOptions.find(option => option.value === addPessoaId) ?? null}
                        onChange={(option) => setAddPessoaId(option ? String(option.value) : '')}
                        placeholder={t('attributions.selectPerson')}
                        hasError={Boolean(actionErrors.pessoa)}
                      />
                      <button
                        className="glass-button flex items-center space-x-2 px-4 py-2 rounded-xl"
                        onClick={handleAddPessoa}
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>{t('common.add')}</span>
                      </button>
                    </div>
                    {actionErrors.pessoa && <p className="glass-modal-error">{actionErrors.pessoa}</p>}
                    <div className="space-y-2">
                      {atribPessoas.length === 0 ? (
                        <div className="text-sm text-muted">{t('attributions.noPeopleAdded')}</div>
                      ) : (
                        atribPessoas.map(pessoa => (
                          <div key={pessoa.id} className="atribuicao-detail-card flex items-center justify-between px-3 py-2 rounded-xl">
                            <div>
                              <div className="text-sm font-medium text-primary">{pessoa.pessoaNome}</div>
                              {pessoa.observacao && <div className="text-xs text-muted">{pessoa.observacao}</div>}
                            </div>
                            <button
                              className="glass-button"
                              onClick={() => handleRemovePessoa(pessoa.id)}
                              aria-label={t('attributions.removePerson')}
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
                      <h4 className="text-sm font-semibold text-primary">{t('attributions.sectorsAndPositions')}</h4>
                      <span className="text-xs text-muted">
                        {t('attributions.countPositions', { count: atribCargos.length })}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 mb-3">
                      <SearchSelect
                        options={setorOptions}
                        value={setorOptions.find(option => option.value === addSetorId) ?? null}
                        onChange={(option) => {
                          setAddSetorId(option ? String(option.value) : '');
                          setAddCargoId('');
                        }}
                        placeholder={t('attributions.allSectors')}
                      />
                      <div className="flex items-center space-x-2">
                        <SearchSelect
                          options={cargoOptions}
                          value={cargoOptions.find(option => option.value === addCargoId) ?? null}
                          onChange={(option) => setAddCargoId(option ? String(option.value) : '')}
                          placeholder={t('attributions.selectPosition')}
                          hasError={Boolean(actionErrors.cargo)}
                        />
                        <button
                          className="glass-button flex items-center space-x-2 px-4 py-2 rounded-xl"
                          onClick={handleAddCargo}
                        >
                          <Briefcase className="w-4 h-4" />
                          <span>{t('common.add')}</span>
                        </button>
                      </div>
                      {actionErrors.cargo && <p className="glass-modal-error">{actionErrors.cargo}</p>}
                    </div>
                    <div className="space-y-2">
                      {atribCargos.length === 0 ? (
                        <div className="text-sm text-muted">{t('attributions.noPositionsAdded')}</div>
                      ) : (
                        atribCargos.map(cargo => (
                          <div key={cargo.id} className="atribuicao-detail-card flex items-center justify-between px-3 py-2 rounded-xl">
                            <div>
                              <div className="text-sm font-medium text-primary">{cargo.cargoNome}</div>
                              <div className="text-xs text-muted">{cargo.setorNome}</div>
                            </div>
                            <button
                              className="glass-button"
                              onClick={() => handleRemoveCargo(cargo.id)}
                              aria-label={t('attributions.removePosition')}
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
                {editingAtribuicaoId ? t('attributions.editAttribution') : t('attributions.newAttribution')}
              </h2>
              <button className="glass-modal-close" onClick={handleCloseModal} aria-label={t('common.close')}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="glass-modal-body">
              <div className="space-y-4">
                <div>
                  <label className="glass-modal-label">
                    {t('attributions.name')} <span className="glass-modal-required">*</span>
                  </label>
                  <input
                    ref={nomeInputRef}
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    className={`glass-modal-input ${formErrors.nome ? 'glass-modal-input-error' : ''}`}
                    placeholder={t('attributions.placeholders.name')}
                  />
                  {formErrors.nome && <p className="glass-modal-error">{formErrors.nome}</p>}
                </div>

                <div>
                  <label className="glass-modal-label">{t('attributions.descriptionLabel')}</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    className="glass-modal-input min-h-[90px]"
                    placeholder={t('attributions.placeholders.description')}
                  />
                </div>

                <div>
                  <label className="glass-modal-label">{t('attributions.category')}</label>
                  <SearchSelect
                    options={categoriaSelectOptions}
                    value={categoriaSelectOptions.find(option => option.value === formData.categoriaId) ?? null}
                    onChange={(option) => setFormData(prev => ({ ...prev, categoriaId: option ? String(option.value) : '' }))}
                    placeholder={t('attributions.noCategory')}
                  />
                </div>
              </div>

              {formErrors.geral && <p className="glass-modal-error mt-3">{formErrors.geral}</p>}

              <div className="glass-modal-footer">
                <button type="button" onClick={handleCloseModal} className="glass-modal-button-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="glass-modal-button-primary">
                  {editingAtribuicaoId ? t('common.save') : t('common.create')}
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
              <h2 className="text-xl font-bold">{t('common.confirmDelete')}</h2>
              <button className="glass-modal-close" onClick={handleCloseDelete} aria-label={t('common.close')}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="glass-modal-body">
              <p className="text-sm text-secondary">
                {t('attributions.deleteConfirm', { name: deleteTarget.nome })}
              </p>
              <div className="glass-modal-footer">
                <button type="button" onClick={handleCloseDelete} className="glass-modal-button-secondary">
                  {t('common.cancel')}
                </button>
                <button type="button" onClick={handleConfirmDelete} className="glass-modal-button-primary">
                  {t('common.delete')}
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
              <h2 className="text-2xl font-bold">
                {editingCategoriaId ? t('attributions.editCategory') : t('attributions.newCategory')}
              </h2>
              <button className="glass-modal-close" onClick={handleCloseCategoriaModal} aria-label={t('common.close')}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCategoria} className="glass-modal-body">
              <div className="space-y-4">
                <div>
                  <label className="glass-modal-label">
                    {t('attributions.categoryName')} <span className="glass-modal-required">*</span>
                  </label>
                  <input
                    type="text"
                    value={categoriaForm.nome}
                    onChange={(e) => setCategoriaForm(prev => ({ ...prev, nome: e.target.value }))}
                    className={`glass-modal-input ${categoriaErrors.nome ? 'glass-modal-input-error' : ''}`}
                    placeholder={t('attributions.placeholders.categoryName')}
                  />
                  {categoriaErrors.nome && <p className="glass-modal-error">{categoriaErrors.nome}</p>}
                </div>

                <div>
                  <label className="glass-modal-label">{t('attributions.parentCategory')}</label>
                  <SearchSelect
                    options={categoriaSelectOptions}
                    value={categoriaSelectOptions.find(option => option.value === categoriaForm.categoriaPaiId) ?? null}
                    onChange={(option) => setCategoriaForm(prev => ({ ...prev, categoriaPaiId: option ? String(option.value) : '' }))}
                    placeholder={t('attributions.noParentCategory')}
                  />
                  {categoriaErrors.categoriaPaiId && <p className="glass-modal-error">{categoriaErrors.categoriaPaiId}</p>}
                </div>
              </div>

              {categoriaErrors.geral && <p className="glass-modal-error mt-3">{categoriaErrors.geral}</p>}

              <div className="glass-modal-footer">
                <button type="button" onClick={handleCloseCategoriaModal} className="glass-modal-button-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="glass-modal-button-primary">
                  {editingCategoriaId ? t('common.save') : t('common.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
