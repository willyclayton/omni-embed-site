document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
  anchor.addEventListener('click', function (e) {
    var href = this.getAttribute('href');
    if (href === '#') return;
    e.preventDefault();
    var target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

(function () {
  var iframe = document.getElementById('omni-embed-iframe');
  var statusEl = document.getElementById('embed-status');
  if (!iframe) return;

  var apiUrl = (typeof window.OMNI_EMBED_API !== 'undefined' && window.OMNI_EMBED_API)
    ? window.OMNI_EMBED_API
    : (iframe.getAttribute('data-embed-api') || '/api/embed-url');

  var demoUser = null;
  try {
    var stored = sessionStorage.getItem('demoUser');
    if (stored) demoUser = JSON.parse(stored);
  } catch (e) {}

  var viewingAsEl = document.getElementById('viewing-as');
  if (viewingAsEl) {
    viewingAsEl.textContent = demoUser && demoUser.name ? 'Viewing as: ' + demoUser.name : '';
  }

  var switchLabel = demoUser && demoUser.name ? 'Switch from ' + demoUser.name : 'Switch team';
  document.querySelectorAll('.switch-team-link').forEach(function (el) {
    el.textContent = switchLabel;
  });

  if (demoUser && demoUser.externalId && demoUser.name) {
    var sep = apiUrl.indexOf('?') >= 0 ? '&' : '?';
    apiUrl += sep + 'externalId=' + encodeURIComponent(demoUser.externalId) + '&name=' + encodeURIComponent(demoUser.name);
    apiUrl += '&team=' + encodeURIComponent(demoUser.name);
  }

  fetch(apiUrl)
    .then(function (res) {
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      return res.json();
    })
    .then(function (data) {
      if (data.url) {
        iframe.src = data.url;
      } else {
        throw new Error('No URL in response');
      }
    })
    .catch(function (err) {
      if (statusEl) {
        statusEl.textContent = 'Embed could not load. Deploy to Vercel and set OMNI_EMBED_SECRET (see README).';
        statusEl.classList.add('embed-status--error');
      }
    });
})();
