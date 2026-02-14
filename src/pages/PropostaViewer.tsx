import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, FileText, Download, Building2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import api from '../lib/api';
import LoadingState from '../components/LoadingState';
import { type Empresa, type Filial, type Proposta } from '../types';

function fmtMoney(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

async function loadImageAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('failed_to_fetch_image');
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('failed_to_read_image'));
    reader.readAsDataURL(blob);
  });
}

async function getImageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    img.onerror = () => reject(new Error('failed_to_load_image'));
    img.src = dataUrl;
  });
}

function empresaHeaderLines(empresa: Empresa | null): string[] {
  if (!empresa) return [];
  const lines: string[] = [];

  const enderecoParts = [empresa.logradouro1, empresa.logradouro2].filter(Boolean);
  const endereco = enderecoParts.join(' - ');
  const cidadeParts = [empresa.cidadeNome, empresa.departamentoNome, empresa.paisNome].filter(Boolean);
  const cidadeLinha = cidadeParts.join(' / ');

  if (endereco) lines.push(endereco);
  if (empresa.cep || cidadeLinha) {
    const cepCidade = [empresa.cep, cidadeLinha].filter(Boolean).join(' - ');
    lines.push(cepCidade);
  }

  const contato = [empresa.telefone, empresa.celular, empresa.whatsApp].filter(Boolean).join(' | ');
  if (contato) lines.push(contato);
  if (empresa.email) lines.push(empresa.email);
  if (empresa.website) lines.push(empresa.website);

  return lines;
}

