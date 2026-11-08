/**
 * Export Excel (.xls) native — memakai format HTML Spreadsheet yang didukung
 * penuh oleh Microsoft Excel. Tidak butuh library eksternal (cukup Web API
 * Blob + URL.createObjectURL). Dipakai panel Admin "Rekap & Export".
 */

const EXCEL_MIME = "application/vnd.ms-excel;charset=utf-8;";

// Inline style dipakai (bukan class CSS) karena Excel lebih konsisten
// membaca style langsung pada elemen tabel.
const HEADER_STYLE = [
  "background:#2563eb",
  "background-color:#2563eb",
  "color:#ffffff",
  "font-weight:bold",
  "font-family:Calibri,Arial,sans-serif",
  "font-size:12px",
  "padding:10px 14px",
  "border:1px solid #1e3a8a",
  "text-align:center",
  "vertical-align:middle",
  "white-space:nowrap",
].join(";");

/**
 * Style sel data: border kotak jelas + zebra striping.
 * `mso-number-format:'\@'` memaksa Excel memperlakukan isi sebagai teks,
 * sehingga NIM seperti 32510... tidak berubah menjadi notasi eksponen.
 */
const buildCellStyle = (rowIndex) =>
  [
    "font-family:Calibri,Arial,sans-serif",
    "font-size:11px",
    "padding:6px 10px",
    "border:1px solid #94a3b8",
    `background:${rowIndex % 2 === 0 ? "#ffffff" : "#f8fafc"}`,
    `background-color:${rowIndex % 2 === 0 ? "#ffffff" : "#f8fafc"}`,
    "vertical-align:top",
    "mso-number-format:'\\@'",
  ].join(";");

/**
 * Escape teks agar aman sebagai isi HTML, lalu ubah baris baru menjadi
 * <br> supaya multi-baris (mis. deskripsi tugas) tetap rapi di Excel.
 */
function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/\r\n?/g, "\n")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>");
}

/**
 * Nama berkas bertanggal lokal: `rekap_anggota_classhub_2026-11-09.xls`.
 * Memakai komponen tanggal lokal (bukan toISOString) agar tanggal tidak
 * bergeser satu hari pada zona waktu WIB.
 */
export function buildExcelFileName(baseName, date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${baseName}_classhub_${year}-${month}-${day}.xls`;
}

/**
 * Susun dokumen HTML Spreadsheet (.xls) dari header + baris objek/array.
 * @param {object} options
 * @param {string} [options.sheetName]
 * @param {string[]} options.headers
 * @param {Array<Array<unknown>|Record<string, unknown>>} options.rows
 */
export function buildExcelHtml({ sheetName = "Rekap", headers = [], rows = [] }) {
  const headerCells = headers
    .map((header) => `<th style="${HEADER_STYLE}">${escapeHtml(header)}</th>`)
    .join("");

  const bodyRows = rows
    .map((row, rowIndex) => {
      const cells = Array.isArray(row)
        ? row
        : headers.map((header) => row?.[header]);
      const style = buildCellStyle(rowIndex);
      return `<tr>${cells
        .map((cell) => `<td style="${style}">${escapeHtml(cell)}</td>`)
        .join("")}</tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="application/vnd.ms-excel;charset=utf-8" />
<meta charset="utf-8" />
<meta name="ProgId" content="Excel.Sheet" />
<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>${escapeHtml(sheetName)}</x:Name>
    <x:WorksheetOptions>
     <x:DisplayGridlines/>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
  table { border-collapse: collapse; }
  td, th { mso-number-format: '\\@'; }
</style>
</head>
<body>
<table border="1" cellspacing="0" cellpadding="0">
  <thead><tr>${headerCells}</tr></thead>
  <tbody>${bodyRows}</tbody>
</table>
</body>
</html>`;
}

/**
 * Picu unduhan berkas .xls di browser.
 * BOM UTF-8 ditambahkan agar Excel membaca karakter non-ASCII dengan benar.
 */
export function downloadExcel(fileName, excelHtml) {
  // "﻿" = BOM UTF-8, agar Excel membaca karakter non-ASCII dengan benar.
  const blob = new Blob([`﻿${excelHtml}`], { type: EXCEL_MIME });
  const objectUrl = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    // Revoke setelah klik diproses browser agar unduhan tidak terputus.
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
}
