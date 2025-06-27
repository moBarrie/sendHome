import { NextApiRequest, NextApiResponse } from 'next';
import { fetchMonimePayouts } from '@/lib/monime-status';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get query parameters
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    console.log(`🔍 Fetching Monime payouts (limit: ${limit}, offset: ${offset})`);

    // Fetch payouts from Monime
    const payouts = await fetchMonimePayouts(limit, offset);

    if (!payouts.success || !payouts.result) {
      console.error('❌ Failed to fetch Monime payouts:', payouts.error);
      return res.status(400).json({
        error: 'Failed to fetch payouts',
        details: payouts.error
      });
    }

    console.log(`✅ Successfully fetched ${payouts.result.length} payouts`);

    // Return the payouts data
    res.status(200).json({
      success: true,
      data: payouts.result || [],
      pagination: payouts.pagination || { count: 0, total: null }
    });

  } catch (error) {
    console.error('❌ Error in monime-payouts API:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
