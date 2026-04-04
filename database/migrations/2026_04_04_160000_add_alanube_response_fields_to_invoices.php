<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('alanube_document_id')->nullable()->after('alanube_status');
            $table->string('alanube_legal_status')->nullable()->after('alanube_document_id');
            $table->string('alanube_cufe')->nullable()->after('alanube_legal_status');
            $table->text('alanube_xml_url')->nullable()->after('alanube_cufe');
            $table->text('alanube_qr_url')->nullable()->after('alanube_xml_url');
            $table->json('alanube_response')->nullable()->after('alanube_qr_url');
            $table->timestamp('alanube_submitted_at')->nullable()->after('alanube_response');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn([
                'alanube_document_id',
                'alanube_legal_status',
                'alanube_cufe',
                'alanube_xml_url',
                'alanube_qr_url',
                'alanube_response',
                'alanube_submitted_at',
            ]);
        });
    }
};
