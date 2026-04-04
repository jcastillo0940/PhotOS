<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>{{ $invoice->invoice_number ?: 'Factura' }}</title>
    <style>
        @page { margin: 28px 34px; }
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #132033;
            font-size: 11px;
            line-height: 1.45;
            margin: 0;
        }
        .page {
            position: relative;
        }
        .top-band {
            height: 12px;
            background: linear-gradient(90deg, #0f172a 0%, #1d4ed8 55%, #60a5fa 100%);
            margin: -28px -34px 28px;
        }
        .header {
            width: 100%;
            margin-bottom: 22px;
        }
        .header td {
            vertical-align: top;
        }
        .brand {
            width: 55%;
        }
        .brand-box {
            display: flex;
            align-items: center;
        }
        .logo {
            width: 58px;
            height: 58px;
            border-radius: 14px;
            margin-right: 14px;
            object-fit: cover;
        }
        .brand-mark {
            width: 58px;
            height: 58px;
            border-radius: 14px;
            background: #0f172a;
            color: #ffffff;
            text-align: center;
            line-height: 58px;
            font-size: 20px;
            font-weight: 700;
            margin-right: 14px;
        }
        .app-name {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.02em;
            margin: 0;
        }
        .tagline {
            color: #64748b;
            margin-top: 4px;
        }
        .invoice-chip {
            width: 45%;
            text-align: right;
        }
        .chip {
            display: inline-block;
            background: #eff6ff;
            color: #1d4ed8;
            font-weight: 700;
            padding: 6px 12px;
            border-radius: 999px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            font-size: 10px;
            margin-bottom: 10px;
        }
        .invoice-title {
            font-size: 30px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
        }
        .invoice-number {
            color: #475569;
            margin-top: 4px;
            font-size: 12px;
        }
        .cards {
            width: 100%;
            border-spacing: 0;
            margin-bottom: 18px;
        }
        .cards td {
            width: 33.33%;
            vertical-align: top;
            padding-right: 10px;
        }
        .card {
            border: 1px solid #dbe4f0;
            border-radius: 16px;
            padding: 14px;
            min-height: 108px;
        }
        .label {
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #64748b;
            font-size: 9px;
            margin-bottom: 8px;
        }
        .value-strong {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 6px;
        }
        .muted {
            color: #475569;
        }
        .section-title {
            font-size: 11px;
            font-weight: 700;
            color: #0f172a;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin: 18px 0 10px;
        }
        .line-items {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 18px;
        }
        .line-items th {
            text-align: left;
            padding: 10px 12px;
            background: #0f172a;
            color: #ffffff;
            font-size: 10px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }
        .line-items td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
        }
        .summary {
            width: 100%;
            margin-top: 8px;
        }
        .summary td {
            vertical-align: top;
        }
        .summary-left {
            width: 58%;
            padding-right: 16px;
        }
        .summary-right {
            width: 42%;
        }
        .totals {
            width: 100%;
            border-collapse: collapse;
            background: #f8fafc;
            border: 1px solid #dbe4f0;
            border-radius: 16px;
            overflow: hidden;
        }
        .totals td {
            padding: 10px 14px;
            border-bottom: 1px solid #e2e8f0;
        }
        .totals .final td {
            background: #0f172a;
            color: #ffffff;
            font-weight: 700;
            font-size: 13px;
        }
        .align-right {
            text-align: right;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            background: #e2e8f0;
            color: #0f172a;
        }
        .status-paid { background: #dcfce7; color: #166534; }
        .status-partial { background: #fef3c7; color: #92400e; }
        .status-open { background: #fee2e2; color: #991b1b; }
        .meta-grid {
            width: 100%;
            border-spacing: 0;
            margin-top: 16px;
        }
        .meta-grid td {
            width: 50%;
            vertical-align: top;
            padding-right: 12px;
        }
        .footer {
            margin-top: 22px;
            padding-top: 14px;
            border-top: 1px solid #dbe4f0;
            color: #64748b;
            font-size: 9px;
        }
        .small {
            font-size: 9px;
        }
    </style>
</head>
<body>
    @php
        $logoUrl = !empty($branding['logo_path']) ? public_path('storage/'.$branding['logo_path']) : null;
        $client = $invoice->client ?: $invoice->project?->client;
        $lead = $invoice->project?->lead;
        $isPaid = $invoice->status === 'paid';
        $isPartial = $invoice->status === 'partially_paid';
    @endphp

    <div class="page">
        <div class="top-band"></div>

        <table class="header">
            <tr>
                <td class="brand">
                    <div class="brand-box">
                        @if($logoUrl && file_exists($logoUrl))
                            <img src="{{ $logoUrl }}" class="logo" alt="Logo">
                        @else
                            <div class="brand-mark">{{ strtoupper(substr($branding['app_name'] ?? 'P', 0, 1)) }}</div>
                        @endif
                        <div>
                            <p class="app-name">{{ $issuer['business_name'] }}</p>
                            <div class="tagline">{{ $branding['app_tagline'] ?? '' }}</div>
                            <div class="small muted">{{ $issuer['document'] }} · {{ $issuer['city'] }}, {{ $issuer['country'] }}</div>
                        </div>
                    </div>
                </td>
                <td class="invoice-chip">
                    <div class="chip">Factura electrónica</div>
                    <p class="invoice-title">Factura</p>
                    <div class="invoice-number">{{ $invoice->invoice_number ?: 'INV-'.$invoice->id }}</div>
                </td>
            </tr>
        </table>

        <table class="cards">
            <tr>
                <td>
                    <div class="card">
                        <div class="label">Emisor</div>
                        <div class="value-strong">{{ $issuer['business_name'] }}</div>
                        <div class="muted">{{ $issuer['document'] }}</div>
                        <div class="muted">{{ $issuer['city'] }}, {{ $issuer['country'] }}</div>
                    </div>
                </td>
                <td>
                    <div class="card">
                        <div class="label">Cliente</div>
                        <div class="value-strong">{{ $client?->full_name ?: $lead?->name ?: 'Cliente' }}</div>
                        <div class="muted">{{ $client?->email ?: $lead?->email ?: 'Sin correo' }}</div>
                        <div class="muted">{{ $client?->phone ?: data_get($lead?->responses, 'phone') ?: 'Sin teléfono' }}</div>
                    </div>
                </td>
                <td>
                    <div class="card">
                        <div class="label">Estado</div>
                        <div>
                            <span class="status-badge {{ $isPaid ? 'status-paid' : ($isPartial ? 'status-partial' : 'status-open') }}">
                                {{ str_replace('_', ' ', $invoice->status) }}
                            </span>
                        </div>
                        <div class="muted" style="margin-top:10px;">Emisión: {{ optional($invoice->created_at)->format('d/m/Y') }}</div>
                        <div class="muted">Vencimiento: {{ optional($invoice->due_date)->format('d/m/Y') }}</div>
                    </div>
                </td>
            </tr>
        </table>

        <div class="section-title">Detalle facturado</div>
        <table class="line-items">
            <thead>
                <tr>
                    <th style="width:52%;">Concepto</th>
                    <th style="width:12%;">Cant.</th>
                    <th style="width:18%;" class="align-right">Unitario</th>
                    <th style="width:18%;" class="align-right">Importe</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>{{ $invoice->concept }}</strong><br>
                        <span class="muted">Proyecto: {{ $invoice->project?->name ?: 'Sin proyecto' }}</span>
                    </td>
                    <td>1</td>
                    <td class="align-right">${{ number_format((float) $invoice->subtotal, 2) }}</td>
                    <td class="align-right">${{ number_format((float) $invoice->subtotal, 2) }}</td>
                </tr>
            </tbody>
        </table>

        <table class="summary">
            <tr>
                <td class="summary-left">
                    <div class="section-title">Información fiscal</div>
                    <table class="meta-grid">
                        <tr>
                            <td>
                                <div class="card">
                                    <div class="label">ITBMS</div>
                                    <div class="value-strong">{{ $invoice->itbms_enabled ? number_format((float) $invoice->tax_rate, 2).'%' : 'Exento' }}</div>
                                    <div class="muted">Impuesto: ${{ number_format((float) $invoice->tax_amount, 2) }}</div>
                                </div>
                            </td>
                            <td>
                                <div class="card">
                                    <div class="label">Alanube</div>
                                    <div class="value-strong">{{ strtoupper($invoice->alanube_status ?: 'disabled') }}</div>
                                    <div class="muted">{{ $invoice->alanube_document_id ?: 'Sin envío registrado' }}</div>
                                </div>
                            </td>
                        </tr>
                    </table>

                    @if($invoice->alanube_cufe || $invoice->alanube_legal_status)
                        <div class="section-title">Trazabilidad electrónica</div>
                        <div class="card">
                            <div><strong>Estado legal:</strong> {{ $invoice->alanube_legal_status ?: 'N/D' }}</div>
                            <div style="margin-top:6px;"><strong>CUFE:</strong> <span class="small">{{ $invoice->alanube_cufe ?: 'N/D' }}</span></div>
                            @if($invoice->alanube_submitted_at)
                                <div style="margin-top:6px;"><strong>Enviado:</strong> {{ optional($invoice->alanube_submitted_at)->format('d/m/Y H:i') }}</div>
                            @endif
                        </div>
                    @endif
                </td>
                <td class="summary-right">
                    <table class="totals">
                        <tr>
                            <td>Subtotal</td>
                            <td class="align-right">${{ number_format((float) $invoice->subtotal, 2) }}</td>
                        </tr>
                        <tr>
                            <td>ITBMS</td>
                            <td class="align-right">${{ number_format((float) $invoice->tax_amount, 2) }}</td>
                        </tr>
                        <tr>
                            <td>Pagado</td>
                            <td class="align-right">${{ number_format((float) $invoice->total - (float) $invoice->balance_due, 2) }}</td>
                        </tr>
                        <tr>
                            <td>Saldo pendiente</td>
                            <td class="align-right">${{ number_format((float) $invoice->balance_due, 2) }}</td>
                        </tr>
                        <tr class="final">
                            <td>Total</td>
                            <td class="align-right">${{ number_format((float) $invoice->total, 2) }}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <div class="footer">
            Este documento fue generado por {{ $branding['app_name'] ?? 'PhotOS' }}.
            @if($invoice->alanube_xml_url)
                XML disponible en Alanube.
            @endif
        </div>
    </div>
</body>
</html>
