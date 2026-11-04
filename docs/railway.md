# Deploying on Railway

This configuration runs the production Symfony application behind Nginx and PHP-FPM. Railway
builds the root `Dockerfile`, runs the Doctrine migrations as a pre-deploy
command, then starts Nginx on Railway's `PORT`. The existing Docker/FPM setup
under `docker/app` is unchanged.

## Create the services

1. Push this repository and its latest changes to GitHub. In Railway, create a
   project and add a service from that repository.
2. Add a Railway MySQL service to the same project. Use a dedicated database for
   this application and keep its data on persistent storage. Railway's MySQL
   service provides `MYSQL_URL` over the private network.
3. Add these variables to the **application** service (the service name in the
   first reference must match the name of your MySQL service):

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | `${{MySQL.MYSQL_URL}}` |
   | `APP_SECRET` | A long random secret; generate one with `openssl rand -hex 32` |
   | `TRUSTED_PROXIES` | The actual trusted Railway proxy ranges; see below |
   | `LOCALE` | `en` or `de` (defaults to `en`) |

   Set `DB_SERVER_VERSION` to the actual MySQL server version if it differs
   from this image's MySQL `8.0.0` default. For MariaDB use the version format
   documented in `.env.dist`. Railway supplies `PORT`; do not hardcode it.

   `APP_SECRET` must remain stable between deployments. If you import an
   existing installation, preserve its original secret where encrypted SMTP
   settings need to remain readable. Store it as a Railway secret, not in Git.
4. If using the default local image storage, attach a Railway volume to the
   **application** service at `/var/www/html/public/resources/images`. This
   preserves both exported images and room-category images. Mounting a new empty
   volume does not copy over your existing local uploads; transfer any required
   files separately. Keep a single application replica when using local uploads
   and the default filesystem-backed sessions.
5. Configure the service's public domain. The application is behind Railway's
   proxy, so configure `TRUSTED_PROXIES` to the proxy addresses/ranges actually
   used in your deployment. Symfony accepts `private_ranges` when your trusted
   proxy uses private addresses; do not trust all sources indiscriminately.
6. Deploy. `railway.json` runs
   `php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration`
   before each deployment. A failed migration prevents the new deployment from
   starting. Review and back up an existing database before deploying changes to
   it. `/health/live` checks that the web process responds; it does not verify
   database readiness.

## First use or importing an existing system

A new empty database needs initial configuration and an administrator. After
the first successful deployment, use the Railway CLI to open a shell in the
application service and run the existing interactive setup once:

```sh
railway ssh
php bin/console app:first-run
```

Do not run first-run on an existing installation. To preserve the guest houses,
rooms, users, settings, custom PDF/email templates and other local records,
migrate the existing MySQL database and uploaded files instead; Git does not
contain those database records. Take and securely transfer a database backup,
test the restore, and verify the migration state before enabling traffic. Keep
the original `APP_SECRET` if encrypted application settings must be retained.

The Docker image does not load sample data or create a default administrator.
Do not publish credentials in Git or deployment logs.

## Storage and background jobs

Instead of a Railway volume, the existing `STORAGE_ADAPTER=s3` option supports
S3-compatible object storage. Set the `STORAGE_S3_*` variables documented in
`.env.dist`, including the public asset URL, and migrate existing images with
the application's storage migration command. The application rebuilds its
Symfony cache at startup so the chosen adapter is picked up.

The web container does not run the cron tasks from `docker/app/crontab`.
If calendar synchronization, scheduled workflows, or log purging are needed,
configure separate Railway scheduled services for the relevant commands from
that file. These services need the same application/database variables; avoid
running duplicate schedulers.

## Local image check

```sh
docker build -t lioc-guest-house .
docker run --rm -p 8080:8080 \
  -e APP_SECRET=local-test-secret \
  -e DATABASE_URL='mysql://user:password@host:3306/database' \
  lioc-guest-house
```

A real reachable MySQL database is needed for migrations and normal application
pages. Production values belong in Railway variables, not in this example.
