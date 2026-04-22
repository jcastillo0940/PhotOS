<?php

namespace App\Jobs;

use App\Models\DomainOrder;
use App\Services\Saas\DomainProvisioningService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SyncDomainProvisioningJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $domainOrderId,
    ) {
    }

    public function handle(DomainProvisioningService $provisioning): void
    {
        $order = DomainOrder::withoutGlobalScope('tenant')->find($this->domainOrderId);

        if (! $order) {
            return;
        }

        if (in_array($order->status, ['active', 'cancelled'], true)) {
            return;
        }

        try {
            $order = $provisioning->syncOrderStatus($order);

            if ($order->status !== 'active' && $order->verification_attempts < 24) {
                static::dispatch($order->id)->delay(now()->addMinutes(5));
            }
        } catch (\Throwable $e) {
            $order->forceFill([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'last_checked_at' => now(),
                'next_check_at' => null,
            ])->save();
        }
    }
}
