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
