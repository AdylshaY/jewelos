import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { SalesReport } from '../types';

export function useSalesReport() {
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async (dateFrom?: string, dateTo?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data: SalesReport = await invoke('get_sales_report', {
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
      });
      setReport(data);
    } catch (err: any) {
      console.error('Failed to fetch sales report:', err);
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  }, []);

  // Translate category codes to Turkish labels (own copy, no cross-feature import)
  const translateCategory = (code: string) => {
    switch (code.toLowerCase()) {
      case 'ring': return 'Yüzük';
      case 'necklace': return 'Kolye';
      case 'bracelet': return 'Bilezik';
      case 'earring': return 'Küpe';
      case 'other': return 'Diğer';
      default:
        return code.charAt(0).toUpperCase() + code.slice(1);
    }
  };

  const getPurityLabel = (karat: number) => {
    switch (karat) {
      case 24: return '24K';
      case 22: return '22K';
      case 21: return '21K';
      case 18: return '18K';
      case 14: return '14K';
      default: return `${karat}K`;
    }
  };

  return {
    report,
    loading,
    error,
    fetchReport,
    translateCategory,
    getPurityLabel,
  };
}
