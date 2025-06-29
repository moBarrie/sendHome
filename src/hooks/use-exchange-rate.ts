import { useState, useEffect } from 'react';

interface ExchangeRateData {
  rate: number;
  source: 'xe_api' | 'fallback';
  timestamp: string;
  from: string;
  to: string;
  error?: string;
}

interface UseExchangeRateReturn {
  rate: number;
  loading: boolean;
  error: string | null;
  source: string;
  lastUpdated: string | null;
  refresh: () => void;
}

export function useExchangeRate(): UseExchangeRateReturn {
  const [rate, setRate] = useState<number>(31133); // Static fallback rate: 31.133 SLE per GBP
  const [loading, setLoading] = useState<boolean>(false); // No loading needed for static rate
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>('fallback');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchRate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('� Using static exchange rate (XE API disabled)');
      
      const response = await fetch('/api/exchange-rate');
      const data: ExchangeRateData = await response.json();
      
      if (response.ok) {
        setRate(data.rate);
        setSource(data.source);
        setLastUpdated(data.timestamp);
        
        console.log(`✅ Static exchange rate: 1 GBP = ${data.rate / 1000} SLE (${data.source})`);
      } else {
        throw new Error('Failed to fetch exchange rate');
      }
    } catch (err) {
      console.error('❌ Exchange rate fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch exchange rate');
      // Keep the fallback rate on error
      setRate(31133); // Static fallback rate
      setSource('fallback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch rate on mount only (static rate, no need for intervals)
    fetchRate();
  }, []);

  return {
    rate,
    loading,
    error,
    source,
    lastUpdated,
    refresh: fetchRate
  };
}
