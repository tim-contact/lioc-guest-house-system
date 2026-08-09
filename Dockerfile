ARG PHP_VERSION=8.5

FROM node:22-alpine AS assets

WORKDIR /app

ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package.json package-lock.json ./
RUN npm ci

COPY components.json tsconfig.json vite.config.ts ./
COPY resources ./resources
COPY public ./public

RUN npm run build

FROM php:${PHP_VERSION}-fpm-alpine AS app

WORKDIR /var/www/html

ENV APP_ENV=production \
    LOG_CHANNEL=stderr \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    LARAVEL_PDF_CHROME_PATH=/usr/bin/chromium-browser \
    LARAVEL_PDF_NODE_BINARY=/usr/bin/node \
    LARAVEL_PDF_NPM_BINARY=/usr/bin/npm \
    LARAVEL_PDF_NO_SANDBOX=true

RUN apk add --no-cache \
        bash \
        ca-certificates \
        chromium \
        curl \
        freetype \
        harfbuzz \
        icu-dev \
        libzip-dev \
        nginx \
        nodejs \
        npm \
        nss \
        postgresql-dev \
        supervisor \
        ttf-freefont \
        $PHPIZE_DEPS \
    && docker-php-ext-install \
        bcmath \
        intl \
        opcache \
        pcntl \
        pdo_pgsql \
        zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --no-scripts \
    --no-autoloader

COPY . .

COPY --from=assets /app/public/build ./public/build
COPY --from=assets /app/node_modules ./node_modules
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/start.sh /usr/local/bin/start.sh

RUN composer dump-autoload --optimize \
    && php artisan package:discover --ansi \
    && mkdir -p \
        /run/nginx \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod +x /usr/local/bin/start.sh

EXPOSE 8080

CMD ["/usr/local/bin/start.sh"]
