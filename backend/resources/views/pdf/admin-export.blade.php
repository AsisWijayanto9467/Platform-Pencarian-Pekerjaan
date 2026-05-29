<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body { font-family: sans-serif; font-size: 10px; }
        .header { text-align: center; margin-bottom: 20px; }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
        }
        .data-table th {
            background-color: #3498db;
            color: white;
            padding: 6px;
            border: 1px solid #ddd;
        }
        .data-table td {
            padding: 5px;
            border: 1px solid #ddd;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 8px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>{{ $title }}</h2>
        <p>Periode: {{ $exportData['period']['from'] }} - {{ $exportData['period']['to'] }}</p>
        <p>Total Records: {{ $exportData['total_records'] }}</p>
    </div>

    @if(!empty($exportData['data']))
    <table class="data-table">
        <thead>
            <tr>
                @foreach(array_keys($exportData['data'][0]) as $header)
                    <th>{{ $header }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach($exportData['data'] as $row)
                <tr>
                    @foreach($row as $cell)
                        <td>{{ $cell }}</td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <div class="footer">
        <p>Dokumen ini digenerate secara otomatis oleh sistem</p>
        <p>© {{ date('Y') }} - All Rights Reserved</p>
    </div>
</body>
</html>
