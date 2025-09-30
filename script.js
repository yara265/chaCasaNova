// Configuráveis
const PRODUCTS = [
  { id: 'cafeteira', name: 'Cafeteira', description: 'Para um café quentinho', price: 149.9 },
  { id: 'panelas', name: 'Conjunto de Panelas', description: 'Jantar em grande estilo', price: 299.9 },
  { id: 'copos', name: 'Jogo de Copos', description: 'Brindes com elegância', price: 79.9 },
  { id: 'liquidificador', name: 'Liquidificador', description: 'Vitaminas e sucos', price: 189.0 },
  { id: 'toalhas', name: 'Jogo de Toalhas', description: 'Conforto no banho', price: 129.9 },
];

const CURRENCY = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const DEFAULT_PIX_KEY = '884b6af2-a787-4c78-bc40-a7d759ca812f';

// Renderiza cards de produto
function renderProducts() {
  const container = document.getElementById('products');
  const itemsHtml = PRODUCTS.map(p => `
    <article class="card">
      <img class="thumb" src="images/${p.id}.jpg" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${p.description}</p>
      <div class="price">${CURRENCY.format(p.price)}</div>
      <button class="buy-btn" data-id="${p.id}">Presentear</button>
    </article>
  `).join('');
  const customHtml = `
    <article class="card custom-card">
      <h3>Contribuir com outro valor</h3>
      <p>Escolha um valor livre para apoiar a casa nova.</p>
      <div style="display:flex; gap:8px; align-items:center;">
        <input id="customAmount" type="number" min="1" step="0.01" placeholder="Ex.: 50,00" style="flex:1" />
        <button id="customBtn" class="buy-btn" style="white-space:nowrap">Contribuir</button>
      </div>
    </article>`;

  container.innerHTML = itemsHtml + customHtml;

  container.addEventListener('click', onBuyClick);
  container.querySelector('#customBtn').addEventListener('click', onCustomContrib);
}

function onBuyClick(ev) {
  const btn = ev.target.closest('button.buy-btn');
  if (!btn) return;
  const id = btn.getAttribute('data-id');
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;

  const url = new URL('gift.html', location.href);
  url.searchParams.set('p', product.id);
  location.href = url.toString();
}

function onCustomContrib() {
  const input = document.getElementById('customAmount');
  const raw = (input.value || '').replace(',', '.');
  const amount = parseFloat(raw);
  if (isNaN(amount) || amount <= 0) {
    alert('Informe um valor válido.');
    input.focus();
    return;
  }
  const url = new URL('gift.html', location.href);
  url.searchParams.set('p', 'custom');
  url.searchParams.set('v', amount.toFixed(2));
  location.href = url.toString();
}

function setPayload(payload) {
  const textarea = document.getElementById('pixPayload');
  textarea.value = payload;
  renderQRCode(payload);
}

// PIX: montagem de payload estático com valor
// Referência: BR Code (EMV® QR Code) e Pix (Bacen)
function buildPixPayload({ pixKey, merchantName, merchantCity, amount, description, poi11 = false }) {
  const formatValue = (id, value) => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };

  // Remove acentos e restringe a ASCII para garantir CRC e leitura pelos bancos
  const stripAccents = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const sanitizeAscii = (s) => stripAccents(String(s))
    .replace(/[^A-Za-z0-9 \-\.&]/g, '')
    .trim();

  const gui = formatValue('00', 'br.gov.bcb.pix');
  const key = formatValue('01', pixKey);
  const descrRaw = description ? sanitizeAscii(description).substring(0, 60) : '';
  const descr = descrRaw ? formatValue('02', descrRaw) : '';
  const merchantAccountInfo = formatValue('26', `${gui}${key}${descr}`);

  const payloadFormatIndicator = formatValue('00', '01');
  // 12 = transação com valor informado; 11 = maior compatibilidade
  const pointOfInitiationMethod = formatValue('01', poi11 ? '11' : '12');
  const merchantCategoryCode = formatValue('52', '0000');
  const transactionCurrency = formatValue('53', '986');
  const transactionAmount = amount ? formatValue('54', amount.toFixed(2)) : '';
  const countryCode = formatValue('58', 'BR');
  const nameVal = sanitizeAscii((merchantName || 'CHA CASA')).toUpperCase().substring(0, 25);
  const cityVal = sanitizeAscii((merchantCity || 'BRASILIA')).toUpperCase().substring(0, 15);
  const name = formatValue('59', nameVal);
  const city = formatValue('60', cityVal);

  const additionalDataField = formatValue('62', formatValue('05', '***'));

  const crcPlaceholder = '6304';
  const base = `${payloadFormatIndicator}${pointOfInitiationMethod}${merchantAccountInfo}${merchantCategoryCode}${transactionCurrency}${transactionAmount}${countryCode}${name}${city}${additionalDataField}${crcPlaceholder}`;
  const crc = crc16(base).toUpperCase();
  return `${base}${crc}`;
}

// CRC16/CCITT-FALSE
function crc16(payload) {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).padStart(4, '0');
}

function renderQRCode(text) {
  const box = document.getElementById('qrcode');
  box.innerHTML = '';
  try {
    new QRCode(box, {
      text,
      // Aumenta a capacidade do QR para payloads longos de PIX
      typeNumber: 10,
      width: 170,
      height: 170,
      colorDark : '#47363b',
      colorLight : '#ffffff',
      correctLevel : QRCode.CorrectLevel.M
    });
  } catch (e) {
    // Fallback online (Google Chart API) caso a lib local falhe
    const img = document.createElement('img');
    img.alt = 'QRCode';
    img.width = 170;
    img.height = 170;
    img.src = 'https://chart.googleapis.com/chart?cht=qr&chs=170x170&chl=' + encodeURIComponent(text);
    box.appendChild(img);
  }
}

function setupClipboard() {
  document.getElementById('copyBtn').addEventListener('click', async () => {
    const text = document.getElementById('pixPayload').value;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      const btn = document.getElementById('copyBtn');
      const original = btn.textContent;
      btn.textContent = 'Copiado!';
      setTimeout(() => btn.textContent = original, 1200);
    } catch {
      alert('Não foi possível copiar. Copie manualmente.');
    }
  });

  document.getElementById('clearBtn').addEventListener('click', () => {
    document.getElementById('pixPayload').value = '';
    document.getElementById('qrcode').innerHTML = '';
  });
}

function main() {
  renderProducts();
  setupClipboard();
}

document.addEventListener('DOMContentLoaded', main);


