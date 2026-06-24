(function () {
  var iframe = document.getElementById('omni-embed-iframe');
  var statusEl = document.getElementById('embed-status');
  if (!iframe) return;

  // Read team selection from login page
  var demoUser = null;
  try {
    var stored = sessionStorage.getItem('demoUser');
    if (stored) demoUser = JSON.parse(stored);
  } catch (e) {}

  // Update header badge and switch label
  var viewingAsEl = document.getElementById('viewing-as');
  if (viewingAsEl) {
    viewingAsEl.textContent = demoUser && demoUser.name ? 'Viewing as: ' + demoUser.name : '';
  }
  var switchLabel = demoUser && demoUser.name ? 'Switch from ' + demoUser.name : 'Switch team';
  document.querySelectorAll('.switch-team-link').forEach(function (el) {
    el.textContent = switchLabel;
  });

  // Build API URL — pass team so the server signs with userAttributes
  var apiUrl = iframe.getAttribute('data-embed-api') || '/api/embed-url';
  if (demoUser && demoUser.externalId && demoUser.name) {
    apiUrl += '?externalId=' + encodeURIComponent(demoUser.externalId)
            + '&name=' + encodeURIComponent(demoUser.name)
            + '&team=' + encodeURIComponent(demoUser.name);
  }

  fetch(apiUrl)
    .then(function (res) {
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      return res.json();
    })
    .then(function (data) {
      if (!data.url) throw new Error('No URL in response');
      iframe.src = data.url;
    })
    .catch(function () {
      if (statusEl) {
        statusEl.textContent = 'Dashboard could not load. Check OMNI_EMBED_SECRET in Vercel.';
        statusEl.classList.add('embed-status--error');
      }
    });
})();
