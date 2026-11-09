'use strict';

/* ---------- Daten ---------- */

const catalog = [
  {id: 'augustiner', name: 'Augustiner Lagerbier Hell', category: 'Bier', emoji: '🍺', detail: 'Münchner Klassiker · ca. 5,2 %'},
  {id: 'tegernseer', name: 'Tegernseer Hell', category: 'Bier', emoji: '🍺', detail: 'Helles vom Tegernsee · ca. 4,8 %'},
  {id: 'paulaner', name: 'Paulaner Münchner Hell', category: 'Bier', emoji: '🍺', detail: 'Münchner Helles · ca. 4,9 %'},
  {id: 'hofbraeu', name: 'Hofbräu Original', category: 'Bier', emoji: '🍺', detail: 'Münchner Lager · ca. 5,1 %'},
  {id: 'loewenbraeu', name: 'Löwenbräu Original', category: 'Bier', emoji: '🍺', detail: 'Münchner Hell · ca. 5,2 %'},
  {id: 'erdinger', name: 'Erdinger Weißbier', category: 'Bier', emoji: '🍺', detail: 'Weizen aus Erding · ca. 5,3 %'},
  {id: 'franziskaner', name: 'Franziskaner Weißbier', category: 'Bier', emoji: '🍺', detail: 'Münchner Weißbier · ca. 5,0 %'},
  {id: 'schneider', name: 'Schneider Weisse TAP7', category: 'Bier', emoji: '🍺', detail: 'Original-Naturweißbier · ca. 5,4 %'},
  {id: 'schlenkerla', name: 'Schlenkerla Rauchbier', category: 'Bier', emoji: '🍺', detail: 'Bamberger Rauchbier · ca. 5,1 %'},
  {id: 'weltenburger', name: 'Weltenburger Kloster Barock Dunkel', category: 'Bier', emoji: '🍺', detail: 'Dunkles Klosterbier · ca. 4,7 %'},
  {id: 'ayinger', name: 'Ayinger Celebrator', category: 'Bier', emoji: '🍺', detail: 'Doppelbock aus Aying · ca. 6,7 %'},
  {id: 'zoigl', name: 'Zoigl', category: 'Bier', emoji: '🍺', detail: 'Oberpfälzer Kommunbier · je nach Brauerei verschieden'},
  {id: 'weinschorle', name: 'Weinschorle', category: 'Wein & Cider', emoji: '🍷', detail: 'Wein & Sprudel · ca. 5 %'},
  {id: 'apfelwein', name: 'Apfelwein', category: 'Wein & Cider', emoji: '🍎', detail: 'Fruchtig-herb · ca. 5 %'},
  // Die ID bleibt "obstler", damit bereits gespeicherte Album-Einträge erhalten bleiben.
  {id: 'obstler', name: 'Prinz Alte Marille', category: 'Klassiker', emoji: '🥃', detail: 'Österreichischer Marillenbrand · ca. 41 %'},
  {id: 'kraeuter', name: 'Jägermeister', category: 'Klassiker', emoji: '🥃', detail: 'Kräuterlikör · 35 %'},
  {id: 'gin-tonic', name: 'Gin Tonic', category: 'Klassiker', emoji: '🍸', detail: 'Longdrink · Alkoholgehalt variiert'}
];

const drinkOptions = [
  {value: 'bier', label: 'Bier, 5 %', strength: 5},
  {value: 'weissbier', label: 'Weißbier, 5,4 %', strength: 5.4},
  {value: 'wein', label: 'Wein, 12 %', strength: 12},
  {value: 'sekt', label: 'Sekt, 11 %', strength: 11},
  {value: 'spirituose', label: 'Spirituose, 40 %', strength: 40},
  {value: 'cocktail', label: 'Cocktail (geschätzt), 10 %', strength: 10},
  {value: 'other', label: 'Andere', strength: 5}
];

