import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Plus, Trash2, Copy, FileText,
  ChevronRight, PenTool, Hash, Code, GripVertical
} from 'lucide-react';
import api from '../lib/api';
import LoadingState from '../components/LoadingState';
import type { ModeloContrato, ModeloSecao, ModeloParagrafo, ModeloAssinatura, ModeloPalavraChave } from '../types';

function newId() { return crypto.randomUUID(); }

function emptySecao(ordem: number): ModeloSecao {
  return { id: newId(), titulo: '', codigoIdentificador: '', ordem, paragrafos: [], filhas: [] };
}
function emptyParagrafo(ordem: number): ModeloParagrafo {
  return { id: newId(), ordem, conteudo: '', isHtml: true, codigoIdentificador: '' };
}
function emptyAssinatura(ordem: number): ModeloAssinatura {
  return { id: newId(), papel: '', ordem, obrigatoria: true };
}
function emptyPalavra(): ModeloPalavraChave {
  return { id: newId(), tag: '', descricao: '', exemplo: '' };
}

export default function ModeloContratoEditor() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modeloId = searchParams.get('id');

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [versao, setVersao] = useState(1);
  const [ativo, setAtivo] = useState(true);
  const [, setEscopoJson] = useState('');
  const [secoes, setSecoes] = useState<ModeloSecao[]>([]);
  const [assinaturas, setAssinaturas] = useState<ModeloAssinatura[]>([]);
  const [palavrasChave, setPalavrasChave] = useState<ModeloPalavraChave[]>([]);
  const [expandedSecoes, setExpandedSecoes] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'secoes' | 'assinaturas' | 'palavras'>('secoes');
  const [showProps, setShowProps] = useState(false);

  const fetchModelo = useCallback(async () => {
    if (!modeloId) { setLoading(false); return; }
    try {
      const res = await api.get(`/api/modelos-contrato/${modeloId}`);
      const m: ModeloContrato = res.data;
      setNome(m.nome);
      setDescricao(m.descricao || '');
      setVersao(m.versao);
      setAtivo(m.ativo);
      setEscopoJson(m.escopoJson || '');
      setSecoes(m.secoes || []);
      setAssinaturas(m.assinaturas || []);
      setPalavrasChave(m.palavrasChave || []);
      const ids = new Set<string>();
      (m.secoes || []).forEach(s => ids.add(s.id));
      setExpandedSecoes(ids);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [modeloId]);

  useEffect(() => {
    const load = async () => { await fetchModelo(); };
    load();
  }, [fetchModelo]);

  const toggleSecao = (id: string) => {
    setExpandedSecoes(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const addSecao = () => {
    const s = emptySecao(secoes.length + 1);
    setSecoes(prev => [...prev, s]);
    setExpandedSecoes(prev => new Set(prev).add(s.id));
  };
  const removeSecao = (id: string) => setSecoes(prev => prev.filter(s => s.id !== id));
  const updateSecao = (id: string, field: keyof ModeloSecao, value: string | number) => {
    setSecoes(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addParagrafo = (secaoId: string) => {
    setSecoes(prev => prev.map(s => {
      if (s.id !== secaoId) return s;
      return { ...s, paragrafos: [...s.paragrafos, emptyParagrafo(s.paragrafos.length + 1)] };
    }));
  };
  const removeParagrafo = (secaoId: string, paragrafoId: string) => {
    setSecoes(prev => prev.map(s => {
      if (s.id !== secaoId) return s;
      return { ...s, paragrafos: s.paragrafos.filter(p => p.id !== paragrafoId) };
    }));
  };
  const updateParagrafo = (secaoId: string, paragrafoId: string, field: keyof ModeloParagrafo, value: string | number | boolean) => {
    setSecoes(prev => prev.map(s => {
      if (s.id !== secaoId) return s;
      return { ...s, paragrafos: s.paragrafos.map(p => p.id === paragrafoId ? { ...p, [field]: value } : p) };
    }));
  };

  const addAssinatura = () => setAssinaturas(prev => [...prev, emptyAssinatura(prev.length + 1)]);
  const removeAssinatura = (id: string) => setAssinaturas(prev => prev.filter(a => a.id !== id));
  const updateAssinatura = (id: string, field: keyof ModeloAssinatura, value: string | number | boolean) => {
    setAssinaturas(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const addPalavra = () => setPalavrasChave(prev => [...prev, emptyPalavra()]);
  const removePalavra = (id: string) => setPalavrasChave(prev => prev.filter(p => p.id !== id));
  const updatePalavra = (id: string, field: keyof ModeloPalavraChave, value: string) => {
    setPalavrasChave(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        nome, descricao: descricao || null, versao, ativo,
        escopoJson: null,
        secoes, assinaturas, palavrasChave,
      };
      if (modeloId) {
        await api.put(`/api/modelos-contrato/${modeloId}`, payload);
      } else {
        const res = await api.post('/api/modelos-contrato', payload);
        navigate(`/admin/comercial/modelos-contrato/editor?id=${res.data.id}`, { replace: true });
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || t('contractEditor.validation.saveFailed');
      alert(msg);
    }
    setSaving(false);
  };

  const handleDuplicar = async () => {
    if (!modeloId) return;
    try {
      const res = await api.post(`/api/modelos-contrato/${modeloId}/duplicar-versao`);
      navigate(`/admin/comercial/modelos-contrato/editor?id=${res.data.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || t('contractEditor.duplicateError');
      alert(msg);
    }
  };

  if (loading) {
    return <LoadingState minHeight="60vh" />;
  }

  return (
    <div className="animate-fadeIn">
      {/* ── Sticky Toolbar ── */}
      <div className="mce-toolbar">
        <div className="mce-toolbar-left">
          <button className="mce-btn mce-btn-ghost" onClick={() => navigate('/admin/comercial/modelos-contrato')} title={t('common.back')}>
            <ArrowLeft size={16} />
          </button>
          <div className="mce-toolbar-title">
            {nome || t('contractEditor.newModel')}
          </div>
          <span className="mce-toolbar-badge mce-badge-version">v{versao}</span>
          <span className={`mce-toolbar-badge ${ativo ? 'mce-badge-active' : 'mce-badge-draft'}`}>
            {ativo ? t('contractEditor.active') : t('contractEditor.draft')}
          </span>
        </div>
        <div className="mce-toolbar-right">
          <button className="mce-btn" onClick={() => setShowProps(!showProps)}>
            {showProps ? t('contractEditor.hideProperties') : t('contractEditor.properties')}
          </button>
          {modeloId && (
            <button className="mce-btn" onClick={handleDuplicar}>
              <Copy size={14} /> {t('contractEditor.duplicate')}
            </button>
          )}
          <button className="mce-btn mce-btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={14} /> {saving ? t('contractEditor.saving') : t('contractEditor.save')}
          </button>
        </div>
      </div>

      {/* ── Properties Panel (collapsible) ── */}
      {showProps && (
        <div className="mce-props">
          <div className="mce-props-grid">
            <div className="mce-field">
              <label>{t('contractEditor.modelName')} *</label>
              <input value={nome} onChange={e => setNome(e.target.value)} />
            </div>
            <div className="mce-field">
              <label>{t('contractEditor.version')}</label>
              <input type="number" value={versao} onChange={e => setVersao(Number(e.target.value))} min={1} />
            </div>
            <div className="mce-field">
              <label>{t('contractEditor.status')}</label>
              <select value={ativo ? '1' : '0'} onChange={e => setAtivo(e.target.value === '1')}>
                <option value="1">{t('contractEditor.active')}</option>
                <option value="0">{t('contractEditor.draft')}</option>
              </select>
            </div>
          </div>
          <div className="mce-field" style={{ marginTop: '0.75rem' }}>
            <label>{t('contractEditor.description')}</label>
            <textarea rows={2} value={descricao} onChange={e => setDescricao(e.target.value)} />
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="mce-tabs">
        <button className={`mce-tab ${activeTab === 'secoes' ? 'active' : ''}`} onClick={() => setActiveTab('secoes')}>
          <FileText size={15} /> {t('contractEditor.document')} <span className="mce-tab-count">{secoes.length}</span>
        </button>
        <button className={`mce-tab ${activeTab === 'assinaturas' ? 'active' : ''}`} onClick={() => setActiveTab('assinaturas')}>
          <PenTool size={15} /> {t('contractEditor.signatures')} <span className="mce-tab-count">{assinaturas.length}</span>
        </button>
        <button className={`mce-tab ${activeTab === 'palavras' ? 'active' : ''}`} onClick={() => setActiveTab('palavras')}>
          <Hash size={15} /> {t('contractEditor.tags')} <span className="mce-tab-count">{palavrasChave.length}</span>
        </button>
      </div>

      {/* ══════════ SECTIONS TAB — Document Canvas ══════════ */}
      {activeTab === 'secoes' && (
        <div className="mce-canvas">
          <div className="mce-paper">
            {secoes.length === 0 && (
              <div className="mce-paper-empty">
                <FileText size={56} />
                <p style={{ fontSize: '1rem', fontWeight: 500 }}>{t('contractEditor.emptyDocument')}</p>
                <p style={{ fontSize: '0.85rem' }}>{t('contractEditor.emptyDocumentHint')}</p>
                <button className="mce-btn mce-btn-primary" onClick={addSecao} style={{ marginTop: '0.5rem' }}>
                  <Plus size={15} /> {t('contractEditor.addFirstSection')}
                </button>
              </div>
            )}

            {secoes.map((secao, sIdx) => {
              const isExpanded = expandedSecoes.has(secao.id);
              return (
                <div key={secao.id} className={`mce-section ${isExpanded ? 'expanded' : ''}`}>
                  {/* Section Header */}
                  <div className="mce-section-header" onClick={() => toggleSecao(secao.id)}>
                    <ChevronRight size={16} className={`mce-section-chevron ${isExpanded ? 'open' : ''}`} />
                    <span className="mce-section-number">{sIdx + 1}</span>
                    <span className={`mce-section-title-text ${!secao.titulo ? 'placeholder' : ''}`}>
                      {secao.titulo || t('contractEditor.sectionNoTitle')}
                    </span>
                    <div className="mce-section-meta">
                      {secao.codigoIdentificador && (
                        <span className="mce-section-meta-pill">{secao.codigoIdentificador}</span>
                      )}
                      <span className="mce-section-meta-pill">
                        {secao.paragrafos.length} {secao.paragrafos.length === 1 ? t('contractEditor.paragraph') : t('contractEditor.paragraphs')}
                      </span>
                      <button
                        className="mce-btn mce-btn-ghost mce-btn-danger"
                        onClick={e => { e.stopPropagation(); removeSecao(secao.id); }}
                        title={t('contractEditor.removeSection')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Section Body */}
                  {isExpanded && (
                    <div className="mce-section-body">
                      {/* Section Fields */}
                      <div className="mce-section-fields">
                        <div className="mce-field">
                          <label>{t('contractEditor.sectionTitle')}</label>
                          <input
                            value={secao.titulo}
                            onChange={e => updateSecao(secao.id, 'titulo', e.target.value)}
                            placeholder=""
                          />
                        </div>
                        <div className="mce-field">
                          <label>{t('contractEditor.code')}</label>
                          <input
                            value={secao.codigoIdentificador || ''}
                            onChange={e => updateSecao(secao.id, 'codigoIdentificador', e.target.value)}
                            placeholder="SEC-01"
                          />
                        </div>
                        <div className="mce-field">
                          <label>{t('contractEditor.order')}</label>
                          <input
                            type="number"
                            value={secao.ordem}
                            onChange={e => updateSecao(secao.id, 'ordem', Number(e.target.value))}
                          />
                        </div>
                      </div>

                      {/* Paragraphs */}
                      {secao.paragrafos.map((p, pIdx) => (
                        <div key={p.id} className="mce-para">
                          <div className="mce-para-toolbar">
                            <div className="mce-para-left">
                              <GripVertical size={14} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                              <span className="mce-para-number">§ {pIdx + 1}</span>
                              <label className="mce-checkbox-label">
                                <input type="checkbox" checked={p.isHtml} onChange={e => updateParagrafo(secao.id, p.id, 'isHtml', e.target.checked)} />
                                HTML
                              </label>
                            </div>
                            <div className="mce-para-right">
                              {p.codigoIdentificador && (
                                <span className="mce-section-meta-pill" style={{ marginRight: 4 }}>{p.codigoIdentificador}</span>
                              )}
                              <button
                                className="mce-btn mce-btn-ghost mce-btn-danger"
                                onClick={() => removeParagrafo(secao.id, p.id)}
                                title={t('contractEditor.removeParagraph')}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          <textarea
                            rows={3}
                            value={p.conteudo}
                            onChange={e => updateParagrafo(secao.id, p.id, 'conteudo', e.target.value)}
                            placeholder={t('contractEditor.clauseContent')}
                          />

                          <div className="mce-para-condition">
                            <input
                              value={p.condicaoExibicao || ''}
                              onChange={e => updateParagrafo(secao.id, p.id, 'condicaoExibicao', e.target.value)}
                              placeholder={t('contractEditor.displayCondition')}
                            />
                          </div>

                          {/* Hidden fields for code/ordem — inline row */}
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                            <div className="mce-field" style={{ flex: '0 0 130px' }}>
                              <label style={{ fontSize: '0.65rem' }}><Code size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> {t('contractEditor.code')}</label>
                              <input
                                value={p.codigoIdentificador || ''}
                                onChange={e => updateParagrafo(secao.id, p.id, 'codigoIdentificador', e.target.value)}
                                placeholder="PAR-01"
                                style={{ fontSize: '0.8rem', padding: '0.35rem 0.55rem' }}
                              />
                            </div>
                            <div className="mce-field" style={{ flex: '0 0 70px' }}>
                              <label style={{ fontSize: '0.65rem' }}>{t('contractEditor.order')}</label>
                              <input
                                type="number"
                                value={p.ordem}
                                onChange={e => updateParagrafo(secao.id, p.id, 'ordem', Number(e.target.value))}
                                style={{ fontSize: '0.8rem', padding: '0.35rem 0.55rem' }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <button className="mce-add-para" onClick={() => addParagrafo(secao.id)}>
                        <Plus size={14} /> {t('contractEditor.addParagraph')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {secoes.length > 0 && (
              <button className="mce-add-section" onClick={addSecao}>
                <Plus size={16} /> {t('contractEditor.addSection')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ══════════ SIGNATURES TAB ══════════ */}
      {activeTab === 'assinaturas' && (
        <div style={{ maxWidth: 700 }}>
          {assinaturas.map((a, idx) => (
            <div key={a.id} className="mce-row-card">
              <span className="mce-row-num">{idx + 1}</span>
              <div className="mce-field" style={{ flex: 2 }}>
                <label>{t('contractEditor.role')}</label>
                <input value={a.papel} onChange={e => updateAssinatura(a.id, 'papel', e.target.value)} />
              </div>
              <div className="mce-field" style={{ flex: '0 0 70px' }}>
                <label>{t('contractEditor.order')}</label>
                <input type="number" value={a.ordem} onChange={e => updateAssinatura(a.id, 'ordem', Number(e.target.value))} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, paddingTop: '1.2rem' }}>
                <label className="mce-checkbox-label">
                  <input type="checkbox" checked={a.obrigatoria} onChange={e => updateAssinatura(a.id, 'obrigatoria', e.target.checked)} />
                  {t('contractEditor.required')}
                </label>
              </div>
              <button
                className="mce-btn mce-btn-ghost mce-btn-danger"
                onClick={() => removeAssinatura(a.id)}
                title={t('contractEditor.remove')}
                style={{ marginTop: '1rem' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {assinaturas.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <PenTool size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.2 }} />
              <p>{t('contractEditor.noSignatures')}</p>
            </div>
          )}

          <button className="mce-add-row" onClick={addAssinatura}>
            <Plus size={15} /> {t('contractEditor.addSignature')}
          </button>
        </div>
      )}

      {/* ══════════ TAGS TAB ══════════ */}
      {activeTab === 'palavras' && (
        <div style={{ maxWidth: 800 }}>
          {palavrasChave.map((p, idx) => (
            <div key={p.id} className="mce-row-card">
              <span className="mce-row-num">{idx + 1}</span>
              <div className="mce-field" style={{ flex: '0 0 160px' }}>
                <label>{t('contractEditor.tag')}</label>
                <input
                  value={p.tag}
                  onChange={e => updatePalavra(p.id, 'tag', e.target.value)}
                  placeholder="{{NOME_CLIENTE}}"
                  style={{ fontFamily: "'Consolas','Monaco',monospace", fontSize: '0.82rem' }}
                />
              </div>
              <div className="mce-field" style={{ flex: 2 }}>
                <label>{t('contractEditor.tagDescription')}</label>
                <input value={p.descricao} onChange={e => updatePalavra(p.id, 'descricao', e.target.value)} />
              </div>
              <div className="mce-field" style={{ flex: 1 }}>
                <label>{t('contractEditor.example')}</label>
                <input value={p.exemplo || ''} onChange={e => updatePalavra(p.id, 'exemplo', e.target.value)} />
              </div>
              <button
                className="mce-btn mce-btn-ghost mce-btn-danger"
                onClick={() => removePalavra(p.id)}
                title={t('contractEditor.remove')}
                style={{ marginTop: '1rem' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {palavrasChave.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Hash size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.2 }} />
              <p>{t('contractEditor.noTags')}</p>
              <p style={{ fontSize: '0.85rem' }}>{t('contractEditor.tagsHint', { example: '{{NOME_CLIENTE}}' })}</p>
            </div>
          )}

          <button className="mce-add-row" onClick={addPalavra}>
            <Plus size={15} /> {t('contractEditor.addTag')}
          </button>
        </div>
      )}
    </div>
  );
}
