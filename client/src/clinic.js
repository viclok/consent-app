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