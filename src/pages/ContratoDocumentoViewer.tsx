import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import api from '../lib/api';
import type { ContratoDocumento, ContratoDocumentoAssinatura } from '../types';
import { StatusAssinatura, TipoContratoDocumento } from '../types';
import LoadingState from '../components/LoadingState';

export default function ContratoDocumentoViewer() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const documentoId = searchParams.get('id');
  const contratoId = searchParams.get('contratoId');

  const [documento, setDocumento] = useState<ContratoDocumento | null>(null);
  const [documentos, setDocumentos] = useState<ContratoDocumento[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'preview' | 'meta' | 'assinaturas'>('preview');

  const fetchDocumento = useCallback(async () => {
    if (documentoId) {
      try {
        const res = await api.get(`/api/documentos/${documentoId}`);
        setDocumento(res.data);
      } catch (err) { console.error(err); }
    }
    setLoading(false);
  }, [documentoId]);

  const fetchDocumentos = useCallback(async () => {
    if (!contratoId) return;
    try {
      const res = await api.get(`/api/contratos/${contratoId}/documentos`);
      setDocumentos(res.data);
      if (res.data.length > 0 && !documentoId) {
        setDocumento(res.data[0]);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [contratoId, documentoId]);

  useEffect(() => {
    const load = async () => {
      if (documentoId) { await fetchDocumento(); }
      if (contratoId) { await fetchDocumentos(); }
      if (!documentoId && !contratoId) { setLoading(false); }
    };
    load();
  }, [fetchDocumento, fetchDocumentos, documentoId, contratoId]);

  const getTipoLabel = (tipo: number) => {
    switch (tipo) {
      case TipoContratoDocumento.Contrato: return t('documents.typeContract');
      case TipoContratoDocumento.Aditivo: return t('documents.typeAddendum');
      case TipoContratoDocumento.Termo: return t('documents.typeTerm');
      default: return '';
    }
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case StatusAssinatura.Pendente: return <Clock size={14} className="text-warning" />;
      case StatusAssinatura.Assinado: return <CheckCircle size={14} className="text-success" />;
      case StatusAssinatura.Recusado: return <XCircle size={14} className="text-danger" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case StatusAssinatura.Pendente: return t('documents.statusPending');
      case StatusAssinatura.Assinado: return t('documents.statusSigned');
      case StatusAssinatura.Recusado: return t('documents.statusRefused');
      default: return '';
    }
  };

  const handleAssinar = async (assinatura: ContratoDocumentoAssinatura) => {
    if (!documento) return;
    try {
      await api.post(`/api/documentos/${documento.id}/assinar`, {
        assinaturaId: assinatura.id,
      });
      // Refresh
      const res = await api.get(`/api/documentos/${documento.id}`);
      setDocumento(res.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || t('documents.signError');
      alert(msg);
    }
  };

  if (loading) return <LoadingState />;

  if (!documento && !documentos.length) {
    return (
      <div className="animate-fadeIn">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <button className="action-button" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
          <h1 className="page-title" style={{ margin: 0 }}>{t('documents.title')}</h1>
        </div>
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p className="text-secondary">{t('documents.noDocuments')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="action-button" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>
              {documento ? `${getTipoLabel(documento.tipo)} - v${documento.versaoModelo}` : t('documents.titlePlural')}
            </h1>
            {documento && (
              <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
                Hash: {documento.hashConteudo?.substring(0, 24)}... | {new Date(documento.createdAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Document List (if viewing by contrato) */}
      {contratoId && documentos.length > 1 && (
        <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
            {documentos.map(d => (
              <button
                key={d.id}
                className={`btn ${documento?.id === d.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setDocumento(d)}
                style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}
              >
                {getTipoLabel(d.tipo)} v{d.versaoModelo}
              </button>
            ))}
          </div>
        </div>
      )}

      {documento && (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '1rem' }}>
            {(['preview', 'assinaturas', 'meta'] as const).map(tab => (
              <button key={tab} className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab(tab)} style={{ fontSize: '0.85rem' }}>
                {tab === 'preview' ? t('documents.preview') : tab === 'assinaturas' ? `${t('documents.signaturesTab')} (${documento.assinaturas.length})` : t('documents.metadata')}
              </button>
            ))}
          </div>

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <iframe
                srcDoc={documento.conteudoCompilado}
                title="Contract Preview"
                style={{ width: '100%', minHeight: '70vh', border: 'none' }}
              />
            </div>
          )}

          {/* Signatures Tab */}
          {activeTab === 'assinaturas' && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>{t('documents.signaturesTitle')}</h2>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>{t('documents.role')}</th>
                    <th>{t('documents.name')}</th>
                    <th>{t('documents.document')}</th>
                    <th>{t('documents.status')}</th>
                    <th>{t('documents.signedAt')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {documento.assinaturas.map(a => (
                    <tr key={a.id}>
                      <td><strong>{a.papel}</strong></td>
                      <td>{a.nome || '-'}</td>
                      <td>{a.documento || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {getStatusIcon(a.status)}
                          <span>{getStatusLabel(a.status)}</span>
                        </div>
                      </td>
                      <td>{a.assinadoEm ? new Date(a.assinadoEm).toLocaleString() : '-'}</td>
                      <td>
                        {a.status === StatusAssinatura.Pendente && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleAssinar(a)}>
                            {t('documents.sign')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {documento.assinaturas.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>{t('documents.noSignatures')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Metadata Tab */}
          {activeTab === 'meta' && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>{t('documents.metadataTitle')}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
                <span className="text-secondary">ID:</span><code>{documento.id}</code>
                <span className="text-secondary">{t('documents.type')}:</span><span>{getTipoLabel(documento.tipo)}</span>
                <span className="text-secondary">{t('documents.modelId')}:</span><code>{documento.modeloContratoId}</code>
                <span className="text-secondary">{t('documents.modelVersion')}:</span><span>{documento.versaoModelo}</span>
                <span className="text-secondary">{t('documents.hash')}:</span><code style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{documento.hashConteudo}</code>
                <span className="text-secondary">{t('documents.generatedAt')}:</span><span>{new Date(documento.createdAt).toLocaleString()}</span>
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '1.5rem', marginBottom: '0.5rem' }}>{t('documents.substitutionValues')}</h3>
              <pre style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', fontSize: '0.8rem', overflow: 'auto', maxHeight: '300px' }}>
                {(() => { try { return JSON.stringify(JSON.parse(documento.valoresSubstituicaoJson), null, 2); } catch { return documento.valoresSubstituicaoJson; } })()}
              </pre>

              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '1.5rem', marginBottom: '0.5rem' }}>{t('documents.appliedClauses')}</h3>
              <pre style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', fontSize: '0.8rem', overflow: 'auto', maxHeight: '200px' }}>
                {(() => { try { return JSON.stringify(JSON.parse(documento.clausulasAplicadasJson), null, 2); } catch { return documento.clausulasAplicadasJson; } })()}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}

