export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  balance_try: number;
  balance_usd: number;
  balance_eur: number;
  balance_gold: number;
  balance_consolidated_gold: number;
}

export interface CustomerTransaction {
  id: number;
  customer_id: number;
  vault_date: string;
  transaction_type: 'sale_debt' | 'payment' | 'deposit' | 'withdrawal' | 'adjustment';
  direction: 'credit' | 'debt';
  asset_type: 'TRY' | 'USD' | 'EUR' | 'FINE_GOLD';
  amount: number;
  fine_gold_gram: number;
  notes: string | null;
  inventory_transaction_id: number | null;
  created_at: string;
}

export interface CustomerDetails {
  customer: Customer;
  transactions: CustomerTransaction[];
}

export interface NewCustomer {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
}

export interface NewCustomerTransaction {
  customer_id: number;
  vault_date: string;
  transaction_type: 'payment' | 'deposit' | 'withdrawal' | 'adjustment';
  direction: 'credit' | 'debt';
  asset_type: 'TRY' | 'USD' | 'EUR' | 'FINE_GOLD';
  amount: number;
  notes: string | null;
  pay_from_vault: boolean;
}
