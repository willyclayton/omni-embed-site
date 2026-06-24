const { embedSsoDashboard } = require('@omni-co/embed');

module.exports = async (req, res) => {
  const origin = req.headers.origin || req.headers.referer || '';
  const allowed = origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('vercel.app');
  if (allowed) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const secret = process.env.OMNI_EMBED_SECRET;
  if (!secret) return res.status(500).json({ error: 'OMNI_EMBED_SECRET not configured' });

  const externalId = (req.query && req.query.externalId) || process.env.OMNI_EXTERNAL_ID || 'mlb_user';
  const name      = (req.query && req.query.name)       || process.env.OMNI_NAME          || 'MLB Fan';
  const team      = (req.query && req.query.team)       || 'Atlanta Braves';

  try {
    const opts = {
      host:        process.env.OMNI_HOST,
      contentId:   process.env.OMNI_CONTENT_ID || '50cf9808',
      externalId,
      name,
      secret,
      accessBoost: process.env.OMNI_ACCESS_BOOST !== 'false',
    };

    if (team) opts.userAttributes = { Team: team };

    const iframeUrl = await embedSsoDashboard(opts);
    return res.status(200).json({ url: iframeUrl });
  } catch (err) {
    console.error('Embed URL error:', err.message);
    return res.status(500).json({ error: 'Failed to generate embed URL', detail: err.message });
  }
};
