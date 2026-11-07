# Scan Jadwal Parser Improvements
**Date:** 2026-11-07  
**Component:** `src/components/ScanJadwalModal.jsx`

## Problem
Tesseract OCR berhasil membaca teks dari poster jadwal UMIBA, tetapi parser gagal mendeteksi baris jadwal karena:
- Format UMIBA unik: "PAGI • SENIN", jam dengan titik "13.00-15.00", karakter bullet (•)
- Layout multi-kolom menyebabkan OCR membaca per kolom, bukan per baris
- Parser lama hanya melihat 2 baris ke depan, tidak ke belakang
- Ekstraksi dosen dan ruangan tidak robust

## Solutions Implemented

### 1. Text Normalization (`normalizeOcrText`)
- Menghapus karakter bullet: `•●◦▪▫◆◇■□|` → spasi
- Normalisasi dash: `–—` → `-`
- Membersihkan whitespace non-breaking

### 2. Flexible Time Pattern
```javascript
const timePattern = /\b(\d{1,2})[.:](\d{2})\s*[-–—]\s*(\d{1,2})[.:](\d{2})\b/g;
```
Mendukung format: `08.00-10.00`, `08:00-10:00`, `08.00–10.00`

### 3. Enhanced Context Scanning
- **Backward scan**: Melihat 2 baris sebelum waktu (untuk mata kuliah di atas jam)
- **Forward scan**: Melihat 3 baris setelah waktu (untuk dosen dan ruangan)
- Berhenti saat menemukan hari baru atau waktu berikutnya

### 4. Improved Extraction Order
1. Normalisasi: hapus noise (PAGI, SIANG, hari duplikat)
2. **Extract rooms first** dengan regex global
3. Hapus rooms dari teks
4. **Extract lecturers** dari teks bersih (mencegah "Dr. Budi Santoso LAB KOMPUTER")
5. Hapus lecturers dari teks
6. Sisa teks = mata kuliah

### 5. Lecturer Pattern Enhancement
```javascript
const lecturerTitlePattern = /(?:(?:dosen|guru|pengajar)\s*[:.-]?\s*)?((?:Dr\.|Prof\.|Ir\.|Drs\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+(?:\s*,?\s*(?:S\.Kom|M\.Kom|M\.T|S\.T|M\.Pd|S\.Pd)\.?)?)/gi;
```
Mendeteksi: "Dr. Ahmad Hidayat", "Prof. Siti Nurhaliza", "Dosen: Dr. Dewi Sartika"

### 6. Room Pattern Enhancement  
```javascript
const roomPattern = /\b(?:R\.?\s*[A-Z]?\s*\d{1,4}[A-Z-]*|\d{1,4}\s*LAB(?:\s+[A-Z0-9-]+)*|LAB(?:ORATORIUM)?(?:\s+[A-Z0-9-]+)*)\b/gi;
```
Mendeteksi: "303 LAB", "R 201", "LAB KOMPUTER", "R.305"

## New Features

### Raw OCR Debug Toggle
- State: `rawOcrText`, `showRawText`
- Button muncul setelah scan selesai: "👁 Lihat Teks Mentah" / "⊗ Sembunyikan"
- Menampilkan hasil OCR asli dalam `<details>` + `<pre>` tag
- Berguna untuk debug ketika parser melewatkan baris

### UMIBA Template Button
- Button: "⚡ Muat Template UMIBA S1"
- Pre-filled dengan 7 jadwal contoh (Pemrograman Web, Basis Data, dll.)
- User tinggal edit sesuai kebutuhan
- Styling amber untuk membedakan dari tombol lain

## Test Results
Parser berhasil mengekstrak dari format UMIBA:
```
PAGI • SENIN
Pemrograman Web
08.00-10.00
Dr. Ahmad Hidayat
303 LAB
```
Hasil:
- ✅ Hari: Senin
- ✅ Jam: 08:00-10:00
- ✅ Mata Kuliah: Pemrograman Web
- ✅ Dosen: Dr. Ahmad Hidayat
- ✅ Ruangan: 303 LAB

## Files Modified
- `src/components/ScanJadwalModal.jsx`
  - Enhanced regex patterns (lines 7-9)
  - New `normalizeOcrText()` function
  - Rewritten `parseScheduleText()` with bidirectional context scanning
  - Added `rawOcrText` and `showRawText` state
  - Added `UMIBA_TEMPLATE_2026` constant
  - Added `loadUmibaTemplate()` function
  - UI: Raw text toggle button and collapsible display
  - UI: Template button beside manual-add button

## Usage
1. Upload gambar jadwal UMIBA
2. Klik "Mulai Scan OCR"
3. Jika ada baris terlewat, klik "👁 Lihat Teks Mentah" untuk debug
4. Alternatif: Klik "⚡ Muat Template UMIBA S1" untuk pre-filled data
5. Koreksi hasil jika perlu
6. Simpan ke database
