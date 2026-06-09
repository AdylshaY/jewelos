import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Customer, CustomerDetails, NewCustomer, NewCustomerTransaction } from '../types';

export function useCRM() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeCustomerDetails, setActiveCustomerDetails] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list: Customer[] = await invoke('get_customers');
      setCustomers(list);
    } catch (err: any) {
      console.error('Failed to fetch customers:', err);
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomerDetails = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const details: CustomerDetails = await invoke('get_customer_details', { id });
      setActiveCustomerDetails(details);
      return details;
    } catch (err: any) {
      console.error('Failed to fetch customer details:', err);
      setError(err.toString());
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addCustomer = async (customer: NewCustomer): Promise<number> => {
    setLoading(true);
    setError(null);
    try {
      const id: number = await invoke('add_customer', { customer });
      await fetchCustomers();
      return id;
    } catch (err: any) {
      console.error('Failed to add customer:', err);
      setError(err.toString());
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = async (id: number, customer: NewCustomer): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await invoke('update_customer', { id, customer });
      await fetchCustomers();
      if (activeCustomerDetails && activeCustomerDetails.customer.id === id) {
        await fetchCustomerDetails(id);
      }
    } catch (err: any) {
      console.error('Failed to update customer:', err);
      setError(err.toString());
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (id: number): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await invoke('delete_customer', { id });
      await fetchCustomers();
      if (activeCustomerDetails && activeCustomerDetails.customer.id === id) {
        setActiveCustomerDetails(null);
      }
    } catch (err: any) {
      console.error('Failed to delete customer:', err);
      setError(err.toString());
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addCustomerTransaction = async (txParam: NewCustomerTransaction): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await invoke('add_customer_transaction', { txParam });
      // Refresh current details if active
      await fetchCustomerDetails(txParam.customer_id);
      await fetchCustomers();
    } catch (err: any) {
      console.error('Failed to add customer transaction:', err);
      setError(err.toString());
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    customers,
    activeCustomerDetails,
    loading,
    error,
    setError,
    fetchCustomers,
    fetchCustomerDetails,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addCustomerTransaction,
  };
}
