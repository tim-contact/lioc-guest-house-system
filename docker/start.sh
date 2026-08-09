#!/usr/bin/env sh
set -eu

cd /var/www/html

mkdir -p \
    /run/nginx \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache

chown -R www-data:www-data storage bootstrap/cache

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    php artisan migrate --force --no-interaction
fi

if [ "${RUN_SEEDERS:-false}" = "true" ]; then
    php artisan db:seed --force --no-interaction
fi

if [ "${CACHE_CONFIG:-true}" = "true" ]; then
    php artisan config:cache --no-interaction
fi

if [ "${CACHE_ROUTES:-true}" = "true" ]; then
    php artisan route:cache --no-interaction
fi

if [ "${CACHE_VIEWS:-true}" = "true" ]; then
    php artisan view:cache --no-interaction
fi

exec /usr/bin/supervisord -c /etc/supervisord.conf
