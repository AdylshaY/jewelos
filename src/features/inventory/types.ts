// ==========================================
// Product Catalog (template/definition)
// ==========================================

export interface ProductCategory {
  id: number;
  code: string;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: number;
  name: string;
  category_id: number;
  category_code: string;
  karat: number;
  description: string | null;
  is_active: boolean;
  stock_count: number;
}

export interface NewProduct {
  name: string;
  category_id: number;
  karat: number;
  description: string | null;
}

// ==========================================
// Stock Items (individual physical pieces)
// ==========================================

export interface StockItem {
  id: number;
  product_id: number;
  product_name: string;
  category_code: string;
  barcode: string;
  karat: number;
  weight_gram: number;
  fine_gold_gram: number;
  status: 'in_stock' | 'sold' | 'returned';
  sold_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface NewStockEntry {
  product_id: number;
  weight_gram: number;
  barcode: string | null;
  quantity: number;
  notes: string | null;
}

export interface StockFilters {
  status: string | null;
  category_id: number | null;
  product_id: number | null;
  search: string | null;
}

// ==========================================
// Transactions
// ==========================================

export interface SaleParams {
  stock_item_id: number;
  vault_date: string;
  price: number;
  payment_asset: 'TRY' | 'USD' | 'EUR' | 'FINE_GOLD';
  customer_name: string | null;
  notes: string | null;
}

export interface InventoryTransaction {
  id: number;
  stock_item_id: number;
  product_name: string;
  product_barcode: string;
  vault_date: string;
  transaction_type: 'purchase' | 'sale' | 'return' | 'adjustment' | 'transfer';
  quantity: number;
  weight_gram: number;
  karat: number;
  fine_gold_gram: number;
  price_try: number | null;
  payment_asset: string | null;
  counterparty: string | null;
  notes: string | null;
  created_at: string;
}
