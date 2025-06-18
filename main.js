document.getElementById('continueButton').addEventListener('click', () => {
    const selectedTemplate = document.getElementById('templateSelect').value;
    window.location.href = `/form.html?template=${encodeURIComponent(selectedTemplate)}`;
  });