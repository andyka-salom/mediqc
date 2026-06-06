<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Riwayat QC</title>
    <style>
        body { font-family: sans-serif; font-size: 11px; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f8fafc; font-weight: bold; color: #1e293b; }
        h2 { text-align: center; margin-bottom: 5px; color: #0f172a; }
        .text-center { text-align: center; }
        .subtitle { text-align: center; color: #64748b; font-size: 10px; margin-bottom: 20px; }
        .badge { display: inline-block; padding: 3px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-warning { background: #fef08a; color: #854d0e; }
        .badge-error { background: #fee2e2; color: #991b1b; }
        .text-rose { color: #e11d48; font-weight: bold; }
    </style>
</head>
<body>
    <h2>Laporan Riwayat Quality Control (QC) Alat Medis</h2>
    <div class="subtitle">Waktu Ekspor: {{ now()->format('d/m/Y H:i') }} WIB</div>

    <table>
        <thead>
            <tr>
                <th width="3%">No</th>
                <th width="10%">Tanggal</th>
                <th width="20%">Nama Alat Medis</th>
                <th width="12%">Kode Aset</th>
                <th width="8%">Tipe QC</th>
                <th width="12%">Pengisi</th>
                <th width="10%">Status</th>
                <th width="8%">Peringatan</th>
                <th width="17%">Catatan Masalah</th>
            </tr>
        </thead>
        <tbody>
            @foreach($submissions as $index => $sub)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td>{{ \Carbon\Carbon::parse($sub->submission_date)->format('d/m/Y') }}</td>
                <td>{{ $sub->equipmentUnit ? $sub->equipmentUnit->name : '—' }}</td>
                <td>{{ $sub->equipmentUnit ? $sub->equipmentUnit->asset_code : '—' }}</td>
                <td>{{ ucfirst($sub->qc_type) }}</td>
                <td>{{ $sub->submitter ? $sub->submitter->name : '—' }}</td>
                <td>
                    @if($sub->overall_status === 'submitted')
                        <span class="badge badge-success">Tercatat</span>
                    @elseif($sub->overall_status === 'needs_action')
                        <span class="badge badge-error">Perlu Tindakan</span>
                    @else
                        <span class="badge badge-warning">Draft</span>
                    @endif
                </td>
                <td class="text-center">
                    @if($sub->warning_count > 0)
                        <span class="text-rose">{{ $sub->warning_count }} peringatan</span>
                    @else
                        —
                    @endif
                </td>
                <td>{{ $sub->catatan_masalah ?? '—' }}</td>
            </tr>
            @endforeach
            @if($submissions->isEmpty())
            <tr>
                <td colspan="9" class="text-center">Tidak ada data riwayat QC pada periode/filter ini.</td>
            </tr>
            @endif
        </tbody>
    </table>
</body>
</html>
