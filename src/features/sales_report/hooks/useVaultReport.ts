import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { VaultReport } from '../types';

export function useVaultReport() {
  const [report, setReport] = useState<VaultReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async (dateFrom?: string, dateTo?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data: VaultReport = await invoke('get_vault_report', {
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
      });
      setReport(data);
    } catch (err: any) {
      console.error('Failed to fetch vault report:', err);
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  }, []);

  // Predefined category labels translate to Turkish
  const translateCategory = (cat: string | null) => {
    if (!cat) return 'Diğer';
    switch (cat.toLowerCase()) {
      // Outflows
      case 'fatura': return 'Fatura Ödemesi';
      case 'yemek': return 'Yemek Gideri';
      case 'kira': return 'Kira Ödemesi';
      case 'maas': return 'Personel Maaşı';
      case 'avans': return 'Personel Avansı';
      case 'toptan': return 'Toptancı Ödemesi';
      case 'diger': return 'Diğer Gider';
      // Inflows
      case 'satis': return 'Satış Geliri';
      case 'ortak': return 'Ortak Sermaye';
      case 'diger_gelir': return 'Diğer Gelir';
      default:
        return cat.charAt(0).toUpperCase() + cat.slice(1);
    }
  };

  const getAssetLabel = (assetType: string) => {
    switch (assetType) {
      case 'TRY': return 'TL';
      case 'USD': return 'USD';
      case 'EUR': return 'EUR';
      case 'FINE_GOLD': return 'Has Altın';
      case 'PRODUCT': return 'Mamul Altın';
      default: return assetType;
    }
  };

  const formatCurrency = (amount: number, assetType: string) => {
    switch (assetType) {
      case 'TRY':
        return amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
      case 'USD':
        return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' $';
      case 'EUR':
        return amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
      case 'FINE_GOLD':
      case 'PRODUCT':
        return `${amount.toFixed(2)} gr`;
      default:
        return `${amount.toFixed(2)} ${assetType}`;
    }
  };

  return {
    report,
    loading,
    error,
    fetchReport,
    translateCategory,
    getAssetLabel,
    formatCurrency,
  };
}
