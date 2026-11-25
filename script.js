// ==========================================
// 1. DATA & KONFIGURASI AWAL
// ==========================================
const DEFAULT_DATA = [
  { nama: 'Mariso',                nilai: [32306, 24, 1, 1, 4, 3, 1,  7] },
  { nama: 'Mamajang',              nilai: [25811, 26, 2, 1, 4, 2, 1, 12] },
  { nama: 'Tamalate',              nilai: [ 9363, 50, 3, 1, 8, 4, 1, 10] },
  { nama: 'Rappocini',             nilai: [16346, 64, 4, 3, 7, 4, 1, 11] },
  { nama: 'Makassar',              nilai: [32530, 33, 0, 1, 2, 3, 1, 11] },
  { nama: 'Ujung Pandang',         nilai: [ 9459, 10, 3, 5, 6, 1, 1,  8] },
  { nama: 'Wajo',                  nilai: [14769, 17, 2, 2, 2, 2, 0,  7] },
  { nama: 'Bontoala',              nilai: [26307, 17, 2, 1, 5, 2, 3,  7] },
  { nama: 'Ujung Tanah',           nilai: [ 8346, 29, 1, 0, 1, 2, 2,  5] },
  { nama: 'Kepulauan Sangkarrang', nilai: [ 9745, 36, 0, 0, 0, 2, 1,  0] },
  { nama: 'Tallo',                 nilai: [25387, 58, 1, 0, 8, 3, 3, 11] },
  { nama: 'Panakukkang',           nilai: [ 8468, 28, 4, 1, 6, 4, 2, 10] },
  { nama: 'Manggala',              nilai: [ 6704, 46, 1, 2, 6, 5, 2,  8] },
  { nama: 'Biringkanaya',          nilai: [ 4494, 16, 5, 0, 7, 5, 4, 10] },
  { nama: 'Tamalanrea',            nilai: [ 3353, 45, 1, 1, 4, 5, 1,  7] }
];

const KRITERIA = [
  { kode: 'C1', nama: 'Kepadatan Penduduk', atribut: 'Benefit', bobot: 0.15 },
  { kode: 'C2', nama: 'Jumlah Tenaga Medis', atribut: 'Cost', bobot: 0.20 },
  { kode: 'C3', nama: 'Sarana RS', atribut: 'Cost', bobot: 0.15 },
  { kode: 'C4', nama: 'RS Bersalin', atribut: 'Cost', bobot: 0.10 },
  { kode: 'C5', nama: 'Poliklinik', atribut: 'Cost', bobot: 0.10 },
  { kode: 'C6', nama: 'Puskesmas', atribut: 'Cost', bobot: 0.15 },
  { kode: 'C7', nama: 'Pustu', atribut: 'Cost', bobot: 0.05 },
  { kode: 'C8', nama: 'Apotek', atribut: 'Cost', bobot: 0.10 }
];

let dataset = [];
let results = null;