export default function PropostaViewer() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [proposta, setProposta] = useState<Proposta | null>(null);

  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [selectedFilialId, setSelectedFilialId] = useState<string>('');
  const [empresa, setEmpresa] = useState<Empresa | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [propRes, filRes] = await Promise.all([
        api.get(`/api/propostas/${id}`),
        api.get('/api/empresas/filiais'),
      ]);

      setProposta(propRes.data);
      setFiliais(filRes.data);
      if (filRes.data.length > 0) {
        setSelectedFilialId(filRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const loadEmpresa = useCallback(async () => {
    if (!selectedFilialId) return;
    try {
      const res = await api.get(`/api/empresas/filial/${selectedFilialId}`);
      setEmpresa(res.data || null);
    } catch (err) {
      console.error(err);
      setEmpresa(null);
    }
  }, [selectedFilialId]);

  useEffect(() => { loadEmpresa(); }, [loadEmpresa]);

  const itensOrdenados = useMemo(() => {
    if (!proposta) return [];
    return [...proposta.itens].sort((a, b) => a.ordem - b.ordem);
  }, [proposta]);

  const generatePdf = useCallback(async () => {
    if (!proposta) return;

    setPdfLoading(true);
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const marginX = 14;
      let y = 14;

      const headerStartY = y;
      const headerMinH = 24;
      const logoTargetW = 32;

      let logoDataUrl: string | null = null;
      const empresaLogoUrl = empresa?.logoUrl || empresa?.logoSmallUrl || empresa?.logoDarkUrl;
      if (empresaLogoUrl) {
        try {
          logoDataUrl = await loadImageAsDataUrl(empresaLogoUrl);
        } catch {
          logoDataUrl = null;
        }
      }
      if (!logoDataUrl) {
        try {
          logoDataUrl = await loadImageAsDataUrl('/logo_ziggy.png');
        } catch {
          logoDataUrl = null;
        }
      }

      let headerBottomY = headerStartY + headerMinH;

      if (logoDataUrl) {
        const { width: imgW, height: imgH } = await getImageSize(logoDataUrl);
        const targetH = imgW > 0 ? (logoTargetW * imgH) / imgW : 12;
        const logoY = y + Math.max(0, (headerMinH - targetH) / 2);
        doc.addImage(logoDataUrl, 'PNG', marginX + 3, logoY, logoTargetW, targetH);
        headerBottomY = Math.max(headerBottomY, logoY + targetH);
      } else {
        doc.setFontSize(10);
        doc.text('Ziggy', marginX + 8, y + 16);
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(empresa?.nomeRazaoSocial || empresa?.nomeCurto || 'Ziggy', marginX + 40, y + 9);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const headerLines = empresaHeaderLines(empresa);
      let hy = y + 14;
      headerLines.slice(0, 5).forEach((line) => {
        doc.text(String(line), marginX + 40, hy);
        hy += 4.2;
      });

      headerBottomY = Math.max(headerBottomY, hy);
      y = headerBottomY + 4;

      doc.setDrawColor(220);
      doc.setLineWidth(0.3);
      doc.line(marginX, y, pageW - marginX, y);

      y += 12;

      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text(t('proposals.pdfTitle'), marginX, y);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`${t('proposals.pdfNumber')}: ${proposta.id}`, marginX, y + 6);
      doc.text(`${t('proposals.client')}: ${proposta.clienteNome || ''}`, marginX, y + 11);
      doc.text(`${t('proposals.titleField')}: ${proposta.titulo || '—'}`, marginX, y + 16);
      doc.text(`${t('proposals.validity')}: ${new Date(proposta.validaAte).toLocaleDateString()}`, marginX, y + 21);

      const rightX = pageW - marginX;
      doc.text(`${t('proposals.pdfGeneratedAt')}: ${new Date().toLocaleString()}`, rightX, y + 6, { align: 'right' });
      doc.text(`${t('proposals.total')}: ${fmtMoney(proposta.total)}`, rightX, y + 11, { align: 'right' });

      y += 30;

      const colItemX = marginX;
      const colQtdX = pageW - marginX - 78;
      const colUnitX = pageW - marginX - 56;
      const colTotalX = pageW - marginX;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(t('proposals.pdfItem'), colItemX, y);
      doc.text(t('proposals.pdfQty'), colQtdX, y, { align: 'right' });
      doc.text(t('proposals.pdfUnit'), colUnitX, y, { align: 'right' });
      doc.text(t('proposals.pdfTotal'), colTotalX, y, { align: 'right' });

      y += 2;
      doc.setLineWidth(0.3);
      doc.line(marginX, y, pageW - marginX, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      for (const it of itensOrdenados) {
        const itemName = it.itemNomeSnapshot || '';
        const lines = doc.splitTextToSize(itemName, colQtdX - colItemX - 4);

        if (y > 275) {
          doc.addPage();
          y = 18;
        }

        doc.text(lines, colItemX, y);
        const rowH = Math.max(4.2 * lines.length, 4.2);

        doc.text(String(it.quantidade), colQtdX, y, { align: 'right' });
        doc.text(fmtMoney(it.valorUnitario), colUnitX, y, { align: 'right' });
        doc.text(fmtMoney(it.totalItem), colTotalX, y, { align: 'right' });

        y += rowH + 3;
      }

      y += 2;
      doc.setLineWidth(0.3);
      doc.line(marginX, y, pageW - marginX, y);
      y += 6;

      const totalsBoxW = 80;
      const totalsX = pageW - marginX - totalsBoxW;

      doc.setFont('helvetica', 'normal');
      doc.text(`${t('proposals.subtotal')}:`, totalsX, y);
      doc.text(fmtMoney(proposta.subtotal), totalsX + totalsBoxW, y, { align: 'right' });

      y += 5;
      doc.text(`${t('proposals.tax')}:`, totalsX, y);
      doc.text(fmtMoney(proposta.impostosTotal), totalsX + totalsBoxW, y, { align: 'right' });

      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.text(`${t('proposals.total')}:`, totalsX, y);
      doc.text(fmtMoney(proposta.total), totalsX + totalsBoxW, y, { align: 'right' });

      if (proposta.observacoes) {
        y += 12;
        if (y > 265) {
          doc.addPage();
          y = 18;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(t('proposals.notes'), marginX, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        const obsLines = doc.splitTextToSize(String(proposta.observacoes), pageW - marginX * 2);
        doc.text(obsLines, marginX, y);
      }

      doc.save(`proposta-${proposta.id}.pdf`);
    } finally {
      setPdfLoading(false);
    }
  }, [empresa, itensOrdenados, proposta, t]);

  if (loading) return <LoadingState />;
  if (!proposta) {
    return (
      <div className="animate-fadeIn">
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 className="page-title">{t('proposals.viewTitle')}</h1>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', maxWidth: 920, width: '100%', margin: '0 auto' }}>
          <div className="text-secondary">{t('proposals.notFound')}</div>
          <button className="glass-button" style={{ marginTop: '1rem' }} onClick={() => navigate('/admin/comercial/propostas')}>
            <ArrowLeft size={16} />
            <span style={{ marginLeft: 8 }}>{t('common.back')}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Eye size={18} />
            {t('proposals.viewTitle')}
          </h1>
          <p className="text-secondary">{t('proposals.viewDescription')}</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="glass-button flex items-center gap-2 px-4 py-2.5" onClick={() => navigate('/admin/comercial/propostas')}>
            <ArrowLeft className="w-4 h-4" />
            <span>{t('common.back')}</span>
          </button>

          <button className="glass-button flex items-center gap-2 px-4 py-2.5" onClick={generatePdf} disabled={pdfLoading}>
            <Download className="w-4 h-4" />
            <span>{pdfLoading ? t('proposals.generatingPdf') : t('proposals.generatePdf')}</span>
          </button>
        </div>
      </div>

      {filiais.length > 1 && (
        <div style={{ marginBottom: '1rem', maxWidth: 420 }}>
          <label className="glass-modal-label">{t('company.branch')}</label>
          <select className="glass-modal-input" value={selectedFilialId} onChange={(e) => setSelectedFilialId(e.target.value)}>
            {filiais.map(f => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>
        </div>
      )}

      <div className="glass-card" style={{ padding: '1.25rem', maxWidth: 920, width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div className="text-secondary" style={{ fontSize: '0.85rem' }}>{t('proposals.client')}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>{proposta.clienteNome || '—'}</div>
          </div>
          <div>
            <div className="text-secondary" style={{ fontSize: '0.85rem' }}>{t('proposals.validity')}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>{new Date(proposta.validaAte).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-secondary" style={{ fontSize: '0.85rem' }}>{t('proposals.total')}</div>
            <div style={{ fontSize: '1rem', fontWeight: 800 }}>{fmtMoney(proposta.total)}</div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1rem', paddingTop: '1rem' }}>
          <div className="text-secondary" style={{ fontSize: '0.85rem' }}>{t('proposals.titleField')}</div>
          <div style={{ fontSize: '1rem', fontWeight: 600 }}>{proposta.titulo || '—'}</div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1rem', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: 'var(--accent-primary)' }}>
            <FileText size={16} />
            <span className="text-sm font-semibold uppercase tracking-wider">{t('proposals.itemsServices')}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 120px 120px', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700, padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
            <div>{t('proposals.pdfItem')}</div>
            <div style={{ textAlign: 'right' }}>{t('proposals.pdfQty')}</div>
            <div style={{ textAlign: 'right' }}>{t('proposals.pdfUnit')}</div>
            <div style={{ textAlign: 'right' }}>{t('proposals.pdfTotal')}</div>
          </div>

          {itensOrdenados.map((it) => (
            <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 120px 120px', gap: '0.5rem', padding: '0.65rem 0', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ fontWeight: 600 }}>{it.itemNomeSnapshot}</div>
              <div style={{ textAlign: 'right' }}>{it.quantidade}</div>
              <div style={{ textAlign: 'right' }}>{fmtMoney(it.valorUnitario)}</div>
              <div style={{ textAlign: 'right', fontWeight: 700 }}>{fmtMoney(it.totalItem)}</div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <div style={{ minWidth: 320, background: 'var(--bg-secondary)', borderRadius: '0.5rem', padding: '0.85rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '0.9rem' }}>
                <span className="text-secondary">{t('proposals.subtotal')}:</span>
                <span>{fmtMoney(proposta.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '0.9rem' }}>
                <span className="text-secondary">{t('proposals.tax')}:</span>
                <span>{fmtMoney(proposta.impostosTotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '2px solid var(--border-light)', fontWeight: 800, fontSize: '1.05rem', marginTop: '4px' }}>
                <span>{t('proposals.total')}:</span>
                <span>{fmtMoney(proposta.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {proposta.observacoes && (
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1rem', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: 'var(--accent-primary)' }}>
              <Building2 size={16} />
              <span className="text-sm font-semibold uppercase tracking-wider">{t('proposals.notes')}</span>
            </div>
            <div className="text-secondary" style={{ whiteSpace: 'pre-wrap' }}>{proposta.observacoes}</div>
          </div>
        )}
      </div>
    </div>
  );
}
