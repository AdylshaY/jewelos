import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Product,
  ProductCategory,
  StockItem,
  NewProduct,
  NewStockEntry,
  SaleParams,
  StockFilters,
} from '../types';

export function useInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  const [filters, setFilters] = useState<StockFilters>({
    status: 'in_stock',
    category_id: null,
    product_id: null,
    search: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch product catalog
  const fetchProducts = useCallback(async () => {
    try {
      const list: Product[] = await invoke('get_products');
      setProducts(list);
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
    }
  }, []);

  // Fetch stock items with filters
  const fetchStockItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list: StockItem[] = await invoke('get_stock_items', { filters });
      setStockItems(list);
    } catch (err: any) {
      console.error('Failed to fetch stock items:', err);
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

  // Add new product to catalog
  const addProduct = async (product: NewProduct): Promise<number> => {
    setError(null);
    try {
      const id: number = await invoke('add_product', { product });
      await fetchProducts();
      return id;
    } catch (err: any) {
      console.error('Failed to add product:', err);
      setError(err.toString());
      throw err;
    }
  };

  // Update product catalog entry
  const updateProduct = async (id: number, name: string, description: string | null) => {
    setError(null);
    try {
      await invoke('update_product', { id, name, description });
      await fetchProducts();
    } catch (err: any) {
      console.error('Failed to update product:', err);
      setError(err.toString());
      throw err;
    }
  };

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

  // Purchase stock (batch capable)
  const purchaseStock = async (
    vaultDate: string,
    entry: NewStockEntry,
    payFromVault: boolean,
    vaultPrice: number | null,
    vaultAsset: string | null,
  ) => {
    setLoading(true);
    setError(null);
    try {
      await invoke('purchase_stock', {
        vaultDate,
        entry,
        payFromVault,
        vaultPrice,
        vaultAsset,
      });
      await fetchStockItems();
      await fetchProducts();
    } catch (err: any) {
      console.error('Failed to purchase stock:', err);
      setError(err.toString());
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sell stock item
  const sellStockItem = async (params: SaleParams) => {
    setLoading(true);
    setError(null);
    try {
      await invoke('sell_stock_item', { params });
      await fetchStockItems();
      await fetchProducts();
    } catch (err: any) {
      console.error('Failed to sell stock item:', err);
      setError(err.toString());
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Return stock item
  const returnStockItem = async (
    stockItemId: number,
    vaultDate: string,
    refundAmount: number,
    refundAsset: string,
    notes: string | null,
  ) => {
    setLoading(true);
    setError(null);
    try {
      await invoke('return_stock_item', {
        stockItemId,
        vaultDate,
        refundAmount,
        refundAsset,
        notes,
      });
      await fetchStockItems();
      await fetchProducts();
    } catch (err: any) {
      console.error('Failed to return stock item:', err);
      setError(err.toString());
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update stock item
  const updateStockItem = async (
    stockItemId: number,
    weightGram: number,
    barcode: string,
    notes: string | null,
    vaultDate: string,
  ) => {
    setLoading(true);
    setError(null);
    try {
      await invoke('update_stock_item', {
        stockItemId,
        weightGram,
        barcode,
        notes,
        vaultDate,
      });
      await fetchStockItems();
      await fetchProducts();
    } catch (err: any) {
      console.error('Failed to update stock item:', err);
      setError(err.toString());
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete stock item
  const deleteStockItem = async (stockItemId: number, vaultDate: string) => {
    setLoading(true);
    setError(null);
    try {
      await invoke('delete_stock_item', {
        stockItemId,
        vaultDate,
      });
      await fetchStockItems();
      await fetchProducts();
    } catch (err: any) {
      console.error('Failed to delete stock item:', err);
      setError(err.toString());
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  // Refetch stock items when filters change
  useEffect(() => {
    fetchStockItems();
  }, [fetchStockItems]);

  // Translate Category Codes to Turkish labels
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
    stockItems,
    categories,
    filters,
    setFilters,
    loading,
    error,
    refreshProducts: fetchProducts,
    refreshStockItems: fetchStockItems,
    addProduct,
    updateProduct,
    addCategory,
    updateCategory,
    purchaseStock,
    sellStockItem,
    returnStockItem,
    updateStockItem,
    deleteStockItem,
    translateCategory,
    getPurityLabel,
  };
}
