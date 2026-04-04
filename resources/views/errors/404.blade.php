<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found</title>
    <style>
        body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(180deg, #f8f4ee 0%, #efe7dc 100%);
            font-family: Arial, sans-serif;
            color: #1f1a17;
            padding: 24px;
        }
        .card {
            max-width: 720px;
            width: 100%;
            border: 1px solid #e5dacf;
            background: rgba(255,255,255,.92);
            border-radius: 32px;
            padding: 48px;
            box-shadow: 0 20px 60px rgba(36, 27, 22, .08);
        }
        .eyebrow {
            font-size: 11px;
            letter-spacing: .28em;
            text-transform: uppercase;
            color: #8e7766;
            margin-bottom: 16px;
        }
        h1 {
            margin: 0;
            font-size: 54px;
            line-height: 1;
            font-family: Georgia, serif;
        }
        p {
            color: #5f4b3e;
            font-size: 17px;
            line-height: 1.8;
        }
        .actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin-top: 28px;
        }
        a {
            text-decoration: none;
            border-radius: 999px;
            padding: 14px 22px;
            font-size: 12px;
            letter-spacing: .16em;
            text-transform: uppercase;
        }
        .primary {
            background: #1f1a17;
            color: #fff;
        }
        .secondary {
            border: 1px solid #d7c7b7;
            color: #1f1a17;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="eyebrow">404 · Not Found</div>
        <h1>This page drifted out of frame.</h1>
        <p>
            The link may be outdated, the resource may have moved, or the page simply does not exist yet.
            You can return to the photographer website or go back into the admin panel.
        </p>
        <div class="actions">
            <a class="primary" href="/">Go to homepage</a>
            <a class="secondary" href="/admin">Go to admin</a>
        </div>
    </div>
</body>
</html>
