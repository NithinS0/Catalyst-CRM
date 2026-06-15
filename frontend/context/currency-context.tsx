'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Currency = 'INR' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number, options?: { raw?: boolean }) => string;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const EXCHANGE_RATE = 83.0; // 1 USD = 83 INR

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('INR');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('catalyst_currency');
      if (stored === 'USD' || stored === 'INR') {
        setCurrencyState(stored as Currency);
      } else {
        localStorage.setItem('catalyst_currency', 'INR');
      }
    } catch {
      // LocalStorage might not be available during SSR or private browsing
    }
  }, []);

  const setCurrency = (cur: Currency) => {
    setCurrencyState(cur);
    try {
      localStorage.setItem('catalyst_currency', cur);
    } catch {
      // LocalStorage might not be available
    }
  };

  const formatCurrency = (amount: number, options?: { raw?: boolean }) => {
    const isINR = currency === 'INR';
    
    // Determine the value to format
    let finalValue = amount;
    if (isINR && !options?.raw) {
      finalValue = amount * EXCHANGE_RATE;
    }

    if (isINR) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(finalValue);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(finalValue);
    }
  };

  const symbol = currency === 'INR' ? '₹' : '$';

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency, symbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
