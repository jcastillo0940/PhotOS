@php
    $project = $collaborator->project;
    $inviter = $collaborator->invitedBy;
@endphp
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Invitacion de proyecto</title>
</head>
<body style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
    <h1 style="font-size: 22px; margin-bottom: 12px;">Tienes una invitacion para colaborar</h1>
    <p>
        {{ $inviter?->name ?? 'El equipo del estudio' }} te invito a trabajar en el proyecto
        <strong>{{ $project?->name ?? 'Proyecto' }}</strong>.
    </p>
    <p>
        Usa este enlace para abrir la invitacion:
        <br>
        <a href="{{ $invitationUrl }}">{{ $invitationUrl }}</a>
    </p>
    <p>
        Codigo de acceso: <strong>{{ $collaborator->access_code }}</strong>
    </p>
    <p>
        Primero inicia sesion con tu cuenta de fotografo y luego confirma el codigo.
    </p>
</body>
</html>
