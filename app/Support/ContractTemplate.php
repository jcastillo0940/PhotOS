<?php

namespace App\Support;

use App\Models\Contract;
use App\Models\Project;
use App\Models\Setting;

class ContractTemplate
{
    public static function presets(): array
    {
        return [
            [
                'key' => 'wedding',
                'label' => 'Boda',
                'description' => 'Contrato de fotografia de boda con arras, privacidad y jurisdiccion.',
                'content' => self::weddingTemplate(),
            ],
            [
                'key' => 'portrait',
                'label' => 'Retrato',
                'description' => 'Sesion editorial o de marca personal.',
                'content' => self::portraitTemplate(),
            ],
            [
                'key' => 'commercial',
                'label' => 'Comercial',
                'description' => 'Producciones para marcas, campanas y contenido corporativo.',
                'content' => self::commercialTemplate(),
            ],
            [
                'key' => 'event',
                'label' => 'Evento',
                'description' => 'Cobertura de eventos privados o corporativos.',
                'content' => self::eventTemplate(),
            ],
        ];
    }

    public static function variableCatalog(): array
    {
        return [
            ['token' => '[city]', 'label' => 'Ciudad del contrato'],
            ['token' => '[contract_day]', 'label' => 'Dia del contrato'],
            ['token' => '[contract_month]', 'label' => 'Mes del contrato'],
            ['token' => '[contract_year]', 'label' => 'Ano del contrato'],
            ['token' => '[photographer_name]', 'label' => 'Nombre del fotografo'],
            ['token' => '[photographer_business]', 'label' => 'Nombre comercial'],
            ['token' => '[client_names]', 'label' => 'Nombre del cliente'],
            ['token' => '[client_email]', 'label' => 'Email del cliente'],
            ['token' => '[client_phone]', 'label' => 'Telefono del cliente'],
            ['token' => '[event_type]', 'label' => 'Tipo de evento'],
            ['token' => '[event_date]', 'label' => 'Fecha del evento'],
            ['token' => '[project_name]', 'label' => 'Nombre del proyecto'],
            ['token' => '[location]', 'label' => 'Ubicacion'],
            ['token' => '[reservation_amount]', 'label' => 'Monto de reserva'],
            ['token' => '[remaining_amount]', 'label' => 'Saldo pendiente'],
            ['token' => '[balance_due_date]', 'label' => 'Fecha limite de pago'],
            ['token' => '[privacy_fee]', 'label' => 'Cargo por privacidad'],
            ['token' => '[photographer_document]', 'label' => 'Cedula o RUC del fotografo'],
            ['token' => '[client_document]', 'label' => 'Cedula del cliente'],
            ['token' => '[jurisdiction_country]', 'label' => 'Pais o jurisdiccion'],
        ];
    }

    public static function render(Contract $contract): string
    {
        $variables = self::variablesForContract($contract);

        return str_replace(
            array_keys($variables),
            array_values($variables),
            $contract->content ?? ''
        );
    }

    public static function variablesForContract(Contract $contract): array
    {
        $contract->loadMissing('project.lead', 'project.owner', 'project.invoices');

        return self::variablesForProject($contract->project, $contract);
    }

    public static function variablesForProject(?Project $project, ?Contract $contract = null): array
    {
        $lead = $project?->lead;
        $owner = $project?->owner;
        $invoices = $project?->invoices ?? collect();
        $reservation = $invoices->first();
        $remaining = $invoices->skip(1)->sum('amount');
        $contractDate = $contract?->created_at ?? now();
        $contractData = $contract?->contract_data ?? [];

        $values = [
            'city' => $contractData['city'] ?? Setting::get('legal_city') ?? $project?->location ?: 'Panama',
            'contract_day' => $contractDate->format('d'),
            'contract_month' => $contractDate->translatedFormat('F'),
            'contract_year' => $contractDate->format('Y'),
            'photographer_name' => $owner?->name ?: 'Nombre del Fotografo',
            'photographer_business' => $contractData['photographer_business'] ?? Setting::get('photographer_business_name') ?? $owner?->name ?: 'Nombre del Fotografo/Empresa',
            'client_names' => $lead?->name ?: 'Nombres de los Clientes',
            'client_email' => $lead?->email ?: 'correo@cliente.com',
            'client_phone' => data_get($lead?->responses, 'phone') ?: 'Telefono del cliente',
            'event_type' => $lead?->event_type ?: 'Evento',
            'event_date' => optional($project?->event_date)->format('F j, Y') ?: 'Fecha del evento',
            'project_name' => $project?->name ?: 'Nombre del proyecto',
            'location' => $contractData['location'] ?? $project?->location ?: 'Ubicacion por definir',
            'reservation_amount' => self::money($contractData['reservation_amount'] ?? $reservation?->amount),
            'remaining_amount' => self::money($contractData['remaining_amount'] ?? $remaining),
            'balance_due_date' => $contractData['balance_due_date'] ?? $reservation?->due_date?->format('F j, Y') ?: 'Fecha limite',
            'privacy_fee' => self::money($contractData['privacy_fee'] ?? Setting::get('default_privacy_fee', 150)),
            'photographer_document' => $contractData['photographer_document'] ?? Setting::get('photographer_document') ?? 'Cedula / RUC',
            'client_document' => $contractData['client_document'] ?? data_get($lead?->responses, 'client_document') ?: 'Cedula del cliente',
            'jurisdiction_country' => $contractData['jurisdiction_country'] ?? Setting::get('jurisdiction_country', 'Panama'),
        ];

        $replacements = [];

        foreach ($values as $key => $value) {
            $replacements["[{$key}]"] = $value;
            $replacements['{{'.$key.'}}'] = $value;
        }

        return $replacements;
    }

