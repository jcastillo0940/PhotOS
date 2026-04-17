# Planes Actuales y Limites del Sistema

Fecha de revision: 2026-04-17

## 1. Objetivo

Este documento resume los planes actualmente definidos en el proyecto `PhotOS`, los limites configurados para cada uno, donde se aplican realmente en el codigo y que inconsistencias existen hoy entre:

- planes de instalacion/locales del estudio
- planes SaaS por tenant
- pantallas de onboarding y administracion
- enforcement real en runtime

La revision se hizo directamente sobre el codigo fuente del workspace actual.

## 2. Resumen Ejecutivo

Hoy el sistema tiene dos capas distintas de planes:

1. Planes de instalacion/locales
   Se definen en `config/photography_plans.php` y controlan limites operativos por proyecto/evento, como retencion, descargas semanales, storage por evento, acceso a templates y watermark.

2. Planes SaaS por tenant
   Se guardan en la tabla `saas_plans` y se siembran desde `database/seeders/SaasConfigurationSeeder.php`. Controlan limites de cuenta/tenant como proyectos, storage SaaS, escaneos IA mensuales, staff y custom domain.

Conclusiones principales:

- Los planes locales estan bastante claros y si influyen en la operacion de proyectos.
- Los planes SaaS existen, pero su enforcement es parcial.
- Hay inconsistencias de naming entre `starter/professional/studio_gold` y `starter/studio/scale`.
- Algunas validaciones usan limites SaaS que hoy no se consumen o no se descuentan correctamente.
- Hay limites mostrados en UI que pueden no reflejar el consumo real.

## 3. Capa A: Planes de Instalacion / Locales

Fuente principal:

- `config/photography_plans.php`
- `app/Support/InstallationPlan.php`

Plan por defecto:

- `essential`

Planes actuales:

### 3.1 Plan Essential

Codigo: `essential`

- Nombre: `Plan Essential`
- Precio: `$200 / año`
- Billing: `Anual`
- Storage por evento: `3 GB`
- Retencion de originales: `30 dias`
- Descargas por cliente: `1 por semana`
- Templates permitidos: IDs `1, 2, 3, 4`
- Watermark: `platform_forced`
- Custom domain: `false`
- Maximo de originales: `3221225472 bytes` (`3 GB`)

Highlights declarados:

- 3GB de originales por evento
- Retencion de 30 dias
- 1 descarga semanal por cliente
- Solo plantillas basicas
- Marca de agua obligatoria

### 3.2 Plan Pro Studio

Codigo: `pro_studio`

- Nombre: `Plan Pro Studio`
- Precio: `$600 / año`
- Billing: `Anual`
- Storage por evento: `10 GB`
- Retencion de originales: `90 dias`
- Descargas por cliente: `6 por semana`
- Templates permitidos: `all`
- Watermark: `photographer_custom`
- Custom domain: `true`
- Maximo de originales: `10737418240 bytes` (`10 GB`)

Highlights declarados:

- 10GB de originales por evento
- Retencion de 90 dias
- 6 descargas semanales por cliente
- Acceso a todas las plantillas
- Marca de agua personalizada
- Custom domain disponible

### 3.3 Notas tecnicas de esta capa

Tambien se define en `config/photography_plans.php`:

- Hosting estimado: `$12 - $15 USD mensuales`
- Layout de bucket:
  - `{event_id}/originals/`
  - `{event_id}/web/`
- Notas:
  - galeria publica desde `/web/`
  - originales en `/originals/`
  - versiones web en `WEBP`
  - descargas validadas con ventana de 7 dias

## 4. Capa B: Planes SaaS por Tenant

Fuentes principales:

- `database/seeders/SaasConfigurationSeeder.php`
- `app/Models/SaasPlan.php`
- `app/Models/Tenant.php`
- `app/Services/Billing/TenantBillingService.php`

### 4.1 Planes SaaS sembrados actualmente

#### Starter (Free)

Codigo: `starter`

- `projects_limit`: `1`
- `storage_gb`: `1`
- `ai_scans_monthly`: `50`
- `watermark`: `branded`
- `staff_limit`: `1`
- `custom_domain`: `false`
- `price_monthly`: `0`
- `price_yearly`: `0`

#### Professional

Codigo: `professional`

- `projects_limit`: `null` (ilimitado)
- `storage_gb`: `50`
- `ai_scans_monthly`: `2500`
- `watermark`: `custom`
- `staff_limit`: `1`
- `custom_domain`: `false`
- `price_monthly`: `29`
- `price_monthly_promo`: `null`
- `price_yearly`: `290`
- `price_yearly_promo`: `199`

