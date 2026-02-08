import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit, X } from 'lucide-react';
import api from '../lib/api';
import { type Proposta, type ItemCatalogo, StatusProposta, TipoCobranca } from '../types';
import { DataTable } from '../components/DataTable';
import SearchSelect from '../components/SearchSelect';
import type { SearchSelectOption } from '../components/SearchSelect';
import type { ColumnDef } from '@tanstack/react-table';
import LoadingState from '../components/LoadingState';

interface ItemForm {
  key: string;
  itemCatalogoId: string;
  itemNome: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  desconto: number;
  descontoPercentual: boolean;
  aliquotaImposto: number;
  tipoCobranca: number;
  numeroParcelas: number;
  ordem: number;
}

function calcItemTotal(item: ItemForm) {
  const base = item.quantidade * item.valorUnitario;
  const desc = item.descontoPercentual ? base * (item.desconto / 100) : item.desconto;
  const baseAposDesc = base - desc;
  const imposto = baseAposDesc * (item.aliquotaImposto / 100);
  return { baseAposDesc, imposto, total: baseAposDesc + imposto };
}

function fmtMoney(v: number) { return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`; }

function tipoCobrancaLabel(t: number) {
  switch (t) {
    case TipoCobranca.Fixo: return 'Fixo';
    case TipoCobranca.Parcelado: return 'Parcelado';
    case TipoCobranca.Recorrente: return 'Recorrente';
    default: return '';
  }
}

function statusLabel(s: number) {
  switch (s) {
    case StatusProposta.Rascunho: return 'Rascunho';
    case StatusProposta.Enviada: return 'Enviada';
    case StatusProposta.Aprovada: return 'Aprovada';
    case StatusProposta.Rejeitada: return 'Rejeitada';
    default: return '';
  }
}

function statusBadge(s: number) {
  switch (s) {
    case StatusProposta.Aprovada: return 'success';
    case StatusProposta.Rejeitada: return 'danger';
    case StatusProposta.Enviada: return 'info';
    default: return 'warning';
  }
}

export default function Propostas() {
  const { t } = useTranslation();

  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItemKey, setEditingItemKey] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form state
  const [clienteId, setClienteId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [validaAte, setValidaAte] = useState('');
  const [descontoGlobal, setDescontoGlobal] = useState(0);
  const [descontoGlobalPercentual, setDescontoGlobalPercentual] = useState(false);
  const [itens, setItens] = useState<ItemForm[]>([]);

  // Lookups
  const [clientes, setClientes] = useState<SearchSelectOption[]>([]);
  const [catalogoOptions, setCatalogoOptions] = useState<SearchSelectOption[]>([]);
  const [catalogoMap, setCatalogoMap] = useState<Record<string, ItemCatalogo>>({});

  const fetchPropostas = useCallback(async () => {
    try {
      const res = await api.get('/api/propostas');
      setPropostas(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  const fetchClientes = useCallback(async () => {
    try {
      const res = await api.get('/api/clientes-fornecedores?isCliente=true');
      setClientes(res.data.map((c: { id: string; nomeRazaoSocial: string }) => ({ label: c.nomeRazaoSocial, value: c.id })));
    } catch (err) { console.error(err); }
  }, []);

  const fetchCatalogo = useCallback(async () => {
    try {
      const res = await api.get('/api/catalogo/itens');
      const items: ItemCatalogo[] = res.data;
      setCatalogoOptions(items.filter(i => i.vendavel).map(i => ({ label: `${i.codigo} - ${i.nome}`, value: i.id })));
      const map: Record<string, ItemCatalogo> = {};
      items.forEach(i => { map[i.id] = i; });
      setCatalogoMap(map);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchPropostas();
      await fetchClientes();
      await fetchCatalogo();
    };
    load();
  }, [fetchPropostas, fetchClientes, fetchCatalogo]);

  // ── Modal helpers ──
  const resetForm = () => {
    setClienteId('');
    setTitulo('');
    setObservacoes('');
    setValidaAte('');
    setDescontoGlobal(0);
    setDescontoGlobalPercentual(false);
    setItens([]);
    setFormErrors({});
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = async (p: Proposta) => {
    setEditingId(p.id);
    setClienteId(p.clienteId);
    setTitulo(p.titulo || '');
    setObservacoes(p.observacoes || '');
    setValidaAte(p.validaAte ? p.validaAte.substring(0, 10) : '');
    setDescontoGlobal(p.descontoGlobal);
    setDescontoGlobalPercentual(p.descontoGlobalPercentual);
    setItens(p.itens.map(i => ({
      key: i.id,
      itemCatalogoId: i.itemCatalogoId,
      itemNome: i.itemNomeSnapshot,
      unidade: i.unidadeSnapshot,
      quantidade: i.quantidade,
      valorUnitario: i.valorUnitario,
      desconto: i.desconto,
      descontoPercentual: i.descontoPercentual,
      aliquotaImposto: i.aliquotaImposto,
      tipoCobranca: i.tipoCobranca ?? TipoCobranca.Fixo,
      numeroParcelas: i.numeroParcelas ?? 1,
      ordem: i.ordem,
    })));
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  // ── Item CRUD ──
  const removeItem = (key: string) => setItens(prev => prev.filter(i => i.key !== key));

  const updateItem = (key: string, field: keyof ItemForm, value: string | number | boolean) => {
    setItens(prev => prev.map(i => {
      if (i.key !== key) return i;
      const updated = { ...i, [field]: value };
      if (field === 'itemCatalogoId' && typeof value === 'string') {
        const cat = catalogoMap[value];
        if (cat) {
          updated.itemNome = cat.nome;
          updated.unidade = cat.unidade || 'UN';
          updated.valorUnitario = cat.precoBase ?? 0;
        }
      }
      if (field === 'tipoCobranca' && Number(value) !== TipoCobranca.Parcelado) {
        updated.numeroParcelas = 1;
      }
      return updated;
    }));
  };

  const handleEditItem = (key: string) => {
    setEditingItemKey(key);
    setShowItemModal(true);
  };

  // ── Calculations ──
  const totais = useMemo(() => {
    const subtotal = itens.reduce((acc, i) => acc + i.quantidade * i.valorUnitario, 0);
    const descontoItens = itens.reduce((acc, i) => {
      const b = i.quantidade * i.valorUnitario;
      return acc + (i.descontoPercentual ? b * (i.desconto / 100) : i.desconto);
    }, 0);
    const subPosDesc = subtotal - descontoItens;
    const descGlobal = descontoGlobalPercentual ? subPosDesc * (descontoGlobal / 100) : descontoGlobal;
    const impostos = itens.reduce((acc, i) => acc + calcItemTotal(i).imposto, 0);
    return { subtotal, descontoItens, descGlobal, impostos, total: subPosDesc - descGlobal + impostos };
  }, [itens, descontoGlobal, descontoGlobalPercentual]);

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    if (!clienteId) {
      setFormErrors({ clienteId: 'Selecione um cliente' });
      return;
    }
    if (itens.length === 0) {
      setFormErrors({ itens: 'Adicione pelo menos um item' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        clienteId,
        titulo: titulo || null,
        observacoes: observacoes || null,
        validaAte: validaAte || undefined,
        descontoGlobal,
        descontoGlobalPercentual,
        itens: itens.map(i => ({
          itemCatalogoId: i.itemCatalogoId,
          quantidade: i.quantidade,
          valorUnitario: i.valorUnitario,
          desconto: i.desconto,
          descontoPercentual: i.descontoPercentual,
          aliquotaImposto: i.aliquotaImposto,
          tipoCobranca: i.tipoCobranca,
          numeroParcelas: i.tipoCobranca === TipoCobranca.Parcelado ? i.numeroParcelas : null,
          ordem: i.ordem,
        })),
      };

      if (editingId) {
        await api.put(`/api/propostas/${editingId}`, payload);
      } else {
        await api.post('/api/propostas', payload);
      }

      fetchPropostas();
      handleCloseModal();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao salvar';
      setFormErrors({ _global: msg });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta proposta?')) return;
    try {
      await api.delete(`/api/propostas/${id}`);
      fetchPropostas();
    } catch (err) { console.error(err); }
  };

  // ── Table columns ──
  const columns: ColumnDef<Proposta>[] = useMemo(() => [
    { header: 'Cliente', accessorKey: 'clienteNome' },
    { header: 'Título', accessorKey: 'titulo', cell: ({ row }) => row.original.titulo || '—' },
    {
      header: 'Status', accessorKey: 'status',
      cell: ({ row }) => (
        <span className={`badge badge-${statusBadge(row.original.status)}`}>
          {statusLabel(row.original.status)}
        </span>
      ),
    },
    {
      header: 'Total', accessorKey: 'total',
      cell: ({ row }) => fmtMoney(row.original.total),
    },
    {
      header: 'Itens', id: 'itensCount',
      cell: ({ row }) => `${row.original.itens.length} itens`,
    },
    {
      header: 'Criado em', accessorKey: 'createdAt',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('pt-BR'),
    },
    {
      header: t('common.actions'), id: 'actions',
      cell: ({ row }) => (
        <div className="action-button-group">
          <button className="action-button" onClick={() => handleOpenEdit(row.original)} title={t('common.edit')}>
            <Edit size={16} />
          </button>
          <button className="action-button" onClick={() => handleDelete(row.original.id)} title={t('common.delete')}>
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, fetchPropostas]);

  if (loading) return <LoadingState />;

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Propostas / Orçamentos</h1>
        <p className="text-secondary">Gerencie propostas comerciais com itens, valores e tipos de cobrança.</p>
        <button onClick={handleOpenCreate} className="glass-button flex items-center gap-2 px-4 py-2.5" style={{ marginTop: '1rem' }}>
          <Plus className="w-4 h-4" />
          <span>Nova Proposta</span>
        </button>
      </div>

      <DataTable columns={columns} data={propostas} />

      {/* ══════════ CREATE / EDIT MODAL ══════════ */}
      {showModal && (
        <div className="glass-modal-backdrop" onClick={handleCloseModal}>
          <div className="glass-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 960, width: '95vw' }}>
            <div className="glass-modal-header">
              <h2>{editingId ? 'Editar Proposta' : 'Nova Proposta'}</h2>
              <button onClick={handleCloseModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="glass-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {formErrors._global && <div className="glass-modal-error">{formErrors._global}</div>}

                {/* ── Header Fields ── */}
                <div style={{ marginBottom: '1rem' }}>
                  <label className="glass-modal-label">Título</label>
                  <input type="text" className="glass-modal-input" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Proposta Instalação CFTV" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="glass-modal-label">Cliente <span className="glass-modal-required">*</span></label>
                    <SearchSelect
                      options={clientes}
                      value={clientes.find(c => c.value === clienteId) || null}
                      onChange={(opt) => setClienteId((opt?.value as string) || '')}
                      placeholder="Selecione o cliente..."
                    />
                    {formErrors.clienteId && <div className="glass-modal-error">{formErrors.clienteId}</div>}
                  </div>
                  <div>
                    <label className="glass-modal-label">Validade</label>
                    <input type="date" className="glass-modal-input" value={validaAte} onChange={e => setValidaAte(e.target.value)} />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="glass-modal-label">Observações</label>
                  <textarea className="glass-modal-input" value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Notas internas..." rows={3} style={{ resize: 'vertical' }} />
                </div>

                {/* ── Items ── */}
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Itens / Serviços</h3>
                    <button type="button" className="glass-button" onClick={() => setShowItemModal(true)} style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
                      <Plus size={14} /> Adicionar
                    </button>
                  </div>
                  {formErrors.itens && <div className="glass-modal-error" style={{ marginBottom: '0.5rem' }}>{formErrors.itens}</div>}

                  {/* Items List */}
                  {itens.length > 0 ? (
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem' }}>
                      {itens.map((item, idx) => {
                        const { total } = calcItemTotal(item);
                        return (
                          <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderRadius: '0.375rem', borderBottom: idx < itens.length - 1 ? '1px solid var(--border-light)' : 'none', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => handleEditItem(item.key)}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{idx + 1}. {item.itemNome || 'Item sem nome'}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {item.quantidade} {item.unidade} × {fmtMoney(item.valorUnitario)} {item.tipoCobranca !== TipoCobranca.Fixo && `(${tipoCobrancaLabel(item.tipoCobranca)})`}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{fmtMoney(total)}</div>
                              <button type="button" className="action-button" onClick={(e) => { e.stopPropagation(); removeItem(item.key); }}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                      Nenhum item adicionado. Clique em "Adicionar" para começar.
                    </div>
                  )}

                  {/* Desconto Global */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="glass-modal-label">Desconto Global</label>
                    <div style={{ display: 'flex', gap: '6px', maxWidth: '300px' }}>
                      <input type="number" step="0.01" className="glass-modal-input" value={descontoGlobal} onChange={e => setDescontoGlobal(Number(e.target.value))} style={{ flex: 1 }} />
                      <select className="glass-modal-input" value={descontoGlobalPercentual ? '%' : 'V'} onChange={e => setDescontoGlobalPercentual(e.target.value === '%')} style={{ width: 65 }}>
                        <option value="V">R$</option>
                        <option value="%">%</option>
                      </select>
                    </div>
                  </div>

                  {/* Totals */}
                  {itens.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ minWidth: 260, background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '0.9rem' }}>
                          <span className="text-secondary">Subtotal:</span>
                          <span>{fmtMoney(totais.subtotal)}</span>
                        </div>
                        {totais.descontoItens > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '0.9rem', color: 'var(--accent-danger)' }}>
                            <span>Desc. Itens:</span>
                            <span>- {fmtMoney(totais.descontoItens)}</span>
                          </div>
                        )}
                        {totais.descGlobal > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '0.9rem', color: 'var(--accent-danger)' }}>
                            <span>Desc. Global:</span>
                            <span>- {fmtMoney(totais.descGlobal)}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '2px solid var(--border-light)', fontWeight: 700, fontSize: '1.05rem', marginTop: '4px' }}>
                          <span>Total:</span>
                          <span>{fmtMoney(totais.total)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-modal-footer">
                <button type="button" className="glass-modal-button-secondary" onClick={handleCloseModal}>{t('common.cancel')}</button>
                <button type="submit" className="glass-modal-button-primary" disabled={saving}>
                  {saving ? 'Salvando...' : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ NESTED ITEM MODAL ══════════ */}
      {showItemModal && (() => {
        const editingItem = editingItemKey ? itens.find(i => i.key === editingItemKey) : null;
        return (
          <div className="glass-modal-backdrop" onClick={() => { setShowItemModal(false); setEditingItemKey(null); }} style={{ zIndex: 1001 }}>
            <div className="glass-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, width: '90vw' }}>
              <div className="glass-modal-header">
                <h2>{editingItem ? 'Editar Item / Serviço' : 'Adicionar Item / Serviço'}</h2>
                <button onClick={() => { setShowItemModal(false); setEditingItemKey(null); }}><X size={20} /></button>
              </div>
              <div className="glass-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {editingItem ? (
                  // Edit mode
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                      <label className="glass-modal-label">Item / Serviço <span className="glass-modal-required">*</span></label>
                      <SearchSelect
                        options={catalogoOptions}
                        value={catalogoOptions.find(o => o.value === editingItem.itemCatalogoId) || null}
                        onChange={(opt) => {
                          if (opt?.value) {
                            updateItem(editingItem.key, 'itemCatalogoId', opt.value as string);
                          }
                        }}
                        placeholder="Selecione..."
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label className="glass-modal-label">Quantidade</label>
                        <input type="number" step="0.01" min="0.01" className="glass-modal-input" value={editingItem.quantidade} onChange={e => updateItem(editingItem.key, 'quantidade', Number(e.target.value))} />
                      </div>
                      <div>
                        <label className="glass-modal-label">Valor Unitário</label>
                        <input type="number" step="0.01" className="glass-modal-input" value={editingItem.valorUnitario} onChange={e => updateItem(editingItem.key, 'valorUnitario', Number(e.target.value))} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label className="glass-modal-label">Desconto</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input type="number" step="0.01" className="glass-modal-input" value={editingItem.desconto} onChange={e => updateItem(editingItem.key, 'desconto', Number(e.target.value))} style={{ flex: 1 }} />
                          <select className="glass-modal-input" value={editingItem.descontoPercentual ? '%' : 'V'} onChange={e => updateItem(editingItem.key, 'descontoPercentual', e.target.value === '%')} style={{ width: 65 }}>
                            <option value="V">R$</option>
                            <option value="%">%</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="glass-modal-label">Tipo de Cobrança</label>
                        <select className="glass-modal-input" value={editingItem.tipoCobranca} onChange={e => updateItem(editingItem.key, 'tipoCobranca', Number(e.target.value))}>
                          <option value={TipoCobranca.Fixo}>Fixo</option>
                          <option value={TipoCobranca.Parcelado}>Parcelado</option>
                          <option value={TipoCobranca.Recorrente}>Recorrente</option>
                        </select>
                      </div>
                    </div>
                    {editingItem.tipoCobranca === TipoCobranca.Parcelado && (
                      <div style={{ marginBottom: '1rem' }}>
                        <label className="glass-modal-label">Número de Parcelas</label>
                        <input type="number" min="1" className="glass-modal-input" value={editingItem.numeroParcelas} onChange={e => updateItem(editingItem.key, 'numeroParcelas', Number(e.target.value))} />
                      </div>
                    )}
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '1rem', marginTop: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '1.05rem' }}>
                        <span>Total do Item:</span>
                        <span>{fmtMoney(calcItemTotal(editingItem).total)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  // Add mode
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                      <label className="glass-modal-label">Item / Serviço <span className="glass-modal-required">*</span></label>
                      <SearchSelect
                        options={catalogoOptions}
                        value={null}
                        onChange={(opt) => {
                          if (opt?.value) {
                            const cat = catalogoMap[opt.value as string];
                            if (cat) {
                              setItens(prev => [...prev, {
                                key: crypto.randomUUID(),
                                itemCatalogoId: cat.id,
                                itemNome: cat.nome,
                                unidade: cat.unidade || 'UN',
                                quantidade: 1,
                                valorUnitario: cat.precoBase ?? 0,
                                desconto: 0,
                                descontoPercentual: false,
                                aliquotaImposto: 0,
                                tipoCobranca: TipoCobranca.Fixo,
                                numeroParcelas: 1,
                                ordem: prev.length + 1,
                              }]);
                              setShowItemModal(false);
                            }
                          }
                        }}
                        placeholder="Buscar item ou serviço..."
                      />
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                      💡 Selecione um item ou serviço do catálogo para adicionar à proposta.
                    </div>
                  </>
                )}
              </div>
              <div className="glass-modal-footer">
                <button type="button" className="glass-modal-button-secondary" onClick={() => { setShowItemModal(false); setEditingItemKey(null); }}>Fechar</button>
                {editingItem && (
                  <button type="button" className="glass-modal-button-primary" onClick={() => { setShowItemModal(false); setEditingItemKey(null); }}>Salvar</button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

