<?php

namespace App\Support;

class LeadBriefingTemplate
{
    public static function forEventType(?string $eventType): array
    {
        $normalized = strtolower(trim((string) $eventType));

        return match ($normalized) {
            'wedding' => [
                ['key' => 'venue_name', 'label' => 'Lugar del evento', 'type' => 'text', 'required' => true],
                ['key' => 'guest_count', 'label' => 'Numero aproximado de invitados', 'type' => 'number', 'required' => false],
                ['key' => 'ceremony_time', 'label' => 'Hora de ceremonia', 'type' => 'text', 'required' => false],
                ['key' => 'reception_time', 'label' => 'Hora de recepcion', 'type' => 'text', 'required' => false],
                ['key' => 'planner_contact', 'label' => 'Planner o contacto principal', 'type' => 'text', 'required' => false],
                ['key' => 'family_notes', 'label' => 'Momentos o personas importantes que no debemos perder', 'type' => 'textarea', 'required' => false],
            ],
            'portrait' => [
                ['key' => 'session_goal', 'label' => 'Objetivo principal de la sesion', 'type' => 'textarea', 'required' => true],
                ['key' => 'wardrobe_changes', 'label' => 'Cantidad de cambios de vestuario', 'type' => 'number', 'required' => false],
                ['key' => 'location_preference', 'label' => 'Ubicacion preferida', 'type' => 'text', 'required' => false],
                ['key' => 'usage', 'label' => 'Como usaras las fotos', 'type' => 'select', 'required' => false, 'options' => ['Personal', 'Marca personal', 'Editorial', 'Corporativo']],
                ['key' => 'hair_makeup', 'label' => 'Necesitas hair & makeup', 'type' => 'select', 'required' => false, 'options' => ['Si', 'No', 'Tal vez']],
                ['key' => 'visual_references', 'label' => 'Referencias visuales o mood deseado', 'type' => 'textarea', 'required' => false],
            ],
            'commercial' => [
                ['key' => 'brand_name', 'label' => 'Marca o empresa', 'type' => 'text', 'required' => true],
                ['key' => 'campaign_goal', 'label' => 'Objetivo de la campana', 'type' => 'textarea', 'required' => true],
                ['key' => 'deliverables', 'label' => 'Entregables esperados', 'type' => 'textarea', 'required' => false],
                ['key' => 'usage_rights', 'label' => 'Uso de imagen', 'type' => 'select', 'required' => false, 'options' => ['Digital', 'Impreso', 'Ambos']],
                ['key' => 'shoot_date_window', 'label' => 'Ventana ideal de produccion', 'type' => 'text', 'required' => false],
                ['key' => 'team_contacts', 'label' => 'Contactos clave del equipo', 'type' => 'textarea', 'required' => false],
            ],
            default => [
                ['key' => 'event_location', 'label' => 'Lugar estimado', 'type' => 'text', 'required' => false],
                ['key' => 'event_schedule', 'label' => 'Horario estimado', 'type' => 'text', 'required' => false],
                ['key' => 'priority_moments', 'label' => 'Momentos o detalles importantes', 'type' => 'textarea', 'required' => false],
                ['key' => 'special_requirements', 'label' => 'Requerimientos especiales', 'type' => 'textarea', 'required' => false],
            ],
        };
    }
}
