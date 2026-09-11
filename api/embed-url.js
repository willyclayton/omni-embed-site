const { embedSsoDashboard } = require('@omni-co/embed');

/** Omni document theme IDs keyed by MLB team name. */
const TEAM_THEMES = {
  'Atlanta Braves': '356ac4f3-ca63-48f0-94e2-38526aaac514',
  'Miami Marlins': '6a9972af-056e-4536-baef-6a6009e7aa60',
  'New York Mets': 'dfa097e3-f5af-4d9d-87c7-37f0af9aab3c',
  'Philadelphia Phillies': '3f08bc04-4317-46ff-aa31-997acc2ea431',
};

/** Team logo image URLs for dashboard Markdown tiles. */
const TEAM_LOGOS = {
  'Atlanta Braves': 'https://1000logos.net/wp-content/uploads/2017/08/Atlanta-Braves-logo.jpg',
};

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
      contentId:   process.env.OMNI_CONTENT_ID || '6d9b5153',
      externalId,
      name,
      secret,
      accessBoost: process.env.OMNI_ACCESS_BOOST !== 'false',
    };

    if (team) {
      opts.userAttributes = { Team: team };
      const logoUrl = TEAM_LOGOS[team];
      if (logoUrl) opts.userAttributes.logo_url = logoUrl;
    }

    const themeId = TEAM_THEMES[team];
    if (themeId) opts.customThemeId = themeId;

    const iframeUrl = await embedSsoDashboard(opts);
    return res.status(200).json({ url: iframeUrl });
  } catch (err) {
    console.error('Embed URL error:', err.message);
    return res.status(500).json({ error: 'Failed to generate embed URL', detail: err.message });
  }
};
