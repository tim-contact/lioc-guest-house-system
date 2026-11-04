# syntax=docker/dockerfile:1
# Railway receives HTTP on Nginx; PHP-FPM serves Symfony within the same service.
FROM php:8.5-fpm AS app

ENV APP_ENV=prod \
    APP_DEBUG=0 \
    LOCALE=en \
    PASSKEY_ENABLED=false \
    RELYING_PARTY_ID=localhost \
    RELYING_PARTY_NAME=FewohBee \
    USE_REDIS_CACHE=false \
    TZ=UTC \
    COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_NO_INTERACTION=1

# Match the extensions used by the existing FPM image, plus ZIP for Composer.
ADD --chmod=0755 https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/
RUN install-php-extensions intl gd mbstring pdo_mysql exif zip opcache redis \
    && apt-get update \
    && apt-get install -y --no-install-recommends nginx supervisor \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/nginx/sites-enabled/default

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
WORKDIR /var/www/html

COPY composer.json composer.lock symfony.lock ./
RUN \
    COMPOSER_CACHE_DIR=/tmp/composer-cache composer install --no-dev --no-scripts --no-autoloader --prefer-dist \
    && rm -rf /tmp/composer-cache

COPY . .
RUN composer dump-autoload --no-dev --no-scripts --optimize \
    && APP_SECRET=build-only DATABASE_URL='mysql://build:build@127.0.0.1:3306/build' \
       php bin/console importmap:install --no-interaction \
    && APP_SECRET=build-only DATABASE_URL='mysql://build:build@127.0.0.1:3306/build' \
       php bin/console asset-map:compile --no-interaction \
    && rm -rf var/cache \
    && mkdir -p var/cache var/log public/resources/images/export public/resources/images/room-categories \
    && chown -R www-data:www-data var public/resources/images

ENV DB_SERVER_VERSION=8.0.0

COPY docker/railway/nginx.conf.template /etc/nginx/templates/railway.conf.template
COPY docker/railway/supervisord.conf /etc/supervisor/conf.d/railway.conf
COPY docker/railway/php-fpm.conf /usr/local/etc/php-fpm.d/zz-railway.conf
COPY --chmod=0755 docker/railway/entrypoint.sh /usr/local/bin/railway-entrypoint
COPY docker/railway/php.ini /usr/local/etc/php/conf.d/railway.ini

EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/railway-entrypoint"]
CMD ["supervisord", "-n", "-c", "/etc/supervisor/conf.d/railway.conf"]
