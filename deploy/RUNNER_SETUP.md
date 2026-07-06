# Self-hosted GitHub Actions runner — Ubuntu deploy host

One-time setup on the Ubuntu instance that will build/pull nothing itself
but will run the `deploy` job from `.github/workflows/ci-cd.yml` (label
`sarai-prod`). The runner is a background service: it stays running and
polls GitHub for queued jobs — there's no separate "listener" to write.

## 1. Prerequisites

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git curl
sudo usermod -aG docker $USER   # log out/in (or `newgrp docker`) after this
```

Verify:

```bash
docker --version
docker compose version
```

## 2. Clone the repo onto the VM

```bash
cd ~
git clone https://github.com/fatma250/SARAI.git
cd SARAI
git checkout Main
```

## 3. Create the production secrets file

```bash
cp backend/.env.example backend/.env
nano backend/.env   # fill in real JWT_SECRET_KEY, DB_PASSWORD, SMTP creds, etc.
```

This file never gets committed (already in `.gitignore`) and is read both by
the backend container (`env_file:`) and by the deploy step (sourced into the
shell to fill `${DB_PASSWORD}` etc. in `deploy/docker-compose.prod.yml`).

## 4. Register the runner

GitHub repo → **Settings → Actions → Runners → New self-hosted runner**,
choose Linux/x64, and copy the token it gives you (it's short-lived, grab it
right before running the commands below).

```bash
mkdir -p ~/actions-runner && cd ~/actions-runner
curl -o actions-runner-linux-x64.tar.gz -L \
  https://github.com/actions/runner/releases/latest/download/actions-runner-linux-x64-2.319.1.tar.gz
tar xzf ./actions-runner-linux-x64.tar.gz

./config.sh --url https://github.com/fatma250/SARAI \
            --token <TOKEN_FROM_GITHUB> \
            --labels sarai-prod \
            --name sarai-prod-runner \
            --work _work
```

(Check the Actions → Runners page for the current version number if the URL
above 404s — GitHub bumps the runner release regularly.)

## 5. Install as a systemd service (so it survives reboots/logout)

```bash
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status
```

Confirm in GitHub → Settings → Actions → Runners that `sarai-prod-runner`
shows **Idle**.

## 6. First deploy

Push to `Main` (or merge a PR into it). Watch the Actions tab: `test-backend`
/ `test-frontend` → `build-and-push` → `update-manifest` → `deploy` (this
last job runs on the VM itself). On success:

```bash
docker compose -f deploy/docker-compose.prod.yml ps
curl localhost:8000/health
curl -I localhost
```

## Maintenance

- **Logs**: `journalctl -u actions.runner.* -f`
- **Stop/start**: `sudo ./svc.sh stop` / `start` inside `~/actions-runner`
- **Uninstall**: `sudo ./svc.sh uninstall` then `./config.sh remove --token <token>`
- **Manual rollback**: edit `deploy/manifest.env`'s `IMAGE_TAG` to a previous
  short SHA (visible in Docker Hub tags or `git log`), then re-run step 6's
  compose commands by hand.

## Security note

The `deploy` job only runs on `push` to `Main`, never on `pull_request` —
self-hosted runners must never be reachable from `pull_request` workflows on
a repo that accepts external PRs, since a fork PR could otherwise run
arbitrary code on this VM. Keep branch protection on `Main` (only
maintainers/CI can push) so this guarantee holds.
