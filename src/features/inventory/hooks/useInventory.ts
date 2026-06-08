import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
  Product, 
  ProductCategory, 
  InventoryTransaction, 
  NewProduct, 
  SaleParams, 
  ProductFilters 
} from '../types';

export function useInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  
  const [filters, setFilters] = useState<ProductFilters>({
    status: 'in_stock',
    category_id: null,
    search: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch products with filters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list: Product[] = await invoke('get_products', { filters });
      setProducts(list);
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const list: ProductCategory[] = await invoke('get_categories');
      setCategories(list);
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  // Fetch transactions list
  const fetchTransactions = useCallback(async (productId: number | null = null) => {
    setLoading(true);
    setError(null);
    try {
      const list: InventoryTransaction[] = await invoke('get_inventory_transactions', { 
        productId: productId || undefined 
      });
      setTransactions(list);
    } catch (err: any) {
      console.error('Failed to fetch transactions:', err);
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new category
  const addCategory = async (code: string, sortOrder: number) => {
    setError(null);
    try {
      await invoke('add_category', { code, sortOrder });
      await fetchCategories();
    } catch (err: any) {
      console.error('Failed to add category:', err);
      setError(err.toString());
      throw err;
    }
  };

  // Update category
  const updateCategory = async (id: number, code: string, sortOrder: number) => {
    setError(null);
    try {
      await invoke('update_category', { id, code, sortOrder });
      await fetchCategories();
    } catch (err: any) {
      console.error('Failed to update category:', err);
      setError(err.toString());
      throw err;
    }
  };

  // Purchase / Add new product
  const purchaseProduct = async (
    vaultDate: string,
    product: NewProduct,
    payFromVault: boolean,
    vaultPrice: number | null,
    vaultAsset: string | null
  ) => {
    setLoading(true);
    setError(null);
    try {
      await invoke('purchase_product', {
        vaultDate,
        product,
        payFromVault,
        vaultPrice,
        vaultAsset,
      });
      await fetchProducts();
    } catch (err: any) {
      console.error('Failed to purchase product:', err);
      setError(err.toString());
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sell product
  const sellProduct = async (params: SaleParams) => {
    setLoading(true);
    setError(null);
    try {
      await invoke('sell_product', { params });
      await fetchProducts();
    } catch (err: any) {
      console.error('Failed to sell product:', err);
      setError(err.toString());
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Return product
  const returnProduct = async (
    productId: number,
    vaultDate: string,
    refundAmount: number,
    refundAsset: string,
    notes: string | null
  ) => {
    setLoading(true);
    setError(null);
    try {
      await invoke('return_product', {
        productId,
        vaultDate,
        refundAmount,
        refundAsset,
        notes,
      });
      await fetchProducts();
    } catch (err: any) {
      console.error('Failed to return product:', err);
      setError(err.toString());
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Refetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Translate Category Codes to Turkish labels
  const translateCategory = (code: string) => {
    switch (code.toLowerCase()) {
      case 'ring': return 'Yüzük';
      case 'necklace': return 'Kolye';
      case 'bracelet': return 'Bilezik';
      case 'earring': return 'Küpe';
      case 'other': return 'Diğer';
      default:
        // Capitalize first letter of custom category
        return code.charAt(0).toUpperCase() + code.slice(1);
    }
  };

  const getPurityLabel = (karat: number) => {
    switch (karat) {
      case 24: return '24K (0.999)';
      case 22: return '22K (0.916)';
      case 21: return '21K (0.875)';
      case 18: return '18K (0.750)';
      case 14: return '14K (0.585)';
      default: return `${karat}K`;
    }
  };

  return {
    products,
    categories,
    transactions,
    filters,
    setFilters,
    loading,
    error,
    refreshProducts: fetchProducts,
    fetchTransactions,
    addCategory,
    updateCategory,
    purchaseProduct,
    sellProduct,
    returnProduct,
    translateCategory,
    getPurityLabel,
  };
}
