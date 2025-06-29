import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('💱 Using fallback exchange rate (XE API disabled)');
    
    // Always return fallback rate - XE API disabled
    return res.status(200).json({
      rate: 31133, // Static rate: 1 GBP = 31.133 SLE
      source: 'fallback',
      timestamp: new Date().toISOString(),
      from: 'GBP',
      to: 'SLE'
    });

  } catch (error) {
    console.error('❌ Exchange rate error:', error);
    
    // Return fallback rate on any error
    return res.status(200).json({
      rate: 31133, // Static rate: 1 GBP = 31.133 SLE
      source: 'fallback',
      timestamp: new Date().toISOString(),
      from: 'GBP',
      to: 'SLE',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
