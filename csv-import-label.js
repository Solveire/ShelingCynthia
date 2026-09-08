(() => {
  function tidyClientImport() {
    if (typeof state === 'undefined' || state.page !== 'clients') return;

    const notionButton = document.getElementById('notionClientImportButton');
    if (notionButton) notionButton.remove();

    document.querySelectorAll('.page-head .head-actions button').forEach(button => {
      const text = (button.textContent || '').trim();
      if (text === 'Klanten importeren') {
        button.textContent = 'CSV importeren';
        button.title = 'Upload een CSV-bestand uit Notion, Excel of Google Sheets';
      }
    });
  }

  const previousRender = render;
  render = function(...args) {
    const result = previousRender.apply(this, args);
    tidyClientImport();
    return result;
  };

  tidyClientImport();
})();
