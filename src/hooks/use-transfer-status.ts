"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export function useTransferStatus(transferId: string | null) {
  const [status, setStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!transferId) return;

    const checkStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('transfers')
          .select('status, payout_id')
          .eq('id', transferId)
          .single();

        if (error) throw error;
        
        if (data?.status !== status) {
          setStatus(data.status);
          if (data.status === 'completed') {
            toast({
              title: 'Transfer Completed',
              description: 'Your money transfer has been completed successfully.',
            });
          } else if (data.status === 'failed') {
            toast({
              title: 'Transfer Failed',
              description: 'There was an issue with your transfer. Please contact support.',
              variant: 'destructive',
            });
          }
        }
      } catch (err) {
        console.error('Error checking transfer status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Check immediately
    void checkStatus();

    // Then check every 30 seconds
    const interval = setInterval(checkStatus, 30000);

    return () => clearInterval(interval);
  }, [transferId, status]);

  return { status, isLoading };
}
