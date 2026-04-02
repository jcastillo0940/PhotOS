<?php

use App\Support\GalleryTemplate;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('photographer')->after('password');
        });

        $hasDeveloper = DB::table('users')->where('role', 'developer')->exists();

        if (!$hasDeveloper) {
            $firstUserId = DB::table('users')->orderBy('id')->value('id');

            if ($firstUserId) {
                DB::table('users')->where('id', $firstUserId)->update(['role' => 'developer']);
            }
        }

        if (Schema::hasTable('settings') && !DB::table('settings')->where('key', GalleryTemplate::SETTING_KEY)->exists()) {
            DB::table('settings')->insert([
                'key' => GalleryTemplate::SETTING_KEY,
                'value' => config('gallery_templates.default', 'cinematic-dark'),
                'group' => 'installation',
                'is_secret' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('settings')) {
            DB::table('settings')->where('key', GalleryTemplate::SETTING_KEY)->delete();
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};

