<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Formulario de detalles</title>
</head>
<body style="margin:0;padding:32px;background:#f6f4ef;font-family:Arial,sans-serif;color:#1f2937;">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px;border:1px solid #e5e7eb;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#9ca3af;">Briefing</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#111827;">Necesitamos algunos detalles de tu evento</h1>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#4b5563;">
            Hola {{ $lead->name }}, preparamos un formulario corto para conocer mejor tu {{ strtolower($lead->event_type ?: 'evento') }} y planificar la cobertura con mas claridad.
        </p>
        <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#4b5563;">
            Puedes completarlo desde este enlace seguro:
        </p>
        <p style="margin:0 0 28px;">
            <a href="{{ $url }}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:14px 20px;border-radius:999px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
                Abrir formulario
            </a>
        </p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">
            Si prefieres, tambien podemos completarlo contigo desde el panel interno. Este enlace seguira disponible hasta que recibamos tu respuesta.
        </p>
    </div>
</body>
</html>
