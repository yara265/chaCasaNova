const PRODUCTS = [
  { id: 'cafeteira', name: 'Cafeteira', description: 'Para um café quentinho', price: 149.9 },
  { id: 'panelas', name: 'Conjunto de Panelas', description: 'Jantar em grande estilo', price: 299.9 },
  { id: 'copos', name: 'Jogo de Copos', description: 'Brindes com elegância', price: 79.9 },
  { id: 'liquidificador', name: 'Liquidificador', description: 'Vitaminas e sucos', price: 189.0 },
  { id: 'toalhas', name: 'Jogo de Toalhas', description: 'Conforto no banho', price: 129.9 },
];

const DEFAULT_PIX_KEY = '884b6af2-a787-4c78-bc40-a7d759ca812f';
const CURRENCY = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function getProductFromQuery() {
  const params = new URLSearchParams(location.search);
  const id = params.get('p');
  if (id === 'custom') {
    const v = parseFloat((params.get('v') || '').replace(',', '.'));
    if (!isNaN(v) && v > 0) {
      return { id: 'custom', name: 'Contribuição Livre', description: 'Valor definido por você', price: v };
    }
  }
  return PRODUCTS.find(p => p.id === id) || null;
}

function renderProduct(product) {
  const el = document.getElementById('productPane');
  el.innerHTML = `
    <article class="card">
      <img class="thumb" src="images/${product.id}.jpg" alt="${product.name}">
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <div class="price">${CURRENCY.format(product.price)}</div>
      <a href="index.html" class="secondary" style="display:inline-block;text-decoration:none;padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:#0b1020;color:var(--text);text-align:center">Ver outros presentes</a>
    </article>
  `;
}

function buildPixPayload({ pixKey, merchantName, merchantCity, amount, description, poi11 = true }) {
  const formatValue = (id, value) => `${id}${value.length.toString().padStart(2,'0')}${value}`;
  const stripAccents = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const sanitizeAscii = (s) => stripAccents(String(s)).replace(/[^A-Za-z0-9 \-\.&]/g, '').trim();

  const gui = formatValue('00', 'br.gov.bcb.pix');
  const key = formatValue('01', pixKey);
  const descr = description ? formatValue('02', sanitizeAscii(description).substring(0, 60)) : '';
  const mai = formatValue('26', `${gui}${key}${descr}`);

  const pfi = formatValue('00', '01');
  const poi = formatValue('01', poi11 ? '11' : '12');
  const mcc = formatValue('52', '0000');
  const cur = formatValue('53', '986');
  const amt = amount ? formatValue('54', amount.toFixed(2)) : '';
  const cc = formatValue('58', 'BR');
  const name = formatValue('59', sanitizeAscii(merchantName || 'CHA CASA').toUpperCase().substring(0, 25));
  const city = formatValue('60', sanitizeAscii((merchantCity || 'BRASILIA')).toUpperCase().substring(0, 15));
  const add = formatValue('62', formatValue('05', '***'));
  const crcPlaceholder = '6304';
  const base = `${pfi}${poi}${mai}${mcc}${cur}${amt}${cc}${name}${city}${add}${crcPlaceholder}`;
  return base + crc16(base).toUpperCase();
}

function crc16(payload) {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).padStart(4, '0');
}

function renderQRCode(text) {
  const box = document.getElementById('qrcode');
  box.innerHTML = '';
  new QRCode(box, { text, typeNumber: 10, width: 170, height: 170, colorDark: '#e5e7eb', colorLight: '#0b1020', correctLevel: QRCode.CorrectLevel.M });
}

function copySetup() {
  document.getElementById('copyBtn').addEventListener('click', async () => {
    const text = document.getElementById('pixPayload').value;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      const btn = document.getElementById('copyBtn');
      const t = btn.textContent; btn.textContent = 'Copiado!'; setTimeout(() => btn.textContent = t, 1200);
    } catch {}
  });
}

function main() {
  const product = getProductFromQuery();
  if (!product) { location.href = 'index.html'; return; }
  renderProduct(product);
  copySetup();
  const payload = buildPixPayload({
    pixKey: DEFAULT_PIX_KEY,
    merchantName: 'Chá de Casa Nova',
    merchantCity: 'BRASILIA',
    amount: product.price,
    description: '',
    poi11: true,
  });
  document.getElementById('pixPayload').value = payload;
  renderQRCode(payload);
}

document.addEventListener('DOMContentLoaded', main);


