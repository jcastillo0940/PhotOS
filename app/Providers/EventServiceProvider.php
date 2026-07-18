<?php

namespace App\Providers;

use App\Modules\Billing\Events\InvoiceCreated;
use App\Modules\Billing\Events\PaymentReceived;
use App\Modules\Billing\Events\SubscriptionActivated;
use App\Modules\Billing\Listeners\TriggerInvoiceAutomations;
use App\Modules\Contracts\Events\ContractSigned;
use App\Modules\Domains\Events\DomainConnected;
use App\Modules\Gallery\Events\GalleryViewed;
use App\Modules\Leads\Events\LeadCreated;
use App\Modules\Leads\Events\LeadStatusChanged;
use App\Modules\Leads\Listeners\TriggerLeadAutomations;
use App\Modules\MediaProcessing\Events\FaceIdentityConfirmed;
use App\Modules\Projects\Events\GalleryPublished;
use App\Modules\Projects\Events\ProjectCreated;
use App\Modules\Projects\Events\ProjectDeleted;
use App\Modules\Projects\Listeners\TriggerProjectAutomations;
use App\Modules\SaasManagement\Events\TenantProvisioned;
use App\Modules\SaasManagement\Events\TenantSuspended;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        ProjectCreated::class => [
            TriggerProjectAutomations::class,
        ],
        LeadCreated::class => [
            TriggerLeadAutomations::class,
        ],
        InvoiceCreated::class => [
            TriggerInvoiceAutomations::class,
        ],
        PaymentReceived::class => [],
        SubscriptionActivated::class => [],
        ContractSigned::class => [],
        GalleryPublished::class => [],
        GalleryViewed::class => [],
        ProjectDeleted::class => [],
        LeadStatusChanged::class => [],
        FaceIdentityConfirmed::class => [],
        TenantProvisioned::class => [],
        TenantSuspended::class => [],
        DomainConnected::class => [],
    ];

    public function boot(): void {}

    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
