document.getElementById('analyzeBtn').addEventListener('click', async () => {
  const username = document.getElementById('usernameInput').value;
  const linksRaw = document.getElementById('linksInput').value;
  const timezone = document.getElementById('timezoneSelect').value;
  const links = linksRaw.split('\n').filter(l => l.trim() !== '');
  const output = document.getElementById('output');

  if (links.length === 0) {
    output.textContent = 'Please paste at least one link.';
    return;
  }

  output.textContent = 'Analyzing...';

  const response = await fetch('https://your-render-backend.onrender.com/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, links, timezone })
  });

  const data = await response.json();
  output.textContent = JSON.stringify(data.profile, null, 2);
});
