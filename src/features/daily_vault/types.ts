export interface ExchangeRatesSummary {
  usd_buy: number;
  usd_sell: number;
  eur_buy: number;
  eur_sell: number;
  gold_buy: number;
  gold_sell: number;
}

export interface VaultStatus {
  date: string;
  status: 'open' | 'closed';
  notes: string | null;
  rates: ExchangeRatesSummary | null;
}

export interface OpeningBalances {
  try_amount: number;
  usd_amount: number;
  eur_amount: number;
  gold_amount: number;
  product_amount: number; // in fine gold grams
}

export interface NewExchangeRates {
  usd_buy: number;
  usd_sell: number;
  eur_buy: number;
  eur_sell: number;
  gold_buy: number;
  gold_sell: number;
}

export interface NewAssetEntry {
  vault_date: string;
  asset_type: 'TRY' | 'USD' | 'EUR' | 'FINE_GOLD' | 'PRODUCT';
  direction: 'in' | 'out';
  amount: number;
  description: string | null;
  category: string | null;
}

export interface AssetEntrySummary {
  id: number;
  asset_type: 'TRY' | 'USD' | 'EUR' | 'FINE_GOLD' | 'PRODUCT';
  direction: 'in' | 'out';
  amount: number;
  fine_gold_gram: number;
  description: string | null;
  category: string | null;
  created_at: string;
}

export interface AssetBalance {
  asset_type: 'TRY' | 'USD' | 'EUR' | 'FINE_GOLD' | 'PRODUCT';
  opening_balance: number;
  in_amount: number;
  out_amount: number;
  closing_balance: number;
  fine_gold_value: number;
}

export interface DailySummary {
  date: string;
  status: 'open' | 'closed';
  rates: ExchangeRatesSummary | null;
  balances: AssetBalance[];
  transactions: AssetEntrySummary[];
  total_fine_gold: number;
}

export interface MonthlyVaultSummary {
  month: string;
  total_in: number;
  total_out: number;
}

export interface CategoryVaultSummary {
  category: string;
  direction: 'in' | 'out';
  total_amount: number;
  fine_gold_gram: number;
  count: number;
}

export interface VaultReportEntry {
  id: number;
  vault_date: string;
  asset_type: 'TRY' | 'USD' | 'EUR' | 'FINE_GOLD' | 'PRODUCT';
  direction: 'in' | 'out';
  amount: number;
  fine_gold_gram: number;
  description: string | null;
  category: string | null;
  created_at: string;
}

export interface VaultReport {
  entries: VaultReportEntry[];
  monthly: MonthlyVaultSummary[];
  by_category: CategoryVaultSummary[];
  total_in_gold: number;
  total_out_gold: number;
}
