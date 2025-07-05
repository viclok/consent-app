fetch('/api/hello')
  .then(response => response.json())
  .then(data => {
    document.getElementById('message').textContent = data.message;
  })
  .catch(error => {
    document.getElementById('message').textContent = 'Error contacting server';
    console.error('Fetch error:', error);
  });