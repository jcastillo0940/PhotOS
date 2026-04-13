module.exports = {
    apps: [
        {
            name: 'photos-face-ai-worker',
            script: './main.py',
            cwd: '/var/www/photos/ai_service',
            interpreter: '/var/www/photos/ai_service/.venv/bin/python',
            autorestart: true,
            max_restarts: 20,
            restart_delay: 5000,
            env: {
                FACE_AI_REDIS_URL: 'redis://127.0.0.1:6379/0',
                FACE_AI_TASK_QUEUE: 'face-ai:tasks',
                FACE_AI_RESULT_QUEUE: 'face-ai:results',
                FACE_AI_BRAND_DETECTOR: 'disabled',
            },
        },
        {
            name: 'photos-face-ai-results',
            script: '/usr/bin/php',
            args: 'artisan face-ai:consume-results --timeout=5',
            cwd: '/var/www/photos',
            autorestart: true,
            max_restarts: 20,
            restart_delay: 5000,
        },
        {
            name: 'photos-laravel-queue',
            script: '/usr/bin/php',
            args: 'artisan queue:work --sleep=1 --tries=3 --timeout=120 --max-jobs=250 --max-time=3600',
            cwd: '/var/www/photos',
            autorestart: true,
            max_restarts: 20,
            restart_delay: 5000,
        },
    ],
};
