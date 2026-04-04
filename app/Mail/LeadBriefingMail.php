<?php

namespace App\Mail;

use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class LeadBriefingMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Lead $lead,
        public string $url,
    ) {}

    public function build(): self
    {
        return $this->subject('Formulario de detalles para tu evento')
            ->view('emails.leads.briefing');
    }
}
