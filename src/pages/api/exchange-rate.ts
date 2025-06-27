import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const XE_API_KEY = process.env.XE_API_KEY;
    
    if (!XE_API_KEY) {
      console.warn('XE_API_KEY not found, using fallback rate');
      // Return fallback rate if API key is not configured
      return res.status(200).json({
        rate: 31133, // Updated realistic rate: 1 GBP = 31.133 SLE
        source: 'fallback',
        timestamp: new Date().toISOString(),
        from: 'GBP',
        to: 'SLE'
      });
    }

    // XE API endpoint for converting GBP to SLE
    const xeApiUrl = `https://xecdapi.xe.com/v1/convert_from.json/?from=GBP&to=SLE&amount=1`;
    
    console.log('🔄 Fetching exchange rate from XE API...');
    
    const response = await fetch(xeApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.XE_ACCOUNT_API}:${XE_API_KEY}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ XE API request failed:', response.status, response.statusText);
      
      // Return fallback rate on API failure
      return res.status(200).json({
        rate: 31133, // Updated realistic rate
        source: 'fallback',
        timestamp: new Date().toISOString(),
        from: 'GBP',
        to: 'SLE',
        error: `XE API error: ${response.status}`
      });
    }

    const data = await response.json();
    console.log('✅ XE API response:', data);

    // Extract rate from XE API response
    const rate = data.to?.[0]?.mid;
    
    if (!rate) {
      console.error('❌ Invalid XE API response structure:', data);
      
      // Return fallback rate on invalid response
      return res.status(200).json({
        rate: 31133, // Updated realistic rate
        source: 'fallback',
        timestamp: new Date().toISOString(),
        from: 'GBP',
        to: 'SLE',
        error: 'Invalid XE API response'
      });
    }

    // Check if the rate seems realistic for GBP to SLE
    // Current rate is approximately 1 GBP = 31.13 SLE
    if (rate < 25 || rate > 40) {
      console.warn(`⚠️ XE API returned unrealistic rate: ${rate}. Expected range: 25-40 SLE per GBP.`);
      console.log('Using fallback rate for realistic exchange calculation.');
      
      return res.status(200).json({
        rate: 31133, // Updated realistic rate
        source: 'fallback',
        timestamp: data.timestamp || new Date().toISOString(),
        from: 'GBP',
        to: 'SLE',
        error: `XE API returned unrealistic rate: ${rate}. Using fallback rate.`
      });
    }

    console.log(`💱 Current GBP to SLE rate: ${rate}`);

    return res.status(200).json({
      rate: Math.round(rate * 1000), // Convert to integer (multiply by 1000 to preserve 3 decimal places)
      source: 'xe_api',
      timestamp: data.timestamp || new Date().toISOString(),
      from: 'GBP',
      to: 'SLE'
    });

  } catch (error) {
    console.error('❌ Exchange rate fetch error:', error);
    
    // Return fallback rate on any error
    return res.status(200).json({
      rate: 31133, // Updated realistic rate
      source: 'fallback',
      timestamp: new Date().toISOString(),
      from: 'GBP',
      to: 'SLE',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
