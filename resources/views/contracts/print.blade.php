<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contract Copy</title>
    <style>
        body {
            font-family: Georgia, "Times New Roman", serif;
            background: #ffffff;
            color: #111111;
            margin: 0;
            padding: 48px;
        }
        .shell {
            max-width: 860px;
            margin: 0 auto;
        }
        .meta {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 24px;
            margin-bottom: 36px;
            border-bottom: 1px solid #e8e8e8;
            padding-bottom: 24px;
        }
        .eyebrow {
            letter-spacing: .3em;
            text-transform: uppercase;
            font-size: 11px;
            color: #6b6b6b;
            margin-bottom: 12px;
        }
        h1 {
            margin: 0;
            font-size: 40px;
            line-height: 1.05;
        }
        .stamp {
            text-align: right;
            font-size: 13px;
            color: #575757;
        }
        .content {
            font-size: 15px;
            line-height: 1.8;
        }
        .actions {
            margin-top: 32px;
            display: flex;
            gap: 12px;
        }
        .actions button {
            border: 1px solid #d9d9d9;
            background: #ffffff;
            border-radius: 999px;
            padding: 12px 20px;
            cursor: pointer;
            font-size: 12px;
            letter-spacing: .14em;
            text-transform: uppercase;
        }
        @media print {
            body {
                padding: 0;
            }
            .actions {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="shell">
        <div class="meta">
            <div>
                <div class="eyebrow">PhotOS Contract Copy</div>
                <h1>{{ $contract->project?->name ?? 'Photography Contract' }}</h1>
            </div>
            <div class="stamp">
                <div><strong>Client:</strong> {{ $contract->project?->lead?->name }}</div>
                <div><strong>Status:</strong> {{ ucfirst($contract->status) }}</div>
                <div><strong>Signed:</strong> {{ optional($contract->signed_at)->format('F j, Y g:i A') ?? 'Pending' }}</div>
            </div>
        </div>

        <div class="content">
            {!! $renderedContent !!}
        </div>

        <div class="actions">
            <button onclick="window.print()">Print / Save PDF</button>
            <button onclick="window.close()">Close</button>
        </div>
    </div>
</body>
</html>