// Absteigend sortiert: Die erste Stufe, deren Mindestwert erreicht ist, gilt.
const statusLevels = [
  {min: 2, level: 'danger', text: 'Das kann gefährlich werden. Bleib nicht allein – bei Erbrechen, Verwirrtheit, flacher Atmung oder Bewusstlosigkeit sofort die 112 rufen.'},
  {min: 0.5, level: 'high', text: 'Du bist am Arsch – jetzt zählt nur noch: sicher heimkommen.'},
  {min: 0.2, level: 'medium', text: 'Der Abend hat dich schon ein bisschen erwischt. Fahr auf keinen Fall.'},
  {min: 0, level: 'low', text: 'Niedriger Schätzwert, aber keine Entwarnung. Wasser holen, Auto stehen lassen und den Abend entspannt ausklingen lassen.'}
];

const ETHANOL_G_PER_ML = 0.789;
const ELIMINATION_PER_HOUR = {slow: 0.1, typical: 0.15, fast: 0.2};
// Spielraum für Resorptionsdefizit (unten) und abweichendes Körperwasser (oben).
const ABSORPTION_MULTIPLIER = {low: 0.7, high: 1.15};

const MAX_PHOTO_BYTES = 25 * 1024 * 1024;
const MAX_PHOTO_EDGE_PX = 1000;
const JPEG_QUALITY = 0.78;
const TOAST_MS = 2700;

const DB_NAME = 'massvoll-album';
const STORE_NAME = 'entries';

/* ---------- Hilfsfunktionen ---------- */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const HTML_ESCAPES = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => HTML_ESCAPES[char]);
const formatPermille = value => value.toFixed(2).replace('.', ',');

let toastTimer;
function showToast(text) {
  const toast = $('#toast');
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), TOAST_MS);
}

/* ---------- Lokaler Speicher (IndexedDB) ---------- */

const dbPromise = new Promise((resolve, reject) => {
  if (!('indexedDB' in window)) {
    reject(new Error('Lokaler Speicher ist nicht verfügbar.'));
    return;
  }
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, {keyPath: 'id'});
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

async function withStore(mode, operation) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const request = operation(transaction.objectStore(STORE_NAME));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
    // Ein voller Speicher bricht die Transaktion ab, ohne dass onerror feuern muss.
    transaction.onabort = () => reject(transaction.error);
  });
}

const getEntries = () => withStore('readonly', store => store.getAll());
const putEntry = entry => withStore('readwrite', store => store.put(entry));
const deleteEntry = id => withStore('readwrite', store => store.delete(id));

/* ---------- Sammelalbum ---------- */

let entries = new Map();
let currentId = null;
let currentPhoto = null;
let activeFilter = 'all';

async function refreshEntries() {
  entries = new Map((await getEntries()).map(entry => [entry.id, entry]));
}

function cardMarkup(item) {
  const entry = entries.get(item.id);
  const number = String(catalog.indexOf(item) + 1).padStart(2, '0');
  const description = entry?.note ? `${item.detail} · ${entry.note}` : item.detail;
  const photo = entry?.photo
    ? `<img class="card-photo" src="${escapeHtml(entry.photo)}" alt="Dein Foto: ${escapeHtml(item.name)}" loading="lazy" decoding="async">`
    : '';
  const collectedMark = entry ? '<span class="collected-mark" role="img" aria-label="Gesammelt">✓</span>' : '';

  return `<article class="drink-card">
    <div class="card-art" data-kind="${escapeHtml(item.category)}">
      <span class="card-number">NO. ${number}</span>
      <span class="emoji" aria-hidden="true">${item.emoji}</span>
      ${photo}${collectedMark}
    </div>
    <div class="card-body">
      <span class="card-category">${escapeHtml(item.category)}</span>
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(description)}</p>
      <div class="card-action">
        <button type="button" data-edit="${escapeHtml(item.id)}">${entry ? 'Sammlung ansehen' : 'Ins Album aufnehmen'} <span aria-hidden="true">→</span></button>
        <span>${entry ? 'Gesammelt' : '＋'}</span>
      </div>
    </div>
  </article>`;
}

