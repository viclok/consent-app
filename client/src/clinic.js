  document.getElementById('entry-form').addEventListener('submit', async (e) => {
    e.preventDefault(); // ❌ Prevent default form submit behavior

    const form = e.target;
    const formData = new FormData(form); // Automatically grabs all form fields, including file

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        document.getElementById('status').textContent = 'Submitted successfully!';
        form.reset();
      } else {
        document.getElementById('status').textContent = 'Submission failed.';
      }
    } catch (err) {
      console.error(err);
      document.getElementById('status').textContent = 'Error submitting form.';
    }
  });

  document.getElementById('downloadTemplate').addEventListener('click', () => {
    fetch('/api/templates/form_template.pdf')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'consent-form-template.pdf'; // filename for client
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(err => {
        alert('Failed to download template: ' + err.message);
      });
  });