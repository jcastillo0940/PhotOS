<?php

namespace App\Services\Billing;

use App\Models\Invoice;
use App\Models\Setting;
use Illuminate\Support\Facades\Http;

class AlanubeService
{
    public function enabled(): bool
    {
        return filter_var(Setting::get('alanube_enabled', '0'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? false;
    }

    public function submitInvoice(Invoice $invoice): array
    {
        if (!$this->enabled()) {
            return ['ok' => false, 'message' => 'Alanube esta desactivado en configuracion.'];
        }

        $url = rtrim((string) Setting::get('alanube_api_url', ''), '/');
        $key = (string) Setting::get('alanube_api_key', '');

        if (!$url || !$key) {
            return ['ok' => false, 'message' => 'Faltan credenciales o URL de Alanube.'];
        }

        $response = Http::timeout(20)
            ->withToken($key)
            ->acceptJson()
            ->post($url.'/invoices', $this->payload($invoice));

        if ($response->failed()) {
            return [
                'ok' => false,
                'message' => $response->json('message') ?: 'Alanube rechazo la factura.',
                'status' => $response->status(),
                'body' => $response->json(),
            ];
        }

        return [
            'ok' => true,
            'data' => $response->json(),
        ];
    }

    public function probeConnection(): array
    {
        if (!$this->enabled()) {
            return ['ok' => false, 'message' => 'Alanube esta desactivado en configuracion.'];
        }

        $url = rtrim((string) Setting::get('alanube_api_url', ''), '/');
        $key = (string) Setting::get('alanube_api_key', '');

        if (!$url || !$key) {
            return ['ok' => false, 'message' => 'Faltan credenciales o URL de Alanube.'];
        }

        $response = Http::timeout(20)
            ->withToken($key)
            ->acceptJson()
            ->get($url.'/invoices');

        if ($response->successful()) {
            return [
                'ok' => true,
                'message' => 'Conexion con Alanube verificada correctamente.',
                'status' => $response->status(),
            ];
        }

        return [
            'ok' => false,
            'message' => $response->json('message') ?: 'No fue posible validar Alanube.',
            'status' => $response->status(),
            'body' => $response->json(),
        ];
    }

    private function payload(Invoice $invoice): array
    {
        $project = $invoice->project;
        $client = $invoice->client;
        $ruc = (string) Setting::get('alanube_test_ruc', '155709116-2-2021');
        $numerationBase = (string) Setting::get('alanube_invoice_range', '9630001-9631000');
        [$rangeStart] = array_pad(explode('-', $numerationBase, 2), 2, null);
        $numeration = str_pad((string) ((int) ($rangeStart ?: 1) + max(0, ((int) $invoice->id) - 1)), 10, '0', STR_PAD_LEFT);
        $phone = $this->normalizePhone($client?->phone ?: data_get($project?->lead?->responses, 'phone'));
        $total = (float) $invoice->total;
        $transfer = (float) $invoice->subtotal;
        $itbmsRate = $invoice->itbms_enabled ? '01' : '00';

        return [
            'information' => [
                'issueType' => '01',
                'documentType' => '01',
                'numeration' => $numeration,
                'billingPoint' => '001',
                'securityCode' => str_pad((string) random_int(1, 999999999), 9, '0', STR_PAD_LEFT),
                'cafe' => [
                    'format' => 3,
                    'delivery' => 3,
                ],
                'nature' => '01',
                'operationType' => 1,
                'information' => $invoice->concept,
                'destination' => 1,
                'receiverContainer' => 1,
                'saleType' => 1,
                'issueDate' => now('America/Panama')->format('Y-m-d\TH:i:sP'),
            ],
            'receiver' => [
                'type' => '01',
                'ruc' => [
                    'type' => 2,
                    'ruc' => $ruc,
                ],
                'name' => $client?->full_name ?: $project?->lead?->name ?: 'Cliente de prueba',
                'address' => 'Panama, Panama',
                'location' => [
                    'code' => '8-8-8',
                    'correction' => 'Pueblo Nuevo',
                    'district' => 'Panama',
                    'province' => 'Panama',
                ],
                'telephones' => [$phone],
                'emails' => [$client?->email ?: $project?->lead?->email ?: Setting::get('alanube_email', 'tjclogistics@alanube.co')],
                'country' => 'PA',
            ],
            'items' => [[
                'number' => '0001',
                'description' => $invoice->concept,
                'code' => '0001',
                'unit' => 'und',
                'quantity' => 1,
                'cpbs' => [
                    'code' => '8210',
                    'unit' => 'und',
                ],
                'prices' => [
                    'transfer' => $transfer,
                    'discount' => 0,
                    'transport' => 0,
                    'insurance' => 0,
                ],
                'itbms' => [
                    'rate' => $itbmsRate,
                ],
                'isc' => [
                    'rate' => 0,
                    'amount' => 0,
                ],
            ]],
            'totals' => [
                'change' => 0,
                'transport' => 0,
                'insurance' => 0,
                'paymentTime' => 1,
                'paymentMethods' => [[
                    'type' => '01',
                    'amount' => $total,
                ]],
            ],
        ];
    }

    private function normalizePhone(?string $phone): string
    {
        $digits = preg_replace('/\D+/', '', (string) $phone);

        if (strlen($digits) >= 8) {
            return substr($digits, 0, 4).'-'.substr($digits, 4, 4);
        }

        return '1234-5678';
    }
}
