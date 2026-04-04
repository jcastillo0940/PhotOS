<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->string('status')->default('pending')->after('type');
            $table->string('payment_status')->default('unpaid')->after('status');
            $table->string('source')->default('admin')->after('payment_status');
            $table->string('client_name')->nullable()->after('source');
            $table->string('client_email')->nullable()->after('client_name');
            $table->string('client_phone')->nullable()->after('client_email');
            $table->string('timezone')->default('America/Panama')->after('client_phone');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->decimal('subtotal', 12, 2)->default(0)->after('amount');
            $table->decimal('tax_rate', 5, 2)->default(7)->after('subtotal');
            $table->decimal('tax_amount', 12, 2)->default(0)->after('tax_rate');
            $table->decimal('total', 12, 2)->default(0)->after('tax_amount');
            $table->decimal('balance_due', 12, 2)->default(0)->after('total');
            $table->boolean('itbms_enabled')->default(true)->after('balance_due');
            $table->boolean('alanube_enabled')->default(false)->after('itbms_enabled');
            $table->string('alanube_status')->default('disabled')->after('alanube_enabled');
            $table->string('invoice_number')->nullable()->after('concept');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn([
                'status',
                'payment_status',
                'source',
                'client_name',
                'client_email',
                'client_phone',
                'timezone',
            ]);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn([
                'subtotal',
                'tax_rate',
                'tax_amount',
                'total',
                'balance_due',
                'itbms_enabled',
                'alanube_enabled',
                'alanube_status',
                'invoice_number',
            ]);
        });
    }
};
