<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('cloudflare:status')]
#[Description('Checks S3/Cloudflare R2 connectivity by uploading a test file.')]
class CheckR2Status extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Checking Cloudflare R2 Connection...");
        try {
            \Illuminate\Support\Facades\Storage::disk('r2')->put('ping.txt', 'PONG - ' . now()->toDateTimeString());
            $this->info("SUCCESS: Reached R2 bucket and wrote test file smoothly!");
            
            // Delete immediately
            \Illuminate\Support\Facades\Storage::disk('r2')->delete('ping.txt');
            $this->info("SUCCESS: Reached R2 bucket and deleted test file cleanly!");
        } catch (\Exception $e) {
            $this->error("FAILED to connect to R2: " . $e->getMessage());
        }
    }
}