// ==========================================
// 2. LOGIKA PERHITUNGAN SAW & TOPSIS (UTAMA)
// ==========================================
function calculateSPK() {
  const n = dataset.length;
  const m = KRITERIA.length;
  if (n === 0) return null;

  const X = dataset.map(d => d.nilai);
  const R = Array.from({ length: n }, () => new Array(m).fill(0));
  const Y = Array.from({ length: n }, () => new Array(m).fill(0));

  for (let j = 0; j < m; j++) {
    const col = X.map(row => row[j]);
    const max = Math.max(...col);
    const min = Math.min(...col);
    
    for (let i = 0; i < n; i++) {
      const x = col[i];
      if (KRITERIA[j].atribut === 'Benefit') {
        R[i][j] = max !== 0 ? x / max : 0;
      } else {
        if (min === 0) R[i][j] = (min + 1) / (x + 1);
        else R[i][j] = x !== 0 ? min / x : 0;
      }
      Y[i][j] = R[i][j] * KRITERIA[j].bobot;
    }
  }

  const Aplus = [];
  const Aminus = [];
  for (let j = 0; j < m; j++) {
    const colY = Y.map(row => row[j]);
    Aplus.push(Math.max(...colY));
    Aminus.push(Math.min(...colY));
  }

  const Dplus = [];
  const Dminus = [];
  for (let i = 0; i < n; i++) {
    let sumPlus = 0;
    let sumMinus = 0;
    for (let j = 0; j < m; j++) {
      sumPlus += Math.pow(Y[i][j] - Aplus[j], 2);
      sumMinus += Math.pow(Y[i][j] - Aminus[j], 2);
    }
    Dplus.push(Math.sqrt(sumPlus));
    Dminus.push(Math.sqrt(sumMinus));
  }

  const V = [];
  for (let i = 0; i < n; i++) {
    const total = Dplus[i] + Dminus[i];
    V.push(total === 0 ? 0 : Dminus[i] / total);
  }

  const finalData = dataset.map((d, i) => ({
    nama: d.nama,
    nilai: d.nilai,
    R: R[i],
    Y: Y[i],
    Dplus: Dplus[i],
    Dminus: Dminus[i],
    V: V[i]
  }));

  const sorted = [...finalData].sort((a, b) => b.V - a.V);
  sorted.forEach((item, idx) => { item.rank = idx + 1; });

  return { R, Y, Aplus, Aminus, Dplus, Dminus, V, finalData, sorted };
}

// ==========================================
// 3. RENDER UI UTAMA
// ==========================================
function updateUI() {
  results = calculateSPK();
  if (!results) return;

  document.getElementById('kpiTotal').textContent = dataset.length;
  const top1 = results.sorted[0];
  if (top1) {
    document.getElementById('kpiTop').textContent = top1.nama;
    document.getElementById('kpiTopVal').textContent = top1.V.toFixed(4);
  }

  document.getElementById('top5TableBody').innerHTML = results.sorted.slice(0, 5).map(r => `
    <tr>
      <td><span class="badge badge-rank">#${r.rank}</span></td>
      <td style="font-weight: 600;">${r.nama}</td>
      <td>${r.nilai[0].toLocaleString('id-ID')}</td>
      <td>${r.nilai.slice(2).join(' | ')}</td>
      <td style="font-weight: 600; color: var(--primary);">${r.V.toFixed(4)}</td>
    </tr>
  `).join('');

  document.getElementById('dashboardWeights').innerHTML = KRITERIA.map(k => `
    <div class="bar-row">
      <div class="bar-label">
        <span>${k.kode}: ${k.nama}</span>
        <span>${(k.bobot * 100).toFixed(0)}%</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width: ${k.bobot * 100}%; ${k.atribut === 'Cost' ? 'background: var(--warning);' : ''}"></div>
      </div>
    </div>
  `).join('');

  document.getElementById('dataTableBody').innerHTML = dataset.map((d, i) => `
    <tr>
      <td style="font-weight: 600;">${d.nama}</td>
      ${d.nilai.map((n, j) => `<td>${j === 0 ? n.toLocaleString('id-ID') : n}</td>`).join('')}
      <td>
        <button class="btn btn-outline btn-sm" onclick="editData(${i})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteData(${i})">Hapus</button>
      </td>
    </tr>
  `).join('');

  document.getElementById('criteriaTableBody').innerHTML = KRITERIA.map(k => `
    <tr>
      <td style="font-weight: 600;">${k.kode}</td>
      <td>${k.nama}</td>
      <td><span class="badge badge-${k.atribut.toLowerCase()}">${k.atribut}</span></td>
      <td>${k.bobot.toFixed(2)}</td>
    </tr>
  `).join('');

  document.getElementById('sawRTableBody').innerHTML = results.finalData.map(d => `
    <tr>
      <td style="font-weight: 600;">${d.nama}</td>
      ${d.R.map(v => `<td>${v.toFixed(4)}</td>`).join('')}
    </tr>
  `).join('');

  document.getElementById('sawYTableBody').innerHTML = results.finalData.map(d => `
    <tr>
      <td style="font-weight: 600;">${d.nama}</td>
      ${d.Y.map(v => `<td>${v.toFixed(4)}</td>`).join('')}
    </tr>
  `).join('');

  document.getElementById('topsisIdealTableBody').innerHTML = KRITERIA.map((k, j) => `
    <tr>
      <td style="font-weight: 600;">${k.kode} (${k.nama})</td>
      <td style="color: var(--success); font-weight: 600;">${results.Aplus[j].toFixed(4)}</td>
      <td style="color: var(--danger); font-weight: 600;">${results.Aminus[j].toFixed(4)}</td>
    </tr>
  `).join('');

  document.getElementById('topsisDistTableBody').innerHTML = results.finalData.map(d => `
    <tr>
      <td style="font-weight: 600;">${d.nama}</td>
      <td>${d.Dplus.toFixed(4)}</td>
      <td>${d.Dminus.toFixed(4)}</td>
      <td style="font-weight: 600; color: var(--primary);">${d.V.toFixed(4)}</td>
    </tr>
  `).join('');

  document.getElementById('finalRankTableBody').innerHTML = results.sorted.map(r => `
    <tr>
      <td><span class="badge badge-rank" style="font-size: 13px; padding: 6px 12px;">${r.rank}</span></td>
      <td style="font-weight: 600;">${r.nama}</td>
      <td>${r.V.toFixed(4)}</td>
      <td>${r.rank <= 3 ? '<span style="color: var(--success); font-weight: 600;">Prioritas Utama</span>' : 'Perlu Pemantauan'}</td>
    </tr>
  `).join('');
}