function renderAlbum() {
  const visible = catalog.filter(item => activeFilter === 'all' || item.category === activeFilter);
  $('#collection').innerHTML = visible.map(cardMarkup).join('');
  $('#album-progress').textContent = catalog.filter(item => entries.has(item.id)).length;
  $('#album-total').textContent = catalog.length;
}

function setPreview(src) {
  const preview = $('#photo-preview');
  $('#preview-wrap').hidden = !src;
  if (src) preview.src = src;
  else preview.removeAttribute('src');
}

function openEntry(id) {
  const item = catalog.find(candidate => candidate.id === id);
  if (!item) return;
  const entry = entries.get(id);
  currentId = id;
  currentPhoto = entry?.photo || null;
  $('#dialog-title').textContent = entry ? 'Dein Album-Eintrag' : 'Getränk ergänzen';
  $('#dialog-drink-name').textContent = `${item.name} · ${item.category}`;
  $('#drink-note').value = entry?.note || '';
  $('#delete-entry').hidden = !entry;
  setPreview(currentPhoto);
  $('#upload-dialog').showModal();
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

async function compressImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    const scale = Math.min(1, MAX_PHOTO_EDGE_PX / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext('2d');
    // JPEG kennt keine Transparenz; ohne Hintergrund würden transparente Flächen schwarz.
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function handlePhotoSelected(event) {
  const input = event.target;
  const file = input.files?.[0];
  // Sofort leeren, damit dieselbe Datei erneut ausgewählt werden kann.
  input.value = '';
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('Bitte wähle eine Bilddatei aus.');
    return;
  }
  if (file.size > MAX_PHOTO_BYTES) {
    showToast('Das Foto ist zu groß. Bitte wähle eine Datei unter 25 MB.');
    return;
  }
  try {
    currentPhoto = await compressImage(file);
    setPreview(currentPhoto);
  } catch {
    showToast('Das Foto konnte nicht geladen werden.');
  }
}

async function saveCurrentEntry() {
  try {
    await putEntry({
      id: currentId,
      photo: currentPhoto,
      note: $('#drink-note').value.trim(),
      updatedAt: Date.now()
    });
    await refreshEntries();
    $('#upload-dialog').close();
    renderAlbum();
    showToast('Im Album gespeichert – nur auf diesem Gerät.');
  } catch {
    showToast('Speichern nicht möglich. Prüfe den freien Speicher deines Browsers.');
  }
}

async function deleteCurrentEntry() {
  if (!window.confirm('Eintrag samt Foto und Notiz endgültig entfernen?')) return;
  try {
    await deleteEntry(currentId);
    await refreshEntries();
    $('#upload-dialog').close();
    renderAlbum();
    showToast('Eintrag aus dem Album entfernt.');
  } catch {
    showToast('Der Eintrag konnte nicht entfernt werden.');
  }
}

/* ---------- Rechner ---------- */

function estimateBac({weight, factor, hours, drinks}) {
  const ethanol = drinks.reduce(
    (sum, {volume, strength}) => sum + volume * (strength / 100) * ETHANOL_G_PER_ML,
    0
  );
  const peak = ethanol / (weight * factor);
  const remaining = (multiplier, eliminationRate) => Math.max(0, peak * multiplier - eliminationRate * hours);

  return {
    ethanol,
    estimate: remaining(1, ELIMINATION_PER_HOUR.typical),
    low: remaining(ABSORPTION_MULTIPLIER.low, ELIMINATION_PER_HOUR.fast),
    high: remaining(ABSORPTION_MULTIPLIER.high, ELIMINATION_PER_HOUR.slow)
  };
}

function clearResult() {
  $('#result-empty').hidden = false;
  $('#result-value').hidden = true;
}

function showResult({ethanol, estimate, low, high}) {
  const status = statusLevels.find(({min}) => estimate >= min);
  const resultStatus = $('#result-status');
  $('#result-empty').hidden = true;
  $('#result-value').hidden = false;
  $('#bac-number').textContent = formatPermille(estimate);
  $('#range-text').textContent = `Mögliche Größenordnung: etwa ${formatPermille(low)}–${formatPermille(high)} ‰`;
  resultStatus.textContent = status.text;
  resultStatus.dataset.level = status.level;
  $('#breakdown').textContent = `Grob berechneter reiner Alkohol: ${Math.round(ethanol)} g · tatsächlicher Wert kann deutlich abweichen.`;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('.result-card').scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest'});
}

function addDrinkRow({type = 'bier', volume = 500} = {}) {
  const defaultStrength = drinkOptions.find(option => option.value === type)?.strength ?? 5;
  const options = drinkOptions
    .map(({value, label}) => `<option value="${value}"${value === type ? ' selected' : ''}>${escapeHtml(label)}</option>`)
    .join('');

  const row = document.createElement('div');
  row.className = 'drink-row';
  row.innerHTML = `
    <select aria-label="Getränkeart">${options}</select>
    <label class="input-unit">
      <input class="drink-volume" aria-label="Getränkemenge in Milliliter" type="number" min="1" max="2000" step="1" value="${volume}" required>
      <span>ml</span>
    </label>
    <label class="input-unit">
      <input class="drink-strength" aria-label="Alkoholgehalt in Prozent" type="number" min="0" max="96" step="0.1" value="${defaultStrength}" required>
      <span>%</span>
    </label>
    <button class="remove-drink" type="button" aria-label="Getränk entfernen">×</button>`;

  const select = $('select', row);
  select.addEventListener('change', () => {
    const option = drinkOptions.find(candidate => candidate.value === select.value);
    $('.drink-strength', row).value = option?.strength ?? 5;
  });
  $('.remove-drink', row).addEventListener('click', () => {
    if ($$('.drink-row').length > 1) {
      row.remove();
      clearResult();
    } else {
      showToast('Mindestens ein Getränk bleibt in der Liste.');
    }
  });
  $('#drink-list').append(row);
}

function handleCalculatorSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  showResult(estimateBac({
    weight: Number(form.get('weight')),
    factor: Number(form.get('factor')),
    hours: Number(form.get('duration')) + Number(form.get('elapsed')),
    drinks: $$('.drink-row').map(row => ({
      volume: Number($('.drink-volume', row).value),
      strength: Number($('.drink-strength', row).value)
    }))
  }));
}