    public static function defaultTemplateForEventType(?string $eventType): string
    {
        return match (strtolower((string) $eventType)) {
            'wedding', 'boda' => self::weddingTemplate(),
            'portrait', 'retrato' => self::portraitTemplate(),
            'commercial', 'comercial' => self::commercialTemplate(),
            default => self::eventTemplate(),
        };
    }

    private static function weddingTemplate(): string
    {
        return <<<'HTML'
<p style="font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:#7c7c7c;margin-bottom:18px;">Contrato de prestacion de servicios de fotografia</p>
<p style="font-size:16px;line-height:1.8;color:#333333;margin:0 0 20px 0;">En la Ciudad de [city], Republica de [jurisdiction_country], al dia [contract_day] de [contract_month] de [contract_year], entre los suscritos a saber: [photographer_business] ([photographer_name]) y [client_names] (LOS CLIENTES), se acuerda lo siguiente:</p>
<h2 style="font-size:18px;margin:28px 0 10px;color:#111111;">PRIMERA: OBJETO Y FECHA</h2>
<p style="font-size:15px;line-height:1.8;color:#333333;margin:0;">EL FOTOGRAFO realizara la cobertura fotografica de la boda de LOS CLIENTES el dia [event_date], bajo el proyecto [project_name].</p>
<h2 style="font-size:18px;margin:28px 0 10px;color:#111111;">SEGUNDA: RETENCION POR RESERVA DE FECHA (ARRAS)</h2>
<p style="font-size:15px;line-height:1.8;color:#333333;margin:0;">A la firma de este contrato, LOS CLIENTES entregan la suma de [reservation_amount] en concepto de Retencion por Reserva de Fecha (Arras Confirmativas).</p>
<p style="font-size:15px;line-height:1.8;color:#333333;margin:12px 0 0 0;">Este monto no es reembolsable, ya que compensa la exclusividad de la fecha y la perdida de otros contratos potenciales para ese mismo dia por parte del FOTOGRAFO. El saldo restante de [remaining_amount] se pagara antes del [balance_due_date].</p>
<h2 style="font-size:18px;margin:28px 0 10px;color:#111111;">TERCERA: DERECHOS DE AUTOR Y EXCLUSIVIDAD DE PRIVACIDAD</h2>
<p style="font-size:15px;line-height:1.8;color:#333333;margin:0;">Regla General: EL FOTOGRAFO mantiene los derechos morales y podra usar las fotos en su portafolio profesional.</p>
<p style="font-size:15px;line-height:1.8;color:#333333;margin:12px 0 0 0;">Opcion de Privacidad: Si LOS CLIENTES desean que sus imagenes no sean publicadas en redes sociales o portafolio comercial, podran optar por la Exclusividad de Privacidad mediante un cargo adicional de [privacy_fee], compensando el impacto en el mercadeo del FOTOGRAFO.</p>
<h2 style="font-size:18px;margin:28px 0 10px;color:#111111;">CUARTA: COMPROBANTES DE PAGO</h2>
<p style="font-size:15px;line-height:1.8;color:#333333;margin:0;">Por cada pago recibido, EL FOTOGRAFO se obliga a entregar un recibo de pago o factura legal correspondiente, cumpliendo con las normativas vigentes.</p>
<h2 style="font-size:18px;margin:28px 0 10px;color:#111111;">QUINTA: JURISDICCION</h2>
<p style="font-size:15px;line-height:1.8;color:#333333;margin:0;">Este contrato se rige por las leyes de [jurisdiction_country].</p>
<div style="margin-top:48px;padding-top:24px;border-top:1px solid #e8e8e8;display:grid;grid-template-columns:1fr 1fr;gap:32px;">
    <div>
        <p style="margin:0 0 48px 0;">____________________________________________________</p>
        <p style="margin:0;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#7c7c7c;">EL FOTOGRAFO</p>
        <p style="margin:8px 0 0 0;font-size:14px;color:#333333;">Cedula / R.U.C.: [photographer_document]</p>
    </div>
    <div>
        <p style="margin:0 0 48px 0;">____________________________________________________</p>
        <p style="margin:0;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#7c7c7c;">LOS CLIENTES</p>
        <p style="margin:8px 0 0 0;font-size:14px;color:#333333;">Cedulas: [client_document]</p>
    </div>
</div>
HTML;
    }

