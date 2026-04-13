<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_collaborators', function (Blueprint $table) {
            $table->string('access_token_hash', 64)->nullable()->after('access_code');
        });

        DB::table('project_collaborators')
            ->select(['id', 'access_token', 'access_token_hash'])
            ->orderBy('id')
            ->chunkById(100, function ($collaborators) {
                foreach ($collaborators as $collaborator) {
                    $token = (string) ($collaborator->access_token ?? '');

                    if ($token === '') {
                        continue;
                    }

                    $hash = (string) ($collaborator->access_token_hash ?? '');

                    try {
                        $plain = Crypt::decryptString($token);
                    } catch (Throwable $e) {
                        $plain = $token;
                    }

                    DB::table('project_collaborators')
                        ->where('id', $collaborator->id)
                        ->update([
                            'access_token' => Crypt::encryptString($plain),
                            'access_token_hash' => $hash !== '' ? $hash : hash('sha256', $plain),
                        ]);
                }
            });

        Schema::table('project_collaborators', function (Blueprint $table) {
            $table->unique('access_token_hash');
        });
    }

    public function down(): void
    {
        DB::table('project_collaborators')
            ->select(['id', 'access_token'])
            ->orderBy('id')
            ->chunkById(100, function ($collaborators) {
                foreach ($collaborators as $collaborator) {
                    $token = (string) ($collaborator->access_token ?? '');

                    if ($token === '') {
                        continue;
                    }

                    try {
                        $plain = Crypt::decryptString($token);
                    } catch (Throwable $e) {
                        $plain = $token;
                    }

                    DB::table('project_collaborators')
                        ->where('id', $collaborator->id)
                        ->update(['access_token' => $plain]);
                }
            });

        Schema::table('project_collaborators', function (Blueprint $table) {
            $table->dropUnique(['access_token_hash']);
            $table->dropColumn('access_token_hash');
        });
    }
};
