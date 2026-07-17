<?php

/**
 * Route manifest — splits surfaces into dedicated files.
 * Each file owns its surface's routes, middleware, and naming conventions.
 *
 * Surfaces:
 *   public.php  — marketing site + gallery + payments (no auth)
 *   auth.php    — login / logout / project invitations
 *   studio.php  — /admin/* backoffice (owner, operator, photographer)
 *   client.php  — /client/* portal (role=client)
 *
 * SaaS panel (developer-only) lives in routes/saas.php and is loaded
 * separately in bootstrap/app.php with the `then:` callback.
 */

require __DIR__.'/public.php';
require __DIR__.'/auth.php';
require __DIR__.'/studio.php';
require __DIR__.'/client.php';