#### Studio Gold

Codigo: `studio_gold`

- `projects_limit`: `null` (ilimitado)
- `storage_gb`: `250`
- `ai_scans_monthly`: `10000`
- `watermark`: `white_label`
- `staff_limit`: `5`
- `custom_domain`: `true`
- `price_monthly`: `59`
- `price_yearly`: `590`

## 5. Inconsistencias Detectadas Entre Definiciones

### 5.1 Migracion inicial vs seeder actual

La migracion `database/migrations/2026_04_10_220000_create_saas_plans_table.php` inserta inicialmente:

- `starter`
- `studio`
- `scale`

Con features:

- `ai_scans`
- `photo_uploads`

Pero el seeder actual `database/seeders/SaasConfigurationSeeder.php` actualiza/crea:

- `starter`
- `professional`
- `studio_gold`

Con features:

- `projects_limit`
- `storage_gb`
- `ai_scans_monthly`
- `staff_limit`
- `custom_domain`
- precios

Impacto:

- Puede haber bases con planes viejos (`studio`, `scale`) si no se ha limpiado o reseedeado correctamente.
- Hay dos esquemas de features coexistiendo en el codigo: uno viejo (`ai_scans`, `photo_uploads`) y uno actual (`ai_scans_monthly`, `projects_limit`, etc.).

### 5.2 Inconsistencia de codigo por defecto en onboarding/UI

Todavia aparecen defaults con `studio` en varias partes:

- `app/Http/Controllers/SaasOnboardingController.php`
- `resources/js/Pages/Public/SaasSignup.jsx`
- `resources/js/Pages/Admin/Saas/Index.jsx`
- `resources/js/Pages/Admin/Saas/Show.jsx`

Pero el onboarding real ofrece:

- `starter`
- `professional`
- `studio_gold`

Impacto:

- Puede romper seleccion por defecto.
- Puede dejar tenants creados o formularios inicializados con un plan inexistente.

## 6. Limites que Si Se Aplican de Forma Real

### 6.1 Limite de proyectos SaaS

Se aplica en:

- `app/Http/Controllers/ProjectController.php`

Flujos:

- `storeDirect()`
- `convert()`

Regla:

- si `projects_limit` no es `null` y la cuenta ya alcanzo ese numero de proyectos, se bloquea la creacion

Estado:

- Enforced

Observacion:

- El mensaje esta hardcodeado a Starter y limite 1, aunque el valor venga del plan.

### 6.2 Storage por proyecto/evento

Se aplica en:

- `app/Http/Controllers/ProjectController.php`
- `app/Services/ProjectPhotoUploadService.php`

Regla:

- al crear proyecto se guarda `storage_limit_bytes` usando el plan local (`InstallationPlan`)
- al subir fotos se calcula:
  - bytes actuales de originales
  - bytes entrantes
  - maximo permitido
- si excede el maximo, se lanza error `Espacio insuficiente para este evento.`

Estado:

- Enforced para originales por proyecto

Observacion:

- Este limite depende principalmente del plan local, no del plan SaaS.

### 6.3 Retencion de originales

Se aplica en:

- `app/Http/Controllers/ProjectController.php`
- `app/Services/ProjectPhotoUploadService.php`
- `app/Models/Project.php`
- `app/Http/Controllers/GalleryController.php`

Regla:

- al crear proyecto se setea `retention_days`
- se calcula `originals_expires_at`
- al subir fotos se vuelve a extender la expiracion
- si el periodo expiro, no se permite descarga de originales

Estado:

- Enforced

### 6.4 Descargas semanales por cliente

Se aplica en:

- `app/Http/Controllers/ProjectController.php`
- `app/Models/Project.php`
- `app/Http/Controllers/GalleryController.php`

Regla:

- al crear proyecto se asigna `weekly_download_limit` desde el plan local
- al descargar una foto original:
  - se revisa cuantas descargas hizo ese cliente en los ultimos 7 dias
  - si alcanzo el limite, se bloquea

Estado:

- Enforced en el endpoint real de descarga

### 6.5 Templates permitidos por plan local

Se aplica en:

- `app/Support/GalleryTemplate.php`
- `app/Http/Controllers/ProjectController.php`
- `app/Models/Project.php`

Regla:

- `template_access` limita que templates se pueden seleccionar
- si el template elegido no esta permitido, se reemplaza por el primero permitido

