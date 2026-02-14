import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Image, Palette, Phone, MapPin, Save, Check } from 'lucide-react';
import api from '../lib/api';
import { type Empresa, type Filial, type Cidade, TipoDocumento } from '../types';
import LoadingState from '../components/LoadingState';
import SearchSelect, { type SearchSelectOption } from '../components/SearchSelect';

const DOC_TYPE_KEYS: { value: number; key: string }[] = [
    { value: TipoDocumento.BR_CPF, key: 'docType_BR_CPF' },
    { value: TipoDocumento.BR_CNPJ, key: 'docType_BR_CNPJ' },
    { value: TipoDocumento.BR_RG, key: 'docType_BR_RG' },
    { value: TipoDocumento.PY_RUC, key: 'docType_PY_RUC' },
    { value: TipoDocumento.PY_CI, key: 'docType_PY_CI' },
    { value: TipoDocumento.AR_CUIT, key: 'docType_AR_CUIT' },
    { value: TipoDocumento.AR_CUIL, key: 'docType_AR_CUIL' },
    { value: TipoDocumento.AR_DNI, key: 'docType_AR_DNI' },
    { value: TipoDocumento.Passaporte, key: 'docType_Passaporte' },
    { value: TipoDocumento.Outro, key: 'docType_Outro' },
];

interface FormData {
    nomeRazaoSocial: string;
    nomeCurto: string;
    documento: string;
    tipoDocumento: string;
    logoUrl: string;
    logoSmallUrl: string;
    logoDarkUrl: string;
    website: string;
    slogan: string;
    corPrimaria: string;
    corSecundaria: string;
    telefone: string;
    celular: string;
    email: string;
    whatsApp: string;
    logradouro1: string;
    logradouro2: string;
    cep: string;
    cidadeId: string;
}

const emptyForm = (): FormData => ({
    nomeRazaoSocial: '', nomeCurto: '', documento: '', tipoDocumento: '',
    logoUrl: '', logoSmallUrl: '', logoDarkUrl: '',
    website: '', slogan: '', corPrimaria: '#1a1a2e', corSecundaria: '#c9a227',
    telefone: '', celular: '', email: '', whatsApp: '',
    logradouro1: '', logradouro2: '', cep: '', cidadeId: '',
});

const fillForm = (rec: Empresa): FormData => ({
    nomeRazaoSocial: rec.nomeRazaoSocial,
    nomeCurto: rec.nomeCurto,
    documento: rec.documento || '',
    tipoDocumento: rec.tipoDocumento != null ? String(rec.tipoDocumento) : '',
    logoUrl: rec.logoUrl || '',
    logoSmallUrl: rec.logoSmallUrl || '',
    logoDarkUrl: rec.logoDarkUrl || '',
    website: rec.website || '',
    slogan: rec.slogan || '',
    corPrimaria: rec.corPrimaria || '#1a1a2e',
    corSecundaria: rec.corSecundaria || '#c9a227',
    telefone: rec.telefone || '',
    celular: rec.celular || '',
    email: rec.email || '',
    whatsApp: rec.whatsApp || '',
    logradouro1: rec.logradouro1 || '',
    logradouro2: rec.logradouro2 || '',
    cep: rec.cep || '',
    cidadeId: rec.cidadeId != null ? String(rec.cidadeId) : '',
});

