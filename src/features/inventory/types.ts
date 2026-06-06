export interface ProductCategory {
  id: number;
  code: string;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: number;
  barcode: string;
  name: string;
  category_id: number;
  category_code: string;
  karat: number;
  weight_gram: number;
  fine_gold_gram: number;
  status: 'in_stock' | 'sold' | 'returned';
  notes: string | null;
  created_at: string;
}

export interface InventoryTransaction {
  id: number;
  product_id: number;
  product_name: string;
  product_barcode: string;
  vault_date: string;
  transaction_type: 'purchase' | 'sale' | 'return' | 'adjustment' | 'transfer';
  quantity: number;
  weight_gram: number;
  karat: number;
  fine_gold_gram: number;
  price_try: number | null;
  counterparty: string | null;
  notes: string | null;
  created_at: string;
}

export interface NewProduct {
  barcode: string | null;
  name: string;
  category_id: number;
  karat: number;
  weight_gram: number;
  notes: string | null;
}

export interface SaleParams {
  product_id: number;
  vault_date: string;
  price: number;
  payment_asset: 'TRY' | 'USD' | 'EUR' | 'FINE_GOLD';
  customer_name: string | null;
  notes: string | null;
}

export interface ProductFilters {
  status: string | null;
  category_id: number | null;
  search: string | null;
}
