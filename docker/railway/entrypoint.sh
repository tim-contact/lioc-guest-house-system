#!/bin/sh
set -eu

cd /var/www/html

# Railway may override the image command; preserve one-off CLI invocations.
if [ "${1:-}" != "supervisord" ]; then
    exec "$@"
fi

: "${APP_SECRET:?Set APP_SECRET to a strong, stable secret}"
: "${DATABASE_URL:?Set DATABASE_URL to the MySQL connection URL}"

port="${PORT:-8080}"
case "$port" in
    ''|*[!0-9]*) echo "PORT must be a number between 1 and 65535." >&2; exit 1 ;;
esac
if [ "$port" -lt 1 ] || [ "$port" -gt 65535 ]; then
    echo "PORT must be a number between 1 and 65535." >&2
    exit 1
fi
sed "s/__PORT__/${port}/g" /etc/nginx/templates/railway.conf.template > /etc/nginx/conf.d/railway.conf

# The storage and cache adapters are selected when Symfony compiles its
# container; regenerate it with Railway's runtime environment, not build values.
php bin/console cache:clear --no-interaction --no-warmup
mkdir -p var/cache var/log public/resources/images/export public/resources/images/room-categories
chown -R www-data:www-data var
chown www-data:www-data public/resources/images public/resources/images/export public/resources/images/room-categories

exec "$@"
