export interface SalesReportEntry {
  sale_date: string;
  product_name: string;
  barcode: string;
  category_code: string;
  karat: number;
  weight_gram: number;
  fine_gold_gram: number;
  price_try: number;
  payment_asset: string | null;
  counterparty: string | null;
}

export interface MonthlySalesSummary {
  month: string;
  count: number;
  total_fine_gold: number;
  total_price_try: number;
}

export interface CategorySalesSummary {
  category_code: string;
  count: number;
  total_fine_gold: number;
}

export interface SalesReport {
  entries: SalesReportEntry[];
  monthly: MonthlySalesSummary[];
  by_category: CategorySalesSummary[];
  total_count: number;
  total_fine_gold: number;
  total_price_try: number;
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
