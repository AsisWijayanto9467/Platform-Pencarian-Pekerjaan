<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h2 { margin-bottom: 5px; }
        .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .summary-table td, .summary-table th {
            border: 1px solid #ddd;
            padding: 8px;
        }
        .summary-table th {
            background-color: #f39c12;
            color: white;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 10px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>LAPORAN {{ strtoupper($report['report_type']) }}</h2>
        <p>Periode: {{ $report['period']['from'] }} - {{ $report['period']['to'] }}</p>
        <p>Generated: {{ $report['generated_at'] }}</p>
    </div>

    <h3>Ringkasan</h3>
    <table class="summary-table">
        <tr>
            <th>Metrik</th>
            <th>Nilai</th>
        </tr>
        <tr><td>Society Baru</td><td>{{ $report['summary']['new_societies'] }}</td></tr>
        <tr><td>Total Society</td><td>{{ $report['summary']['total_societies'] }}</td></tr>
        <tr><td>Validasi Baru</td><td>{{ $report['summary']['new_validations'] }}</td></tr>
        <tr><td>Validasi Selesai</td><td>{{ $report['summary']['validations_completed'] }}</td></tr>
        <tr><td>Lamaran Baru</td><td>{{ $report['summary']['new_applications'] }}</td></tr>
        <tr><td>Lowongan Baru</td><td>{{ $report['summary']['new_job_vacancies'] }}</td></tr>
    </table>

    <div class="footer">
        <p>Dokumen ini digenerate secara otomatis oleh sistem</p>
        <p>© {{ date('Y') }} - All Rights Reserved</p>
    </div>
</body>
</html>