export default function Empresas() {
    const { t } = useTranslation();
    const [filiais, setFiliais] = useState<Filial[]>([]);
    const [selectedFilialId, setSelectedFilialId] = useState<string>('');
    const [cidades, setCidades] = useState<Cidade[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [formData, setFormData] = useState<FormData>(emptyForm());
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const fetchInitialData = useCallback(async () => {
        try {
            const [filRes, cidRes] = await Promise.all([
                api.get('/api/empresas/filiais'),
                api.get('/api/cidades'),
            ]);
            setFiliais(filRes.data);
            setCidades(cidRes.data);
            if (filRes.data.length > 0) {
                setSelectedFilialId(filRes.data[0].id);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

    const loadEmpresa = useCallback(async (filialId: string) => {
        if (!filialId) return;
        try {
            const res = await api.get(`/api/empresas/filial/${filialId}`);
            if (res.data) {
                setFormData(fillForm(res.data));
            } else {
                setFormData(emptyForm());
            }
        } catch (err) {
            console.error(err);
            setFormData(emptyForm());
        }
    }, []);

    useEffect(() => {
        if (selectedFilialId) loadEmpresa(selectedFilialId);
    }, [selectedFilialId, loadEmpresa]);

    const cidadeOptions: SearchSelectOption[] = useMemo(
        () => cidades.map(c => ({ value: c.id, label: `${c.nome} - ${c.departamentoNome}, ${c.paisNome}` })),
        [cidades]
    );

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setFormErrors({});
        setSaved(false);
        if (!formData.nomeRazaoSocial.trim()) {
            setFormErrors({ nomeRazaoSocial: t('company.validation.nameRequired') });
            return;
        }
        if (!formData.nomeCurto.trim()) {
            setFormErrors({ nomeCurto: t('company.validation.shortNameRequired') });
            return;
        }
        setSaving(true);
        try {
            const payload = {
                nomeRazaoSocial: formData.nomeRazaoSocial,
                nomeCurto: formData.nomeCurto,
                documento: formData.documento || null,
                tipoDocumento: formData.tipoDocumento ? Number(formData.tipoDocumento) : null,
                logoUrl: formData.logoUrl || null,
                logoSmallUrl: formData.logoSmallUrl || null,
                logoDarkUrl: formData.logoDarkUrl || null,
                website: formData.website || null,
                slogan: formData.slogan || null,
                corPrimaria: formData.corPrimaria || null,
                corSecundaria: formData.corSecundaria || null,
                telefone: formData.telefone || null,
                celular: formData.celular || null,
                email: formData.email || null,
                whatsApp: formData.whatsApp || null,
                logradouro1: formData.logradouro1 || null,
                logradouro2: formData.logradouro2 || null,
                cep: formData.cep || null,
                cidadeId: formData.cidadeId ? Number(formData.cidadeId) : null,
            };
            const res = await api.put(`/api/empresas/filial/${selectedFilialId}`, payload);
            setFormData(fillForm(res.data));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error: unknown) {
            const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setFormErrors({ _global: msg || t('company.validation.saveFailed') });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingState />;

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 className="page-title">{t('company.title')}</h1>
                <p className="text-secondary">{t('company.description')}</p>
            </div>

            {filiais.length > 1 && (
                <div style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
                    <label className="glass-modal-label">{t('company.branch')}</label>
                    <select className="glass-modal-input" value={selectedFilialId}
                        onChange={(e) => setSelectedFilialId(e.target.value)}>
                        {filiais.map(f => (
                            <option key={f.id} value={f.id}>{f.nome}</option>
                        ))}
                    </select>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="glass-card" style={{ padding: '1.5rem', maxWidth: '720px', width: '100%', margin: '0 auto' }}>
                    {formErrors._global && <div className="glass-modal-error" style={{ marginBottom: '1rem' }}>{formErrors._global}</div>}

                    {/* === Dados Básicos === */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--accent-primary)' }}>
                        <Building2 size={16} />
                        <span className="text-sm font-semibold uppercase tracking-wider">{t('company.sectionBasic')}</span>
                    </div>
                    <div>
                        <label className="glass-modal-label">{t('company.name')} <span className="glass-modal-required">*</span></label>
                        <input type="text" className="glass-modal-input" value={formData.nomeRazaoSocial}
                            onChange={(e) => setFormData({ ...formData, nomeRazaoSocial: e.target.value })} />
                        {formErrors.nomeRazaoSocial && <div className="glass-modal-error">{formErrors.nomeRazaoSocial}</div>}
                    </div>
                    <div>
                        <label className="glass-modal-label">{t('company.shortName')} <span className="glass-modal-required">*</span></label>
                        <input type="text" className="glass-modal-input" value={formData.nomeCurto}
                            onChange={(e) => setFormData({ ...formData, nomeCurto: e.target.value })}
                            placeholder={t('company.shortNamePlaceholder')} />
                        {formErrors.nomeCurto && <div className="glass-modal-error">{formErrors.nomeCurto}</div>}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="glass-modal-label">{t('company.documentType')}</label>
                            <select className="glass-modal-input" value={formData.tipoDocumento}
                                onChange={(e) => setFormData({ ...formData, tipoDocumento: e.target.value })}>
                                <option value="">{t('clients.selectDocType')}</option>
                                {DOC_TYPE_KEYS.map(d => (
                                    <option key={d.value} value={d.value}>{t(`clients.${d.key}`)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="glass-modal-label">{t('company.document')}</label>
                            <input type="text" className="glass-modal-input" value={formData.documento}
                                onChange={(e) => setFormData({ ...formData, documento: e.target.value })} />
                        </div>
                    </div>

                    {/* === Logos === */}
                    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.25rem', paddingTop: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--accent-primary)' }}>
                            <Image size={16} />
                            <span className="text-sm font-semibold uppercase tracking-wider">{t('company.sectionLogos')}</span>
                        </div>
                        <div>
                            <label className="glass-modal-label">{t('company.logo')}</label>
                            <input type="url" className="glass-modal-input" value={formData.logoUrl}
                                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                                placeholder="https://..." />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="glass-modal-label">{t('company.logoSmall')}</label>
                                <input type="url" className="glass-modal-input" value={formData.logoSmallUrl}
                                    onChange={(e) => setFormData({ ...formData, logoSmallUrl: e.target.value })}
                                    placeholder="https://..." />
                            </div>
                            <div>
                                <label className="glass-modal-label">{t('company.logoDark')}</label>
                                <input type="url" className="glass-modal-input" value={formData.logoDarkUrl}
                                    onChange={(e) => setFormData({ ...formData, logoDarkUrl: e.target.value })}
                                    placeholder="https://..." />
                            </div>
                        </div>
                        {(formData.logoUrl || formData.logoSmallUrl || formData.logoDarkUrl) && (
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                {formData.logoUrl && (
                                    <div style={{ textAlign: 'center' }}>
                                        <img src={formData.logoUrl} alt="Logo" style={{ maxHeight: '60px', maxWidth: '120px', objectFit: 'contain', borderRadius: '0.375rem', background: 'var(--card-bg)', padding: '4px' }}
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Logo</p>
                                    </div>
                                )}
                                {formData.logoSmallUrl && (
                                    <div style={{ textAlign: 'center' }}>
                                        <img src={formData.logoSmallUrl} alt="Logo Small" style={{ maxHeight: '40px', maxWidth: '40px', objectFit: 'contain', borderRadius: '0.375rem', background: 'var(--card-bg)', padding: '4px' }}
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Small</p>
                                    </div>
                                )}
                                {formData.logoDarkUrl && (
                                    <div style={{ textAlign: 'center' }}>
                                        <img src={formData.logoDarkUrl} alt="Logo Dark" style={{ maxHeight: '60px', maxWidth: '120px', objectFit: 'contain', borderRadius: '0.375rem', background: '#1a1a2e', padding: '4px' }}
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Dark</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* === Customização === */}
                    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.25rem', paddingTop: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--accent-primary)' }}>
                            <Palette size={16} />
                            <span className="text-sm font-semibold uppercase tracking-wider">{t('company.sectionCustomization')}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="glass-modal-label">{t('company.website')}</label>
                                <input type="url" className="glass-modal-input" value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    placeholder="https://www.empresa.com" />
                            </div>
                            <div>
                                <label className="glass-modal-label">{t('company.slogan')}</label>
                                <input type="text" className="glass-modal-input" value={formData.slogan}
                                    onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                                    placeholder={t('company.sloganPlaceholder')} />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="glass-modal-label">{t('company.primaryColor')}</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input type="color" value={formData.corPrimaria}
                                        onChange={(e) => setFormData({ ...formData, corPrimaria: e.target.value })}
                                        style={{ width: '40px', height: '36px', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', padding: 0, background: 'transparent' }} />
                                    <input type="text" className="glass-modal-input" value={formData.corPrimaria}
                                        onChange={(e) => setFormData({ ...formData, corPrimaria: e.target.value })}
                                        style={{ flex: 1 }} maxLength={9} />
                                </div>
                            </div>
                            <div>
                                <label className="glass-modal-label">{t('company.secondaryColor')}</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input type="color" value={formData.corSecundaria}
                                        onChange={(e) => setFormData({ ...formData, corSecundaria: e.target.value })}
                                        style={{ width: '40px', height: '36px', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', padding: 0, background: 'transparent' }} />
                                    <input type="text" className="glass-modal-input" value={formData.corSecundaria}
                                        onChange={(e) => setFormData({ ...formData, corSecundaria: e.target.value })}
                                        style={{ flex: 1 }} maxLength={9} />
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: `linear-gradient(90deg, ${formData.corPrimaria}, ${formData.corSecundaria})` }} />
                        </div>
                    </div>

                    {/* === Contato === */}
                    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.25rem', paddingTop: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--accent-primary)' }}>
                            <Phone size={16} />
                            <span className="text-sm font-semibold uppercase tracking-wider">{t('company.sectionContact')}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="glass-modal-label">{t('company.phone')}</label>
                                <input type="text" className="glass-modal-input" value={formData.telefone}
                                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                    placeholder="(99) 3333-0000" />
                            </div>
                            <div>
                                <label className="glass-modal-label">{t('company.mobile')}</label>
                                <input type="text" className="glass-modal-input" value={formData.celular}
                                    onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                                    placeholder="(99) 99999-0000" />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="glass-modal-label">{t('company.email')}</label>
                                <input type="email" className="glass-modal-input" value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="contato@empresa.com" />
                            </div>
                            <div>
                                <label className="glass-modal-label">{t('company.whatsapp')}</label>
                                <input type="text" className="glass-modal-input" value={formData.whatsApp}
                                    onChange={(e) => setFormData({ ...formData, whatsApp: e.target.value })}
                                    placeholder="+55 99 99999-0000" />
                            </div>
                        </div>
                    </div>

                    {/* === Endereço === */}
                    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.25rem', paddingTop: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--accent-primary)' }}>
                            <MapPin size={16} />
                            <span className="text-sm font-semibold uppercase tracking-wider">{t('company.sectionAddress')}</span>
                        </div>
                        <div>
                            <label className="glass-modal-label">{t('company.address1')}</label>
                            <input type="text" className="glass-modal-input" value={formData.logradouro1}
                                onChange={(e) => setFormData({ ...formData, logradouro1: e.target.value })} />
                        </div>
                        <div>
                            <label className="glass-modal-label">{t('company.address2')}</label>
                            <input type="text" className="glass-modal-input" value={formData.logradouro2}
                                onChange={(e) => setFormData({ ...formData, logradouro2: e.target.value })} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                            <div>
                                <label className="glass-modal-label">{t('company.zipCode')}</label>
                                <input type="text" className="glass-modal-input" value={formData.cep}
                                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })} />
                            </div>
                            <div>
                                <label className="glass-modal-label">{t('company.city')}</label>
                                <SearchSelect
                                    options={cidadeOptions}
                                    value={formData.cidadeId ? cidadeOptions.find(o => String(o.value) === formData.cidadeId) || null : null}
                                    onChange={(opt) => setFormData({ ...formData, cidadeId: opt ? String(opt.value) : '' })}
                                    placeholder={t('company.selectCity')}
                                />
                            </div>
                        </div>
                    </div>

                    {/* === Save Button === */}
                    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.25rem', paddingTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', alignItems: 'center' }}>
                        {saved && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--accent-success, #22c55e)', fontSize: '0.875rem' }}>
                                <Check size={16} /> {t('company.savedSuccess')}
                            </span>
                        )}
                        <button type="submit" className="glass-button flex items-center gap-2 px-6 py-2.5" disabled={saving}>
                            <Save size={16} />
                            <span>{saving ? t('company.saving') : t('common.save')}</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
