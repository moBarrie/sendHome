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
  const [rate, setRate] = useState<number>(31133); // Updated fallback rate: 31.133 SLE per GBP
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>('fallback');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchRate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching exchange rate...');
      
      const response = await fetch('/api/exchange-rate');
      const data: ExchangeRateData = await response.json();
      
      if (response.ok) {
        setRate(data.rate);
        setSource(data.source);
        setLastUpdated(data.timestamp);
        
        if (data.error) {
          if (data.error.includes('demo rate')) {
            setError(`XE API is in demo mode. Using realistic fallback rate.`);
          } else {
            setError(`Using fallback rate: ${data.error}`);
          }
        }
        
        console.log(`✅ Exchange rate updated: 1 GBP = ${data.rate} SLE (${data.source})`);
      } else {
        throw new Error('Failed to fetch exchange rate');
      }
    } catch (err) {
      console.error('❌ Exchange rate fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch exchange rate');
      // Keep the fallback rate on error
      setRate(31133); // Updated fallback rate
      setSource('fallback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch rate on mount
    fetchRate();
    
    // Set up interval to refresh rate every 5 minutes
    const interval = setInterval(fetchRate, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
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