Estado:

- Enforced

### 6.6 Watermark segun plan local

Se aplica en:

- `app/Services/ProjectPhotoUploadService.php`

Regla:

- `platform_forced`: usa watermark de texto de plataforma
- `photographer_custom`: intenta usar watermark del fotografo y si no existe cae a texto `Studio`

Estado:

- Enforced

### 6.7 Staff limit SaaS

Se aplica en:

- `app/Http/Controllers/Saas/UserController.php`

Regla:

- al crear usuario para un tenant, si `staff_limit` se alcanza, se bloquea

Estado:

- Enforced solo en creacion

Observacion:

- No se revalida claramente al actualizar un usuario y moverlo a otro tenant o cambiar rol.

### 6.8 Escaneos IA mensuales

Se aplica en:

- `app/Models/Tenant.php`
- `app/Services/FaceRecognitionService.php`
- `app/Http/Controllers/GalleryController.php`

Regla real:

- el tenant lleva contador `ai_scans_monthly_count`
- `canConsumeScan()` resetea cada 30 dias y valida contra `ai_scans_monthly`
- al encolar reconocimiento de una foto se incrementa el contador en `1`

Estado:

- Parcialmente enforced, pero con matices importantes

## 7. Limites o Reglas con Enforcement Parcial o Defectuoso

### 7.1 `Tenant::canUseFeature()` no soporta cantidades

Metodo actual:

- `app/Models/Tenant.php`

Firma actual:

- `canUseFeature(string $feature): bool`

Problema:

- En varios puntos se llama como si aceptara cantidad:
  - `canUseFeature('photo_uploads', $incomingFiles)`
  - `canUseFeature('ai_scans', max(1, $photoCount))`
- Pero el metodo ignora por completo ese segundo argumento.

Impacto:

- No valida lotes ni consumo real.
- Solo responde si el feature existe y es mayor que cero, o si es `null`.

### 7.2 Limite de `photo_uploads` no esta alineado con los planes actuales

Uso detectado en:

- `app/Services/ProjectPhotoUploadService.php`

Problema:

- el upload revisa `photo_uploads`
- los planes actuales sembrados ya no traen `photo_uploads`
- por eso el feature puede quedar:
  - `null` => `canUseFeature()` devuelve `true`
  - o venir de planes viejos si la base conserva datos antiguos

Impacto:

- hoy no hay una cuota SaaS de subida de fotos confiable
- el control real queda en storage por proyecto, no en una cuota mensual/global de uploads

### 7.3 Batch de IA puede anunciar mas capacidad de la que realmente existe

Flujo:

- `GalleryController::recognizeProject()` valida usando `canUseFeature('ai_scans', max(1, $photoCount))`
- pero esa llamada no descuenta ni compara contra el lote
- luego `FaceRecognitionService` incrementa y valida foto por foto

Impacto:

- un lote grande puede aceptarse desde el controlador
- pero parte de las fotos puede terminar fallando luego por limite mensual
- el mensaje `Se enviaron X fotos` puede ser optimista e impreciso

### 7.4 `downloads_used_in_window` no refleja el consumo real

Uso detectado en:

- `app/Models/Project.php`
- `app/Http/Controllers/ProjectController.php`
- `app/Http/Controllers/GalleryController.php`

Problema:

- `remainingWeeklyDownloads()` usa `downloads_used_in_window`
- pero en la descarga real solo se crea `DownloadLog`
- no se incrementa `downloads_used_in_window`

Impacto:

- el enforcement real si funciona porque usa `DownloadLog` de los ultimos 7 dias
- pero el dato resumido del proyecto puede quedar incorrecto o siempre en cero

### 7.5 `custom_domain` del plan no parece estar realmente forzado

Problema:

- los planes SaaS tienen feature `custom_domain`
- pero en onboarding se crea tenant con `custom_domain_enabled => true`

Archivo clave:

- `app/Http/Controllers/SaasOnboardingController.php`

Impacto:

- tenants podrian quedar habilitados para dominio custom aunque el plan no lo incluya

### 7.6 Mensajeria acoplada a un plan especifico

Ejemplo:

- al bloquear proyectos, el mensaje menciona `Starter (Limite: 1)`

Impacto:

- si el limite cambia o si hay otro plan con limite diferente, el mensaje puede ser incorrecto

## 8. Como se Mezclan Ambas Capas

`Project::planDefinition()` hace:

- toma `InstallationPlan::current()`
- mezcla encima `tenant->plan->features`

