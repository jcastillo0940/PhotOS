<?php

namespace App\Console\Commands;

use App\Services\FaceRecognitionService;
use Illuminate\Console\Command;

class ConsumeFaceRecognitionResults extends Command
{
    protected $signature = 'face-ai:consume-results {--once : Procesa un solo mensaje y termina} {--timeout=5 : Segundos de espera por cada BLPOP}';
    protected $description = 'Consume resultados del worker de reconocimiento facial desde Redis';

    public function handle(FaceRecognitionService $service): int
    {
        $processed = 0;
        $timeout = max(1, (int) $this->option('timeout'));

        do {
            $message = $service->popNextResult($timeout);

            if (!$message) {
                if ($this->option('once')) {
                    break;
                }

                continue;
            }

            $service->processWorkerResult($message);
            $processed++;
            $this->info('Resultado IA procesado.');
        } while (!$this->option('once'));

        $this->line("Mensajes procesados: {$processed}");

        return self::SUCCESS;
    }
}