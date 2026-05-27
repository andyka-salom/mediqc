## Konsep Inti

### 1. Form Dinamis

Setiap pertanyaan QC adalah 1 row di `form_fields`. Tipe (`field_type`) menentukan UI renderer; `config`, `validation_rules`, dan `warning_rules` (semua JSONB) mengatur perilakunya.

**19 field types** didukung: `text`, `textarea`, `number`, `decimal`, `boolean`, `radio`, `select`, `multiselect`, `checkbox_group`, `date`, `time`, `datetime`, `pass_fail`, `range_slider`, `file_upload`, `signature`, `table`, `section_header`, `info_text`.

### 2. Threshold WARNING

Setiap field bisa punya rules JSON di kolom `warning_rules`:

```json
{ "warning_below": 70, "warning_above": 90, "warning_message": "Di luar batas aman" }
{ "warning_if_value_in": ["trouble", "rusak"] }
{ "warning_if_past_due": true }
{ "warning_if_empty": true }
```

Evaluasi di backend (`App\Services\WarningEvaluator`) dan ada port JS-nya di `resources/js/utils/formEvaluator.js` untuk feedback realtime. Hasil disimpan typed di `qc_answers.has_warning` (boolean) + `warning_message` agar query laporan cepat.

### 3. Conditional Fields

Field punya `parent_field_id` + `show_when` (jsonb). Contoh:

- "Apakah ada kerusakan?" (radio yes/no) → kalau yes, muncul field "Jelaskan kerusakan"
- "Kalibrasi Pesawat" (Terkalibrasi/Belum) → kalau terkalibrasi, muncul 3 field (Nomor Izin, Tanggal Kalibrasi, Tenggat)

Aturan `show_when`:

```json
{ "equals": "yes" }
{ "not_equals": "no" }
{ "in": ["yes", "maybe"] }
{ "greater_than": 0 }
```

### 4. Layout Grouping (Field Bersisian)

Untuk menampilkan 2+ field dalam 1 baris (mis. radio "Uji Kebocoran" + tanggal di sebelahnya):

- `layout_group`: string nama group bebas. Field dengan group sama tampil sebaris.
- `layout_width`: 1-12 (grid Tailwind 12 kolom).

### 5. Versioning Template

`form_templates` punya `version`. Saat edit template yang sudah di-publish, sistem (idealnya) bump version, sehingga submission lama tetap pointing ke versi yang dipakai saat itu (lock via `qc_submissions.form_template_id`). Snapshot label disimpan di `qc_answers.field_snapshot_label`.
