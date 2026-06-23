(function () {
  var iframe = document.getElementById('omni-iframe');
  var status = document.getElementById('status');

  fetch('/api/embed-url')
    .then(function (res) {
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      return res.json();
    })
    .then(function (data) {
      if (!data.url) throw new Error('No URL returned');
      status.style.display = 'none';
      iframe.src = data.url;
    })
    .catch(function (err) {
      status.textContent = 'Could not load dashboard. Make sure OMNI_EMBED_SECRET is set and deploy to Vercel.';
      status.classList.add('error');
    });
})();
