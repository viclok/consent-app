document.getElementById('continueButton').addEventListener('click', () => {
    const selectedTemplate = document.getElementById('templateSelect').value;
    window.location.href = `/form.html?template=${encodeURIComponent(selectedTemplate)}`;
  });

const templateSelect = document.getElementById('templateSelect');

// Clear existing options
templateSelect.innerHTML = '';

// Fetch data from server
fetch('/api/messages')
  .then(res => res.json())
  .then(data => {
    data.forEach(entry => {
      const option = document.createElement('option');
      option.value = entry.title;
      option.textContent = entry.title;
      templateSelect.appendChild(option);
    });
  })
  .catch(err => {
    console.error('Failed to load templates:', err);
    const option = document.createElement('option');
    option.disabled = true;
    option.textContent = 'Error loading templates';
    templateSelect.appendChild(option);
  });