Esto tiene dos implicaciones:

1. Los limites locales mandan para campos propios de proyecto
   Ejemplo:
   - `retention_days`
   - `weekly_download_limit`
   - `template_access`
   - `watermark_mode`
   - `max_originals_bytes`

2. Los limites SaaS solo impactan si la key coincide o si algun flujo los consulta explicitamente
   Ejemplo:
   - `projects_limit`
   - `staff_limit`
   - `ai_scans_monthly`

Observacion importante:

- muchas keys de SaaS no coinciden con las keys locales
- por eso no sustituyen ni complementan automaticamente la logica de proyecto

## 9. Estado Actual por Limite

### 9.1 Planes locales

| Limite / capacidad | Estado |
| --- | --- |
| Storage por evento | Enforced |
| Retencion de originales | Enforced |
| Descargas semanales | Enforced |
| Templates permitidos | Enforced |
| Watermark | Enforced |
| Custom domain local | Declarado, no es la capa correcta para forzarlo |

### 9.2 Planes SaaS

| Limite / capacidad | Estado |
| --- | --- |
| Proyectos por tenant | Enforced |
| Storage global SaaS (`storage_gb`) | Hay calculo y chequeos auxiliares, no vi bloqueo central robusto en esta revision |
| Escaneos IA mensuales | Parcialmente enforced |
| Staff por tenant | Enforced solo al crear |
| Custom domain | Declarado pero no claramente forzado |
| Cuota de uploads (`photo_uploads`) | Inconsistente / legacy |

## 10. Riesgos Operativos Actuales

- La plataforma puede mostrar un plan por defecto que ya no existe (`studio`).
- La base puede contener planes legacy (`studio`, `scale`) mezclados con los nuevos (`professional`, `studio_gold`).
- La cuota de IA mensual puede comunicar una capacidad distinta a la realmente disponible en lotes grandes.
- El resumen de descargas restantes por proyecto puede no coincidir con el enforcement real.
- El flag de custom domain puede quedar habilitado fuera de plan.
- El limite de uploads SaaS no esta definido de forma consistente.

## 11. Recomendaciones Prioritarias

### Alta prioridad

1. Unificar catalogo de planes SaaS
   Elegir un solo set de codigos:
   - `starter`
   - `professional`
   - `studio_gold`

2. Eliminar referencias legacy
   Quitar o migrar:
   - `studio`
   - `scale`
   - `ai_scans`
   - `photo_uploads` si ya no sera usado

3. Corregir `Tenant::canUseFeature()`
   Separar claramente:
   - feature booleana/disponibilidad
   - feature con cuota numerica
   - feature con consumo incremental

4. Corregir el flujo de IA por lote
   Antes de encolar lote, calcular capacidad restante real.

5. Corregir el resumen de descargas
   O se actualiza `downloads_used_in_window`, o se deja de usar y todo se calcula desde `DownloadLog`.

### Media prioridad

1. Enforce real de `custom_domain`
   Basar `custom_domain_enabled` en el plan del tenant.

2. Revalidar `staff_limit` en `update()`
   Para evitar bypass por edicion.

3. Parametrizar mensajes de error
   Mostrar nombre y limite real del plan en vez de textos hardcodeados.

## 12. Conclusion

El sistema ya tiene una base util para manejar planes y limites, pero hoy conviven dos modelos:

- uno local, bastante estable y bien conectado a proyectos
- uno SaaS, mas ambicioso, pero con enforcement incompleto y arrastre de nomenclatura legacy

Si hubiera que resumir el estado actual en una frase:

- los limites operativos de proyecto funcionan razonablemente bien
- los limites comerciales/SaaS necesitan una pasada de unificacion y endurecimiento

## 13. Archivos Clave Revisados

- `config/photography_plans.php`
- `app/Support/InstallationPlan.php`
- `app/Models/Project.php`
- `app/Models/Tenant.php`
- `app/Models/SaasPlan.php`
- `database/seeders/SaasConfigurationSeeder.php`
- `database/migrations/2026_04_10_220000_create_saas_plans_table.php`
- `app/Http/Controllers/ProjectController.php`
- `app/Http/Controllers/GalleryController.php`
- `app/Http/Controllers/Saas/UserController.php`
- `app/Http/Controllers/SaasOnboardingController.php`
- `app/Services/ProjectPhotoUploadService.php`
- `app/Services/FaceRecognitionService.php`
- `app/Services/Billing/TenantBillingService.php`
- `app/Support/GalleryTemplate.php`