// ==========================================
// 4. FITUR KALKULATOR MANUAL
// ==========================================
function runManualCalc(e) {
  e.preventDefault();
  if (!results) {
    showToast('Dataset utama kosong!', 'error');
    return;
  }

  // Ambil nilai input
  const mVal = [];
  for (let i = 1; i <= 8; i++) {
    mVal.push(parseFloat(document.getElementById(`mC${i}`).value));
  }

  const m = KRITERIA.length;
  const R_manual = [];
  const Y_manual = [];
  let sumDplus = 0;
  let sumDminus = 0;
  let detailHTML = '';

  for (let j = 0; j < m; j++) {
    const x = mVal[j];
    
    // Cari Max/Min dari dataset aktif
    const col = dataset.map(d => d.nilai[j]);
    const max = Math.max(...col);
    const min = Math.min(...col);
    
    // Hitung R
    let r = 0;
    if (KRITERIA[j].atribut === 'Benefit') {
      r = max !== 0 ? x / max : 0;
    } else {
      if (min === 0) r = (min + 1) / (x + 1);
      else r = x !== 0 ? min / x : 0;
    }
    R_manual.push(r);

    // Hitung Y
    const y = r * KRITERIA[j].bobot;
    Y_manual.push(y);

    // Hitung Jarak
    const Aplus = results.Aplus[j];
    const Aminus = results.Aminus[j];
    sumDplus += Math.pow(y - Aplus, 2);
    sumDminus += Math.pow(y - Aminus, 2);

    // Buat baris tabel detail
    detailHTML += `
      <tr>
        <td style="font-weight: 600;">${KRITERIA[j].kode} (${KRITERIA[j].atribut})</td>
        <td>${x}</td>
        <td>${KRITERIA[j].atribut === 'Benefit' ? 'Max: ' + max : 'Min: ' + min}</td>
        <td style="color: var(--primary); font-weight: 600;">${r.toFixed(6)}</td>
        <td>${KRITERIA[j].bobot}</td>
        <td style="color: var(--success); font-weight: 600;">${y.toFixed(6)}</td>
      </tr>
    `;
  }

  const Dplus = Math.sqrt(sumDplus);
  const Dminus = Math.sqrt(sumDminus);
  const V = (Dplus + Dminus) === 0 ? 0 : Dminus / (Dplus + Dminus);

  // Tampilkan hasil
  document.getElementById('manualDetailTableBody').innerHTML = detailHTML;
  document.getElementById('mDplus').textContent = Dplus.toFixed(6);
  document.getElementById('mDminus').textContent = Dminus.toFixed(6);
  document.getElementById('mV').textContent = V.toFixed(6);
  document.getElementById('manualResultArea').style.display = 'block';

  // Scroll ke hasil
  document.getElementById('manualResultArea').scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// 5. NAVIGASI & MODAL
// ==========================================
const PAGE_INFO = {
  dashboard: { title: 'Dashboard', sub: 'Ringkasan hasil pemeringkatan fasilitas kesehatan' },
  data: { title: 'Data & Kriteria', sub: 'Matriks keputusan dan konfigurasi bobot' },
  saw: { title: 'Normalisasi SAW', sub: 'Matriks R dan Matriks Terbobot Y' },
  topsis: { title: 'Perhitungan TOPSIS', sub: 'Solusi ideal, jarak D+ / D-, dan nilai preferensi' },
  hasil: { title: 'Hasil Akhir', sub: 'Pemeringkatan akhir seluruh kecamatan' },
  kalkulator: { title: 'Kalkulator Manual', sub: 'Uji perhitungan dengan input nilai Anda sendiri' }
};

function switchPage(pageId, btn) {
  document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
  document.getElementById(`page-${pageId}`).classList.add('active');
  
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  if (btn) btn.classList.add('active');
  
  document.getElementById('pageTitle').textContent = PAGE_INFO[pageId].title;
  document.getElementById('pageSubtitle').textContent = PAGE_INFO[pageId].sub;
  
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

function openModal() {
  document.getElementById('modalTitle').textContent = 'Tambah Kecamatan Baru';
  document.getElementById('editIndex').value = '-1';
  document.getElementById('dataForm').reset();
  document.getElementById('dataModal').classList.add('active');
}

function closeModal() {
  document.getElementById('dataModal').classList.remove('active');
}

function editData(index) {
  const d = dataset[index];
  document.getElementById('modalTitle').textContent = 'Edit Data Kecamatan';
  document.getElementById('editIndex').value = index;
  document.getElementById('inpName').value = d.nama;
  for (let i = 0; i < 8; i++) {
    document.getElementById(`inpC${i+1}`).value = d.nilai[i];
  }
  document.getElementById('dataModal').classList.add('active');
}

function deleteData(index) {
  if (confirm(`Hapus data ${dataset[index].nama}?`)) {
    dataset.splice(index, 1);
    saveToLocalStorage();
    updateUI();
    showToast('Data berhasil dihapus', 'success');
  }
}

function saveData(e) {
  e.preventDefault();
  const idx = parseInt(document.getElementById('editIndex').value);
  const nama = document.getElementById('inpName').value;
  const nilai = [];
  for (let i = 1; i <= 8; i++) {
    nilai.push(parseFloat(document.getElementById(`inpC${i}`).value));
  }

  if (idx >= 0) {
    dataset[idx] = { nama, nilai };
  } else {
    dataset.push({ nama, nilai });
  }

  saveToLocalStorage();
  updateUI();
  closeModal();
  showToast('Data berhasil disimpan!', 'success');
}

function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `show ${type}`;
  setTimeout(() => { t.className = ''; }, 3000);
}

// ==========================================
// 6. LOCAL STORAGE & CSV EXPORT
// ==========================================
function saveToLocalStorage() {
  localStorage.setItem('spk_saw_topsis_data', JSON.stringify(dataset));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem('spk_saw_topsis_data');
  if (saved) {
    try { dataset = JSON.parse(saved); } catch(e) { dataset = [...DEFAULT_DATA]; }
  } else {
    dataset = [...DEFAULT_DATA];
  }
}

function resetData() {
  if (confirm('Kembalikan ke data awal (15 Kecamatan)? Data yang Anda tambahkan akan hilang.')) {
    dataset = [...DEFAULT_DATA];
    saveToLocalStorage();
    updateUI();
    showToast('Data berhasil di-reset ke awal', 'success');
  }
}

function exportCSV() {
  if (dataset.length === 0) return;
  const headers = ['Kecamatan', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'];
  const rows = dataset.map(d => [d.nama, ...d.nilai].join(','));
  const csvContent = [headers.join(','), ...rows].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Dataset_SPK_SAW_TOPSIS.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data berhasil diexport ke CSV', 'success');
}

// ==========================================
// 7. INISIALISASI
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
  updateUI();
});