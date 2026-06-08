import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  VaultStatus,
  DailySummary,
  NewExchangeRates,
  OpeningBalances,
  NewAssetEntry,
  ExchangeRatesSummary,
} from '../types';

export const getLocalDateString = (date = new Date()) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split('T')[0];
};

export function useDailyVault() {
  const [selectedDate, setSelectedDate] =
    useState<string>(getLocalDateString());
  const [vaultStatus, setVaultStatus] = useState<VaultStatus | null>(null);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [lastRates, setLastRates] = useState<ExchangeRatesSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch status and summary for the selected date
  const fetchVaultData = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get vault status
      const status: VaultStatus | null = await invoke('get_vault_status', {
        date,
      });
      setVaultStatus(status);

      if (status) {
        // 2. If vault exists, get daily summary
        const dailySummary: DailySummary = await invoke('get_daily_summary', {
          date,
        });
        setSummary(dailySummary);
      } else {
        setSummary(null);
        // If no vault exists, fetch the last known rates for suggestion
        const lastKnownRates: ExchangeRatesSummary | null = await invoke(
          'get_last_exchange_rates',
        );
        setLastRates(lastKnownRates);
      }
    } catch (err: any) {
      console.error('Failed to fetch vault data:', err);
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  }, []);

  // Open a new vault
  const openVault = async (
    date: string,
    rates: NewExchangeRates,
    openingBalances: OpeningBalances | null,
  ) => {
    setLoading(true);
    setError(null);
    try {
      await invoke('open_daily_vault', {
        date,
        rates,
        openingBalances: openingBalances || undefined,
      });
      await fetchVaultData(date);
    } catch (err: any) {
      console.error('Failed to open vault:', err);
      setError(err.toString());
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Add an asset transaction
  const addTransaction = async (entry: Omit<NewAssetEntry, 'vault_date'>) => {
    setLoading(true);
    setError(null);
    try {
      const fullEntry: NewAssetEntry = {
        ...entry,
        vault_date: selectedDate,
      };
      await invoke('add_asset_transaction', { entry: fullEntry });
      await fetchVaultData(selectedDate);
    } catch (err: any) {
      console.error('Failed to add transaction:', err);
      setError(err.toString());
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Close the daily vault
  const closeVault = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      await invoke('close_daily_vault', { date });
      await fetchVaultData(date);
    } catch (err: any) {
      console.error('Failed to close vault:', err);
      setError(err.toString());
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Trigger load on selected date change
  useEffect(() => {
    fetchVaultData(selectedDate);
  }, [selectedDate, fetchVaultData]);

  // Format Helpers
  const formatCurrency = (amount: number, assetType: string) => {
    switch (assetType) {
      case 'TRY':
        return amount.toLocaleString('tr-TR', {
          style: 'currency',
          currency: 'TRY',
        });
      case 'USD':
        return amount.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        });
      case 'EUR':
        return amount.toLocaleString('de-DE', {
          style: 'currency',
          currency: 'EUR',
        });
      case 'FINE_GOLD':
      case 'PRODUCT':
        return `${amount.toFixed(2)} g`;
      default:
        return `${amount.toFixed(2)}`;
    }
  };

  const getAssetLabel = (assetType: string) => {
    switch (assetType) {
      case 'TRY':
        return 'Türk Lirası';
      case 'USD':
        return 'Amerikan Doları';
      case 'EUR':
        return 'Euro';
      case 'FINE_GOLD':
        return 'Has Altın (24K)';
      case 'PRODUCT':
        return 'Ürün Envanteri (Has)';
      default:
        return assetType;
    }
  };

  const handlePrevDay = () => {
    const parts = selectedDate.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    d.setDate(d.getDate() - 1);
    setSelectedDate(getLocalDateString(d));
  };

  const handleNextDay = () => {
    const parts = selectedDate.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    d.setDate(d.getDate() + 1);
    setSelectedDate(getLocalDateString(d));
  };

  const handleGoToToday = () => {
    setSelectedDate(getLocalDateString(new Date()));
  };

  return {
    selectedDate,
    setSelectedDate,
    vaultStatus,
    summary,
    lastRates,
    loading,
    error,
    refresh: () => fetchVaultData(selectedDate),
    openVault,
    addTransaction,
    closeVault,
    formatCurrency,
    getAssetLabel,
    handlePrevDay,
    handleNextDay,
    handleGoToToday,
  };
}
