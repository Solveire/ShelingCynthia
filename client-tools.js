(() => {
  const API_BASE = 'https://shelingcynthia-api-production.up.railway.app';
  const MAX_FILE_BYTES = 25 * 1024 * 1024;
  const ACCEPTED_EXTENSIONS = ['pdf','doc','docx','xls','xlsx','csv','txt','jpg','jpeg','png','webp','gif','ppt','pptx','zip'];
  const PREVIEWABLE = new Set(['application/pdf','image/jpeg','image/png','image/webp','image/gif']);
  let fileRequestVersion = 0;

  function authHeaders(extra = {}) {
    const token = window.ShelingAuth?.getToken?.() || '';
    return { ...extra, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  }

  async function api(path, options = {}) {
    const res = await fetch(API_BASE + path, { ...options, headers: authHeaders(options.headers || {}) });
    if (res.status === 401) {
      window.ShelingAuth?.logout?.();
      throw new Error('Je sessie is verlopen. Log opnieuw in.');
    }
    if (!res.ok) {
      let message = '';
      try { message = (await res.json()).error || ''; } catch { message = await res.text().catch(() => ''); }
      throw new Error(message || 'De bestandsactie is niet gelukt.');
    }
    if (res.status === 204) return null;
    return res;
  }

  function bytesLabel(value) {
    const bytes = Number(value || 0);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
  }

  function dateLabel(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function extension(name = '') { return String(name).split('.').pop().toLowerCase(); }
  function fileBadge(name = '') {
    const ext = extension(name);
    if (['jpg','jpeg','png','webp','gif'].includes(ext)) return 'IMG';
    if (ext === 'pdf') return 'PDF';
    if (['doc','docx'].includes(ext)) return 'DOC';
    if (['xls','xlsx','csv'].includes(ext)) return 'XLS';
    if (['ppt','pptx'].includes(ext)) return 'PPT';
    if (ext === 'zip') return 'ZIP';
    return 'FILE';
  }

  function clientFilesTab(c) {
    return `<div class="client-body"><div class="client-main">
      <div class="services-heading client-files-heading">
        <div><h2>Bestanden</h2><p>Bewaar documenten, briefings, contracten en andere klantbestanden veilig bij dit dossier.</p></div>
        <button class="outline" type="button" id="clientFileChoose">+ Bestand uploaden</button>
      </div>
      <div class="client-files-card">
        <div class="client-files-toolbar">
          <label><span>Categorie</span><select id="clientFileCategory"><option>Overig</option><option>Contract</option><option>Briefing</option><option>Content</option><option>Factuur</option><option>Huisstijl</option></select></label>
          <small>PDF, Word, Excel, PowerPoint, afbeeldingen, tekst, CSV of ZIP · max. 25 MB per bestand.</small>
        </div>
        <label class="client-file-drop" id="clientFileDrop" for="clientFileInput">
          <span class="client-file-drop-icon">⇧</span>
          <strong>Sleep bestanden hierheen</strong>
          <small>of klik om bestanden te kiezen</small>
          <input id="clientFileInput" type="file" multiple hidden accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.webp,.gif,.ppt,.pptx,.zip">
        </label>
        <div class="client-file-progress" id="clientFileProgress" hidden></div>
        <div class="client-file-list" id="clientFileList"><div class="empty">Bestanden laden…</div></div>
      </div>
    </div>${rightPanel(c)}</div>`;
  }

  const originalClientTabBody = clientTabBody;
  clientTabBody = function(c) {
    if (state.tab === 'files') return clientFilesTab(c);
    return originalClientTabBody(c);
  };

  async function loadClientFiles() {
    if (state.page !== 'client' || state.tab !== 'files' || !state.clientId) return;
    const list = document.getElementById('clientFileList');
    if (!list) return;
    const requestVersion = ++fileRequestVersion;
    try {
      const qs = new URLSearchParams({ workspace_id: state.workspace, client_id: state.clientId });
      const res = await api(`/api/files?${qs}`);
      const files = await res.json();
      if (requestVersion !== fileRequestVersion || !document.getElementById('clientFileList')) return;
      renderClientFiles(files);
    } catch (error) {
      if (requestVersion !== fileRequestVersion || !document.getElementById('clientFileList')) return;
      list.innerHTML = `<div class="client-files-error"><strong>Bestanden konden niet worden geladen.</strong><span>${esc(error.message)}</span></div>`;
    }
  }

  function renderClientFiles(files) {
    const list = document.getElementById('clientFileList');
    if (!list) return;
    if (!files.length) {
      list.innerHTML = '<div class="client-files-empty"><span>⌑</span><strong>Nog geen bestanden</strong><small>Upload hier bijvoorbeeld een contract, briefing, factuur of huisstijlbestand.</small></div>';
      return;
    }
    list.innerHTML = files.map(file => `<div class="client-file-row">
      <div class="client-file-type">${fileBadge(file.file_name)}</div>
      <div class="client-file-copy"><strong title="${esc(file.file_name)}">${esc(file.file_name)}</strong><small>${esc(file.category || 'Overig')} · ${bytesLabel(file.size_bytes)} · ${dateLabel(file.created_at)}</small></div>
      <div class="client-file-actions">
        ${PREVIEWABLE.has(file.content_type) ? `<button class="ghost" type="button" onclick="window.ClientFiles.open('${esc(file.id)}','${esc(file.file_name)}','${esc(file.content_type)}')">Openen</button>` : ''}
        <button class="outline" type="button" onclick="window.ClientFiles.download('${esc(file.id)}','${esc(file.file_name)}')">Download</button>
        <button class="ghost client-file-delete" type="button" onclick="window.ClientFiles.remove('${esc(file.id)}','${esc(file.file_name)}')">Verwijder</button>
      </div>
    </div>`).join('');
  }

  async function uploadFiles(fileList) {
    const files = [...(fileList || [])];
    if (!files.length || !state.clientId) return;
    const category = document.getElementById('clientFileCategory')?.value || 'Overig';
    const progress = document.getElementById('clientFileProgress');
    const valid = [];
    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) { toast(`${file.name} is groter dan 25 MB`); continue; }
      if (!ACCEPTED_EXTENSIONS.includes(extension(file.name))) { toast(`${file.name}: bestandstype niet ondersteund`); continue; }
      valid.push(file);
    }
    if (!valid.length) return;

    if (progress) { progress.hidden = false; progress.textContent = valid.length === 1 ? 'Bestand uploaden…' : `0 van ${valid.length} bestanden geüpload…`; }
    let done = 0;
    try {
      for (const file of valid) {
        const qs = new URLSearchParams({ workspace_id: state.workspace, client_id: state.clientId, name: file.name, category });
        await api(`/api/files/upload?${qs}`, {
          method: 'POST',
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
          body: file
        });
        done += 1;
        if (progress) progress.textContent = valid.length === 1 ? 'Upload voltooid' : `${done} van ${valid.length} bestanden geüpload…`;
      }
      toast(done === 1 ? 'Bestand geüpload' : `${done} bestanden geüpload`);
      await loadClientFiles();
    } catch (error) {
      toast(error.message);
      await loadClientFiles();
    } finally {
      if (progress) setTimeout(() => { if (progress) progress.hidden = true; }, 900);
      const input = document.getElementById('clientFileInput');
      if (input) input.value = '';
    }
  }

  function wireClientFiles() {
    if (state.page !== 'client' || state.tab !== 'files') return;
    const input = document.getElementById('clientFileInput');
    const choose = document.getElementById('clientFileChoose');
    const drop = document.getElementById('clientFileDrop');
    if (!input || input.dataset.wired) return;
    input.dataset.wired = '1';
    input.addEventListener('change', () => uploadFiles(input.files));
    choose?.addEventListener('click', () => input.click());
    if (drop) {
      ['dragenter','dragover'].forEach(type => drop.addEventListener(type, e => { e.preventDefault(); drop.classList.add('dragging'); }));
      ['dragleave','drop'].forEach(type => drop.addEventListener(type, e => { e.preventDefault(); drop.classList.remove('dragging'); }));
      drop.addEventListener('drop', e => uploadFiles(e.dataTransfer?.files));
    }
    loadClientFiles();
  }

  async function fetchFileBlob(id) {
    const res = await api(`/api/files/${encodeURIComponent(id)}/download`);
    return res.blob();
  }

  async function downloadFile(id, name) {
    try {
      const blob = await fetchFileBlob(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name || 'bestand';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (error) { toast(error.message); }
  }

  async function openFile(id, name, contentType) {
    const win = window.open('', '_blank');
    try {
      const blob = await fetchFileBlob(id);
      const url = URL.createObjectURL(new Blob([blob], { type: contentType || blob.type }));
      if (win) win.location = url;
      else {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      if (win) win.close();
      toast(error.message);
    }
  }

  async function removeFile(id, name) {
    if (!confirm(`Bestand “${name}” verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;
    try {
      await api(`/api/files/${encodeURIComponent(id)}`, { method: 'DELETE' });
      toast('Bestand verwijderd');
      await loadClientFiles();
    } catch (error) { toast(error.message); }
  }

  window.ClientFiles = { load: loadClientFiles, upload: uploadFiles, download: downloadFile, open: openFile, remove: removeFile };

  function cleanupMainNav() {
    document.querySelectorAll('.navitem[data-page="files"]').forEach(el => el.remove());
  }

  function cleanupSettings() {
    if (state.page !== 'settings') return;
    document.querySelectorAll('.settings-nav-v19 button').forEach(button => {
      if (button.textContent.includes('Werkruimtes')) button.remove();
    });
  }

  function addNotionImportButton() {
    if (state.page !== 'clients' || document.getElementById('notionClientImportButton')) return;
    const actions = document.querySelector('.page-head .head-actions');
    if (!actions || typeof openClientImport !== 'function') return;
    const button = document.createElement('button');
    button.id = 'notionClientImportButton';
    button.className = 'outline notion-import-button';
    button.type = 'button';
    button.textContent = 'Importeer uit Notion';
    button.addEventListener('click', openClientImport);
    actions.prepend(button);
  }

  function wireDataShortcut() {
    const dataButton = document.getElementById('exportData');
    if (!dataButton || dataButton.dataset.dataRoute === 'settings') return;
    dataButton.dataset.dataRoute = 'settings';
    dataButton.onclick = e => {
      e?.preventDefault?.();
      state.settingsTab = 'data';
      go('settings');
    };
  }

  function afterRender() {
    cleanupMainNav();
    cleanupSettings();
    addNotionImportButton();
    wireDataShortcut();
    wireClientFiles();
  }

  const originalRender = render;
  render = function(...args) {
    const result = originalRender.apply(this, args);
    afterRender();
    return result;
  };

  const originalRenderNav = renderNav;
  renderNav = function(...args) {
    const result = originalRenderNav.apply(this, args);
    cleanupMainNav();
    return result;
  };

  function setProposalCover(src) {
    const proposal = typeof proposalCurrent === 'function' ? proposalCurrent() : null;
    if (!proposal) return;
    proposal.cover = src;
    proposalSaveDraft();
    toast('Cover toegevoegd');
    render();
  }

  function readCover(file) {
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) return toast('Gebruik JPG, PNG of WebP.');
    if (file.size > 10 * 1024 * 1024) return toast('Kies een cover van maximaal 10 MB.');
    const reader = new FileReader();
    reader.onerror = () => toast('Cover kon niet worden gelezen.');
    reader.onload = () => {
      if (file.size <= 2 * 1024 * 1024) return setProposalCover(reader.result);
      const image = new Image();
      image.onerror = () => toast('Cover kon niet worden verwerkt.');
      image.onload = () => {
        const max = 1800;
        const scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        setProposalCover(canvas.toDataURL('image/jpeg', 0.86));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  document.addEventListener('change', event => {
    if (event.target?.id !== 'proposalCoverInput') return;
    event.stopImmediatePropagation();
    readCover(event.target.files?.[0]);
  }, true);

  cleanupMainNav();
  cleanupSettings();
  addNotionImportButton();
  wireDataShortcut();
  wireClientFiles();
})();