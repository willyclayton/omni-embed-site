const { embedSsoDashboard } = require('@omni-co/embed');

module.exports = async (req, res) => {
  const origin = req.headers.origin || req.headers.referer || '';
  const allowed =
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.includes('vercel.app');
  if (allowed) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const secret = process.env.OMNI_EMBED_SECRET;
  if (!secret) return res.status(500).json({ error: 'OMNI_EMBED_SECRET not configured' });

  try {
    const iframeUrl = await embedSsoDashboard({
      host: process.env.OMNI_HOST,
      contentId: process.env.OMNI_CONTENT_ID,
      externalId: process.env.OMNI_EXTERNAL_ID || 'mlb_user',
      name: process.env.OMNI_NAME || 'MLB Fan',
      secret,
      accessBoost: process.env.OMNI_ACCESS_BOOST !== 'false',
    });
    return res.status(200).json({ url: iframeUrl });
  } catch (err) {
    console.error('Embed URL error:', err.message);
    return res.status(500).json({ error: 'Failed to generate embed URL', detail: err.message });
  }
};