/* ---------- Start ---------- */

function bindEvents() {
  $('#calculator').addEventListener('submit', handleCalculatorSubmit);
  // Ein angezeigter Wert darf nicht zu geänderten Angaben stehen bleiben.
  $('#calculator').addEventListener('input', clearResult);
  $('#add-drink').addEventListener('click', () => {
    addDrinkRow();
    clearResult();
  });

  $('#collection').addEventListener('click', event => {
    const button = event.target.closest('[data-edit]');
    if (button) openEntry(button.dataset.edit);
  });
  $$('.filter').forEach(button => button.addEventListener('click', () => {
    $$('.filter').forEach(other => {
      other.classList.toggle('active', other === button);
      other.setAttribute('aria-pressed', String(other === button));
    });
    activeFilter = button.dataset.filter;
    renderAlbum();
  }));

  $('#photo-input').addEventListener('change', handlePhotoSelected);
  $('#remove-photo').addEventListener('click', () => {
    currentPhoto = null;
    setPreview(null);
  });
  $('#save-entry').addEventListener('click', saveCurrentEntry);
  $('#delete-entry').addEventListener('click', deleteCurrentEntry);
}

async function init() {
  bindEvents();
  addDrinkRow();
  try {
    await refreshEntries();
  } catch {
    showToast('Lokaler Speicher ist nicht verfügbar; das Album kann nicht speichern.');
  }
  renderAlbum();
}

init();
