import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    let query = supabase
      .from('transfers')
      .select('*')
      .order('created_at', { ascending: false });

    // If userId is provided, filter by user
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: transfers, error } = await query;

    if (error) {
      console.error('Error fetching transfers:', error);
      return res.status(500).json({ error: 'Failed to fetch transfers' });
    }

    res.status(200).json({
      success: true,
      transfers: transfers || []
    });

  } catch (error) {
    console.error('Error in user-transfers API:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
