<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Detail Hasil QC</title>
    <style>
        @page { margin: 22px 24px; }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10px;
            color: #1f2937;
            line-height: 1.35;
        }
        h1 {
            margin: 0;
            text-align: center;
            font-size: 17px;
            color: #0f172a;
            letter-spacing: .2px;
        }
        h2 {
            margin: 0 0 8px;
            font-size: 13px;
            color: #0f172a;
        }
        h3 {
            margin: 14px 0 6px;
            font-size: 11px;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: .35px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid #dbe3ef;
            padding: 6px 7px;
            vertical-align: top;
        }
        th {
            background: #f1f5f9;
            color: #334155;
            font-weight: bold;
        }
        .subtitle {
            margin: 3px 0 16px;
            text-align: center;
            color: #64748b;
            font-size: 9px;
        }
        .empty {
            margin-top: 40px;
            padding: 18px;
            border: 1px dashed #cbd5e1;
            color: #64748b;
            text-align: center;
        }
        .submission {
            margin-bottom: 18px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e2e8f0;
        }
        .submission + .submission {
            page-break-before: always;
        }
        .meta {
            margin-bottom: 10px;
        }
        .meta td {
            border-color: #e2e8f0;
            padding: 5px 7px;
        }
        .label {
            width: 14%;
            background: #f8fafc;
            color: #64748b;
            font-weight: bold;
        }
        .value {
            width: 36%;
            color: #0f172a;
        }
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 9px;
            white-space: nowrap;
        }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-error { background: #fee2e2; color: #991b1b; }
        .warning-row td {
            background: #fff7ed;
            border-color: #fed7aa;
        }
        .warning-text {
            color: #b45309;
            font-weight: bold;
        }
        .muted {
            color: #64748b;
        }
        .notes {
            margin-top: 10px;
            padding: 8px;
            border: 1px solid #e2e8f0;
            background: #f8fafc;
        }
        .section-table {
            margin-bottom: 8px;
        }
        .section-table th:nth-child(1) { width: 5%; text-align: center; }
        .section-table th:nth-child(2) { width: 42%; }
        .section-table th:nth-child(3) { width: 31%; }
        .section-table th:nth-child(4) { width: 22%; }
        .center { text-align: center; }
        .prewrap { white-space: pre-wrap; }
    </style>
</head>
<body>
    @php
        $statusLabel = function (?string $status): string {
            return match ($status) {
                'submitted' => 'Tercatat',
                'needs_action' => 'Perlu Tindakan',
                default => 'Draft',
            };
        };

        $statusClass = function (?string $status): string {
            return match ($status) {
                'submitted' => 'badge-success',
                'needs_action' => 'badge-error',
                default => 'badge-warning',
            };
        };

        $hasMeaningfulValue = function ($value) use (&$hasMeaningfulValue): bool {
            if ($value === null) {
                return false;
            }

            if (is_bool($value) || is_numeric($value)) {
                return true;
            }

            if (is_string($value)) {
                return trim($value) !== '';
            }

            if (is_array($value)) {
                foreach ($value as $item) {
                    if ($hasMeaningfulValue($item)) {
                        return true;
                    }
                }

                return false;
            }

            return true;
        };

        $hasAnswer = function ($answer) use ($hasMeaningfulValue): bool {
            if (! $answer) {
                return false;
            }

            return $answer->value_numeric !== null
                || $answer->value_boolean !== null
                || $answer->value_date !== null
                || $answer->value_time !== null
                || $hasMeaningfulValue($answer->value_json)
                || $hasMeaningfulValue($answer->file_path)
                || $hasMeaningfulValue($answer->value_text);
        };

        $isCalibrationAnswer = function ($answer): bool {
            if (! $answer) {
                return false;
            }

            $label = strtolower((string) $answer->field_snapshot_label);

            return str_contains($label, 'kalibrasi')
                || str_contains($label, 'callibration')
                || str_contains($label, 'calibration')
                || str_contains($label, 'nomor izin operasional alat');
        };

        $formatAnswer = function ($answer): string {
            if (! $answer) {
                return '-';
            }

            $optionLabel = function ($rawValue) use ($answer): ?string {
                $options = $answer->field?->config['options'] ?? null;
                if (! is_array($options)) {
                    return null;
                }

                foreach ($options as $option) {
                    $value = is_array($option) ? ($option['value'] ?? null) : $option;
                    $label = is_array($option) ? ($option['label'] ?? $value) : $option;
                    if ((string) $value === (string) $rawValue) {
                        return (string) $label;
                    }
                }

                return null;
            };

            if ($answer->value_numeric !== null) {
                return rtrim(rtrim(number_format((float) $answer->value_numeric, 4, ',', '.'), '0'), ',')
                    . ($answer->field_snapshot_unit ? ' '.$answer->field_snapshot_unit : '');
            }

            if ($answer->value_boolean !== null) {
                return $answer->field_snapshot_type === 'pass_fail'
                    ? ($answer->value_boolean ? 'PASS' : 'FAIL')
                    : ($answer->value_boolean ? 'Ya' : 'Tidak');
            }

            if ($answer->value_date !== null) {
                return \Carbon\Carbon::parse($answer->value_date)->format('d/m/Y');
            }

            if ($answer->value_time !== null) {
                return (string) $answer->value_time;
            }

            if ($answer->value_json !== null) {
                $value = $answer->value_json;
                if (is_array($value)) {
                    if (array_is_list($value)) {
                        return collect($value)->map(function ($item) {
                            return is_array($item) ? json_encode($item, JSON_UNESCAPED_UNICODE) : (string) $item;
                        })->implode(', ');
                    }

                    return json_encode($value, JSON_UNESCAPED_UNICODE);
                }

                return (string) $value;
            }

            if ($answer->file_path) {
                return (string) $answer->file_path;
            }

            if ($answer->value_text !== null && $answer->value_text !== '') {
                return $optionLabel($answer->value_text) ?? (string) $answer->value_text;
            }

            return '-';
        };
    @endphp

    <h1>Laporan Detail Hasil Quality Control (QC)</h1>
    <div class="subtitle">Waktu ekspor: {{ now()->format('d/m/Y H:i') }} WIB</div>

    @if($submissions->isEmpty())
        <div class="empty">Tidak ada data QC pada periode/filter ini.</div>
    @endif

    @foreach($submissions as $index => $sub)
        @php
            $answersByField = $sub->answers->keyBy('form_field_id');
        @endphp

        <div class="submission">
            <h2>{{ $index + 1 }}. {{ $sub->formTemplate?->name ?? 'Hasil QC' }}</h2>

            <table class="meta">
                <tr>
                    <td class="label">Tanggal QC</td>
                    <td class="value">{{ \Carbon\Carbon::parse($sub->submission_date)->format('d/m/Y') }}</td>
                    <td class="label">Tipe QC</td>
                    <td class="value">{{ ucfirst($sub->qc_type) }}</td>
                </tr>
                <tr>
                    <td class="label">Nama Alat</td>
                    <td class="value">{{ $sub->equipmentUnit?->name ?? '-' }}</td>
                    <td class="label">Jenis Alat</td>
                    <td class="value">{{ $sub->equipmentUnit?->equipmentType?->display_name ?? '-' }}</td>
                </tr>
                <tr>
                    <td class="label">Kode Aset</td>
                    <td class="value">{{ $sub->equipmentUnit?->asset_code ?? '-' }}</td>
                    <td class="label">Merk/Model</td>
                    <td class="value">{{ trim(($sub->equipmentUnit?->merk ?? '').' '.($sub->equipmentUnit?->model ?? '')) ?: '-' }}</td>
                </tr>
                <tr>
                    <td class="label">Kalibrasi Terakhir</td>
                    <td class="value">{{ $sub->equipmentUnit?->tanggal_kalibrasi_terakhir ? \Carbon\Carbon::parse($sub->equipmentUnit->tanggal_kalibrasi_terakhir)->format('d/m/Y') : '-' }}</td>
                    <td class="label">Kalibrasi Berikutnya</td>
                    <td class="value">{{ $sub->equipmentUnit?->tanggal_kalibrasi_berikutnya ? \Carbon\Carbon::parse($sub->equipmentUnit->tanggal_kalibrasi_berikutnya)->format('d/m/Y') : '-' }}</td>
                </tr>
                <tr>
                    <td class="label">Pengisi</td>
                    <td class="value">{{ $sub->submitter?->name ?? '-' }}{{ $sub->submitter?->role?->display_name ? ' - '.$sub->submitter->role->display_name : '' }}</td>
                    <td class="label">Status</td>
                    <td class="value">
                        <span class="badge {{ $statusClass($sub->overall_status) }}">{{ $statusLabel($sub->overall_status) }}</span>
                        <span class="muted">({{ $sub->warning_count }} warning)</span>
                    </td>
                </tr>
            </table>

            @foreach($sub->formTemplate?->sections ?? [] as $section)
                @php
                    $rows = $section->fields
                        ->filter(fn ($field) => $hasAnswer($answersByField->get($field->id)) && ! $isCalibrationAnswer($answersByField->get($field->id)))
                        ->values();
                @endphp

                @if($rows->isNotEmpty())
                    <h3>{{ $section->title }}</h3>
                    <table class="section-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Parameter</th>
                                <th>Hasil / Nilai</th>
                                <th>Keterangan Warning</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($rows as $rowIndex => $field)
                                @php
                                    $answer = $answersByField->get($field->id);
                                @endphp
                                <tr class="{{ $answer->has_warning ? 'warning-row' : '' }}">
                                    <td class="center">{{ $rowIndex + 1 }}</td>
                                    <td>{{ $answer->field_snapshot_label ?: $field->label }}</td>
                                    <td class="prewrap">{{ $formatAnswer($answer) }}</td>
                                    <td>
                                        @if($answer->has_warning)
                                            <span class="warning-text">{{ $answer->warning_message ?: 'Warning' }}</span>
                                        @else
                                            <span class="muted">-</span>
                                        @endif
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                @endif
            @endforeach

            @php
                $templateFieldIds = $sub->formTemplate
                    ? $sub->formTemplate->sections->flatMap(fn ($section) => $section->fields)->pluck('id')
                    : collect();
                $orphanAnswers = $sub->answers
                    ->filter(fn ($answer) => ! $templateFieldIds->contains($answer->form_field_id) && $hasAnswer($answer) && ! $isCalibrationAnswer($answer))
                    ->values();
            @endphp

            @if($orphanAnswers->isNotEmpty())
                <h3>Parameter Lainnya</h3>
                <table class="section-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Parameter</th>
                            <th>Hasil / Nilai</th>
                            <th>Keterangan Warning</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($orphanAnswers as $rowIndex => $answer)
                            <tr class="{{ $answer->has_warning ? 'warning-row' : '' }}">
                                <td class="center">{{ $rowIndex + 1 }}</td>
                                <td>{{ $answer->field_snapshot_label }}</td>
                                <td class="prewrap">{{ $formatAnswer($answer) }}</td>
                                <td>
                                    @if($answer->has_warning)
                                        <span class="warning-text">{{ $answer->warning_message ?: 'Warning' }}</span>
                                    @else
                                        <span class="muted">-</span>
                                    @endif
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif

            @if($sub->catatan_masalah)
                <div class="notes">
                    <strong>Catatan Masalah Tambahan:</strong>
                    <div class="prewrap">{{ $sub->catatan_masalah }}</div>
                </div>
            @endif
        </div>
    @endforeach
</body>
</html>
