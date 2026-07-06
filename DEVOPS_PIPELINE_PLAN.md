# SARAI — CI/CD & Deployment Pipeline Plan

Tracks the work to take SARAI from "no automation" to: push to `Main` →
GitHub Actions tests both apps → builds & pushes 2 Docker images to Docker Hub
→ a self-hosted runner on an Ubuntu box deploys them via a manifest file.

Mark a box `[x]` when the task is verifiably done. Items tagged **(you)**
require access I don't have (GitHub repo settings, the actual Ubuntu VM) —
I've written the exact commands, but a human has to run/click them.

---

## Phase 0 — Decisions (locked in)

- [x] Test stage = lint/build/import checks only (no test suite exists yet; not writing one now)
- [x] Deployment model = single production environment, Docker Compose, self-hosted runner
- [x] Docker Hub namespace = `fatmahajjem` (set as the `DOCKERHUB_USERNAME` secret in Phase 1; images resolve to `fatmahajjem/sarai-backend` / `fatmahajjem/sarai-frontend`)
- [x] Trigger branch = `Main` (this repo's default branch — note the capital M)

---

## Phase 1 — GitHub repo prerequisites **(you)**

- [ ] Create/confirm the `fatmahajjem` Docker Hub account + two empty repos: `fatmahajjem/sarai-backend`, `fatmahajjem/sarai-frontend` (or just let the first push auto-create them)
- [ ] Create a Docker Hub **access token** for `fatmahajjem` (Account Settings → Security → New Access Token, read/write scope) — do not use your Docker Hub password
- [ ] In GitHub repo → Settings → Secrets and variables → Actions, add:
  - [ ] `DOCKERHUB_USERNAME` — `fatmahajjem`
  - [ ] `DOCKERHUB_TOKEN` — the access token from above
- [ ] In the same page → Variables tab, add:
  - [ ] `PROD_API_URL` — the public URL the frontend should call, e.g. `http://<ubuntu-vm-ip>:8000`
- [ ] Settings → Actions → General → Workflow permissions → set to **"Read and write permissions"** (needed so the pipeline can commit the updated manifest file back to `Main`)
- [ ] (Recommended) Settings → Branches → add a protection rule for `Main` requiring the `test-backend` / `test-frontend` checks to pass before merge

---

## Phase 2 — CI: test stage

- [x] Add `.github/workflows/ci-cd.yml` with `test-backend` job: install `backend/requirements.txt`, `python -m compileall`, `python -c "import main"` (validates the app constructs; DB import already falls back to SQLite when Postgres is unreachable, so no DB service needed in CI)
- [x] Add `test-frontend` job: `npm ci` + `npm run build` in `frontend/`
- [x] Both run on every push and pull request targeting `Main`

## Phase 3 — CI: build & push the 2 Docker images

- [x] Add `build-and-push` job (runs only on `push`, never on `pull_request` — keeps Docker Hub creds away from PRs/forks), needs both test jobs
- [x] Tag both images with the short git SHA and `latest`
- [x] Use `docker/login-action` with the two secrets from Phase 1
- [x] Use `docker/build-push-action` with GitHub Actions layer caching for both `backend/` and `frontend/` (frontend build gets `VITE_API_URL` from the `PROD_API_URL` variable)

## Phase 4 — Deployment manifest & production compose file

- [x] Add `deploy/manifest.env` — the manifest file: image names, the tag to deploy, deployed commit SHA, deployed timestamp
- [x] Add `deploy/docker-compose.prod.yml` — pulls `backend`/`frontend` images (by tag from the manifest) instead of building from source; keeps the same `db` service as the dev compose file
- [x] Add `update-manifest` CI job: after a successful build, rewrites `deploy/manifest.env` with the new tag/SHA/timestamp and commits it back to `Main` with `[skip ci]` (workflow also uses `paths-ignore` on that file as a belt-and-suspenders loop guard)

## Phase 5 — Self-hosted runner on the Ubuntu instance **(you, on the VM)**

- [ ] Provision/confirm the Ubuntu instance (Docker + Docker Compose plugin installed, ports 80/8000/5432 reachable as needed)
- [ ] Create `backend/.env` **directly on the VM** (never in git) with real `JWT_SECRET_KEY`, `DB_PASSWORD`, SMTP creds — copy from `backend/.env.example` and fill in production values
- [ ] Follow `deploy/RUNNER_SETUP.md` (added below) to register the box as a GitHub Actions self-hosted runner with label `sarai-prod`, and install it as a systemd service so it keeps running/listening across reboots
- [ ] Confirm the runner shows "Idle" in GitHub → Settings → Actions → Runners

## Phase 6 — CD: deploy job

- [x] Add `deploy` job: `runs-on: [self-hosted, sarai-prod]`, needs `update-manifest`, only on `push`
- [x] Steps: checkout `Main` (picks up the freshly committed manifest), `docker login`, source `backend/.env` + `deploy/manifest.env` into the shell, `docker compose -f deploy/docker-compose.prod.yml pull && up -d`, prune old images
- [x] Post-deploy health check: `curl` the backend `/health` endpoint (already exists in `backend/main.py`) and fail the job if it doesn't respond

## Phase 7 — Verification & hardening (do after first real deploy) **(you, partly)**

- [ ] Run a real push to `Main` end-to-end and confirm: tests pass → images appear on Docker Hub → `deploy/manifest.env` gets auto-committed → runner picks up the job → containers restart with the new tag → `/health` responds
- [ ] Confirm old dangling images get pruned on the VM (disk doesn't grow unbounded)
- [x] Document a manual rollback: edit `deploy/manifest.env`'s `IMAGE_TAG` to a previous SHA, re-source it and re-run `docker compose -f deploy/docker-compose.prod.yml up -d` on the VM (see `deploy/RUNNER_SETUP.md` → Maintenance)
- [ ] Rotate the Docker Hub token if it's ever exposed in logs

---

## Files this plan creates in the repo

| File | Purpose |
|---|---|
| `.github/workflows/ci-cd.yml` | The full pipeline: test → build/push → update manifest → deploy |
| `deploy/manifest.env` | Version-controlled record of which image tags are currently deployed |
| `deploy/docker-compose.prod.yml` | Production stack (pulls images instead of building) |
| `deploy/RUNNER_SETUP.md` | Step-by-step for registering/running the self-hosted runner on the Ubuntu VM |