    private static function portraitTemplate(): string
    {
        return <<<'HTML'
<p style="font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:#7c7c7c;margin-bottom:18px;">Contrato de sesion fotografica</p>
<p style="font-size:16px;line-height:1.8;color:#333333;margin:0 0 20px 0;">Entre [photographer_business] y [client_names], se acuerda la realizacion de una sesion de [event_type] programada para el [event_date] en [location].</p>
<h2 style="font-size:18px;margin:28px 0 10px;color:#111111;">SERVICIO</h2>
<p style="font-size:15px;line-height:1.8;color:#333333;margin:0;">El servicio cubre direccion fotografica, captura, curaduria y entrega digital segun el proyecto [project_name].</p>
<h2 style="font-size:18px;margin:28px 0 10px;color:#111111;">PAGOS</h2>
<p style="font-size:15px;line-height:1.8;color:#333333;margin:0;">Reserva: [reservation_amount]. Saldo restante: [remaining_amount], pagadero antes del [balance_due_date].</p>
<h2 style="font-size:18px;margin:28px 0 10px;color:#111111;">USO DE IMAGEN</h2>
<p style="font-size:15px;line-height:1.8;color:#333333;margin:0;">El fotografo podra utilizar una seleccion de imagenes con fines de portafolio salvo acuerdo escrito en contrario.</p>
HTML;
    }

    private static function commercialTemplate(): string
    {
        return <<<'HTML'
<p style="font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:#7c7c7c;margin-bottom:18px;">Acuerdo de produccion fotografica comercial</p>
<p style="font-size:16px;line-height:1.8;color:#333333;margin:0 0 20px 0;">[photographer_business] realizara la cobertura y produccion visual del proyecto [project_name] para [client_names], correspondiente a [event_type].</p>
<h2 style="font-size:18px;margin:28px 0 10px;color:#111111;">ALCANCE</h2>
<p style="font-size:15px;line-height:1.8;color:#333333;margin:0;">La produccion se ejecutara el [event_date] en [location], incluyendo entrega digital y uso segun lo acordado entre las partes.</p>
<h2 style="font-size:18px;margin:28px 0 10px;color:#111111;">HONORARIOS</h2>
<p style="font-size:15px;line-height:1.8;color:#333333;margin:0;">Reserva inicial: [reservation_amount]. Saldo pendiente: [remaining_amount], antes del [balance_due_date].</p>
<h2 style="font-size:18px;margin:28px 0 10px;color:#111111;">DERECHOS DE USO</h2>
<p style="font-size:15px;line-height:1.8;color:#333333;margin:0;">Los derechos de uso y reproduccion se definen especificamente para esta campana o proyecto comercial.</p>
HTML;
    }

    private static function eventTemplate(): string
    {
        return <<<'HTML'
<p style="font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:#7c7c7c;margin-bottom:18px;">Contrato de cobertura fotografica</p>
<p style="font-size:16px;line-height:1.8;color:#333333;margin:0 0 20px 0;">[photographer_business] acuerda prestar servicios de cobertura para [client_names] en el evento [project_name] el dia [event_date].</p>
<h2 style="font-size:18px;margin:28px 0 10px;color:#111111;">SERVICIO</h2>
<p style="font-size:15px;line-height:1.8;color:#333333;margin:0;">La cobertura se realizara en [location] e incluye captura, seleccion y entrega digital segun el paquete contratado.</p>
<h2 style="font-size:18px;margin:28px 0 10px;color:#111111;">CONDICIONES DE PAGO</h2>
<p style="font-size:15px;line-height:1.8;color:#333333;margin:0;">Reserva: [reservation_amount]. Saldo restante: [remaining_amount]. Fecha limite de pago: [balance_due_date].</p>
HTML;
    }

    private static function money(float|int|string|null $amount): string
    {
        if ($amount === null || $amount === '' || (float) $amount === 0.0) {
            return 'B/. 0.00';
        }

        return 'B/. '.number_format((float) $amount, 2);
    }
}
