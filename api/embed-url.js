const { embedSsoDashboard } = require('@omni-co/embed');

module.exports = async (req, res) => {
  const origin = req.headers.origin || req.headers.referer || '';
  const allowed = origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('vercel.app') || origin.includes('github.io');
  if (allowed) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const secret = process.env.OMNI_EMBED_SECRET;
  if (!secret) return res.status(500).json({ error: 'OMNI_EMBED_SECRET not configured' });

  const contentId = process.env.OMNI_CONTENT_ID || '50cf9808';
  const externalId = (req.query && req.query.externalId) || process.env.OMNI_EXTERNAL_ID || 'mlb_user';
  const name = (req.query && req.query.name) || process.env.OMNI_NAME || 'MLB Fan';
  const team = req.query && req.query.team;
  const accessBoost = process.env.OMNI_ACCESS_BOOST !== 'false';

  try {
    const base = { contentId, externalId, name, secret, accessBoost };
    if (team) base.userAttributes = { Team: team };

    const opts = process.env.OMNI_HOST
      ? { ...base, host: process.env.OMNI_HOST }
      : { ...base, organizationName: process.env.OMNI_ORGANIZATION_NAME || 'willclayton' };

    const iframeUrl = await embedSsoDashboard(opts);
    return res.status(200).json({ url: iframeUrl });
  } catch (err) {
    console.error('Omni embed URL error:', err.message);
    return res.status(500).json({ error: 'Failed to generate embed URL', detail: err.message });
  }
};
