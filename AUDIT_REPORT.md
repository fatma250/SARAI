# SARAI — Rapport d'audit, nettoyage et refonte

> Réalisé en analyse **statique** (AST, graphe de dépendances, `py_compile`,
> parsing JSON). L'environnement n'avait pas d'accès réseau : impossible
> d'exécuter `pip install` / `npm install`, donc **aucun build complet ni test
> d'intégration n'a pu être lancé**. Tout ce qui suit est vérifié au niveau
> syntaxe + accessibilité des modules, pas au niveau exécution end-to-end.
> Les points nécessitant une validation runtime sont signalés explicitement.

---

## 1. Vue d'ensemble du projet

**SARAI** (Stocktaking of Arab Regional AI Initiatives) :
- **Backend** : FastAPI + SQLAlchemy + PostgreSQL (fallback SQLite), avec
  Elasticsearch (recherche), pgvector + sentence-transformers (recherche
  sémantique), Ollama/OpenAI (chatbot), xhtml2pdf (rapports).
- **Frontend** : React 18 + Vite, React Router, i18next (fr/en/ar), Leaflet,
  Recharts, react-toastify.

L'application qui tourne (`backend/main.py` + `backend/app/`) est **autonome** :
aucun des ~80 scripts à la racine n'en faisait partie.

---

## 2. Fichiers supprimés

**Code mort applicatif**
- `backend/app/services/semantic_search_service.py` — service jamais référencé.
- `frontend/src/components/Card.jsx` — composant jamais importé.

**Artefacts / fichiers générés ou inutiles**
- `frontend/dist/` (1,5 Mo) — sortie de build, régénérée par `vite build`.
- `sarai.db`, `backend/sarai.db` — fichiers SQLite vides (0 octet).
- `projects_output.json`, `projects_output_v2.json`, `stakeholders_output.json`
  — dumps de données commités par erreur (≈ 470 Ko).
- `uploads/` à la racine — dossier vide en doublon (l'app utilise `backend/uploads/`).
- `package.json` + `package-lock.json` à la **racine** — dépendances frontend
  mal placées (voir §3).

**Scripts jetables à la racine du projet** (7) : `check_counts.py`,
`check_db_temp.py`, `debug_verification.py`, `test_api_internal.py`,
`test_api_v2.py`, `test_email_service.py`, `test_smtp.py`.

**Scripts de diagnostic jetables dans `backend/`** (~36) : tous les
`debug_*`, `check_*`, `list_*`, `show_*`, `verify_*`, `fix_*`,
`analyze_current_data.py`, `count_by_country.py`, `final_fix.py`,
`emergency_auth_fix.py`, `ensure_admin_user.py`, `restore_*`,
`copy_to_sarai.py`, `create_sarai_db.py`, `run_data_cleanup.py`,
`reseed_m2m.py`, `simple_clean_data.py`, `approve_all_users.py`,
`test_api_*`.

> **Total supprimé : ~53 fichiers + 1 dossier de build.**

### Fichiers *archivés* (déplacés, pas supprimés)
Par prudence (impossible de savoir lequel est « canonique » sans exécuter) :
- **31 scripts de données/migration** (`migrate_*`, `populate_*`, `seed_*`,
  `add_*`, `clean_*`) → `backend/scripts/legacy/`.
- **17 documents de compte-rendu de session IA** (`ARCHITECT_REPORT.md`,
  `REFACTORING_*.md`, `WORK_SUMMARY.md`, `STAKEHOLDERS_*.md`, `FIX_*.md`,
  `NEXT_STEPS.md`, `CURRENT_STATUS.md`, `QUICK_*.md`, `START_BACKEND.md`,
  `TESTING_CHECKLIST.md`, `COMPLETE_SOLUTION.md`, `DATA_CLEANUP_GUIDE.md`)
  → `docs/archive/`.

### Réorganisation
- Tooling opérationnel promu dans `backend/scripts/` : `init_db.py`,
  `create_admin.py`, `seed_data.py` (avec bootstrap `sys.path` ajouté pour
  qu'ils tournent depuis leur nouvel emplacement).
- Docs de référence regroupées dans `docs/` : `API_ENDPOINTS.md`,
  `DATABASE_SCHEMA.md`, `ERD_DIAGRAM.md`, `MIGRATION_GUIDE.md`, + la nouvelle
  `ARCHITECTURE.md`.

---

## 3. Dépendances supprimées / corrigées

**Backend (`requirements.txt`)**
- ❌ `weasyprint==61.2` — **non utilisée** (le code génère les PDF avec
  `xhtml2pdf`). Suppression d'une dépendance lourde (libs système cairo/pango).

**Frontend (`package.json`)**
- ❌ `leaflet.heat` — jamais importée.
- ❌ `tailwindcss`, `postcss`, `autoprefixer` (étaient à la racine) — aucune
  config Tailwind ni directive `@tailwind` ; le style est du CSS pur.
- ✅ `axios` et `react-toastify` **relocalisées** depuis le `package.json`
  racine vers `frontend/package.json`. **Bug corrigé** : `axios` était importé
  par `authService.js` (utilisé par les 5 pages Auth) mais absent du manifeste
  frontend → un `npm install` propre aurait cassé le build.

---

## 4. Bugs corrigés

1. **Dépendance manquante `axios`** côté frontend (build cassé en install
   propre) — corrigé en §3.
2. **Dérive de configuration des URLs API** : 8 fichiers codaient en dur
   `http://127.0.0.1:8000`, d'autres utilisaient `VITE_API_URL`, d'autres des
   littéraux inline. Tout est désormais **piloté par l'environnement** :
   `const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'`
   (corrigé dans Chatbot, SearchResults, KnowledgeMap, Analytics,
   ProjectStocktaking, SDGDirectory, StakeholderDirectory, AdminDashboard,
   Profile, CountryPage, Home). Déploiement hors localhost désormais possible.
3. **54 imports inutilisés** retirés dans `backend/app/` (re-vérifié : 0
   restant, compilation OK).

---

## 5. Sécurité (corrigé)

1. **Élévation de privilèges à l'inscription — CRITIQUE → corrigé.**
   `POST /api/auth/register` acceptait `role` fourni par le client et le
   validateur autorisait `admin`/`moderator` : n'importe qui pouvait
   s'enregistrer admin. Désormais le rôle est **forcé à `"organization"`** ;
   les comptes admin se créent via `scripts/create_admin.py`.
2. **Absence totale d'authentification sur les endpoints — CRITIQUE → corrigé
   pour l'admin.** Aucun endpoint ne vérifiait le JWT. Ajout d'un module
   `app/dependencies.py` (`get_current_user`, `require_admin`) et application
   de `require_admin` sur **tout le routeur `/api/admin/*`**
   (`APIRouter(dependencies=[Depends(require_admin)])`).
   Bonne nouvelle : le frontend `AdminDashboard` **envoyait déjà**
   `Authorization: Bearer <token>` sur chaque appel admin — l'enforcement
   backend est donc aligné avec l'existant. **À valider en runtime.**

> ⚠️ **Action requise de votre côté — rotation des secrets.** Le fichier
> `backend/.env` (présent dans l'archive) contient des secrets réels : clé
> `JWT_SECRET_KEY`, mot de passe **SMTP Gmail**, mot de passe base. Ils ont
> voyagé dans un zip → **considérez-les comme compromis et faites-les tourner**
> (nouveau mot de passe d'application Gmail, nouvelle clé JWT, nouveau mot de
> passe DB). `.env` est bien dans `.gitignore`.

---

## 6. Modifications backend

- `app/dependencies.py` (nouveau) — auth/authz réutilisable, centralisée (DRY,
  Single Responsibility).
- `app/routers/admin.py` — protégé par `require_admin`.
- `app/routers/auth.py` — `register` ne fait plus confiance au `role` client.
- `requirements.txt` — `weasyprint` retiré.
- Imports inutilisés nettoyés dans services, routers, schemas, models.
- `Dockerfile` (python:3.12-slim, utilisateur non-root) + `.dockerignore`.

---

## 7. Modifications frontend

- `package.json` reconstruit (deps correctes, sans paquets morts).
- URLs API centralisées et pilotées par `VITE_API_URL` partout.
- `components/Card.jsx` (mort) supprimé.
- `Dockerfile` multi-stage (build Vite → service Nginx) + `nginx.conf`
  (fallback SPA pour React Router) + `.dockerignore` + `.env.example`.

---

## 8. Nouvelle architecture

Décision : **monolithe modulaire**, pas de microservices pour l'instant —
justification détaillée dans `docs/ARCHITECTURE.md`. Résumé : domaine
relationnel fortement couplé (jointures projets ↔ stakeholders ↔ pays ↔ SDG),
trafic modéré, petite équipe → les microservices ajouteraient un coût
opérationnel sans bénéfice. Les seules « coutures » naturelles (recherche ES,
embeddings pgvector, chatbot) sont déjà isolées dans `app/services/` et
pourront être extraites plus tard sans toucher au domaine.

Couches : `routers` (HTTP) → `services` (métier + intégrations) → `models`
(persistance) ; `schemas` (DTO) à la frontière HTTP ; `dependencies.py`
(transverse). `docker-compose.yml` orchestre db (pgvector) + backend + frontend,
avec profils optionnels `search` (Elasticsearch) et `ai` (Ollama).

---

## 9. Risques

- **Enforcement admin non testé en runtime.** Le code et l'envoi du token
  concordent, mais à valider : login admin → ouvrir le dashboard → vérifier les
  appels `/api/admin/*` (200 attendu pour un admin, 401/403 sinon).
- **Scripts déplacés** (`init_db`, `create_admin`, `seed_data`) : lancez-les
  désormais depuis `backend/` via `python -m scripts.init_db`. Bootstrap
  `sys.path` ajouté, mais à confirmer dans votre environnement.
- **Validation build non effectuée** (pas de réseau) : faites un
  `npm install && npm run build` et `pip install -r requirements.txt` après
  récupération.
- **Scripts legacy archivés** non testés ; gardés pour référence seulement.

---

## 10. Prochaines améliorations recommandées

1. **Étendre l'auth** aux routes mutantes hors admin (création/édition de
   projets, `PUT /api/users/{id}`) avec `Depends(get_current_user)` et un check
   propriétaire/admin.
2. **Centraliser les appels API frontend** dans un client unique (instance
   axios + intercepteur ajoutant le token) au lieu de `fetch` dispersés.
3. **Migrations** : passer à **Alembic** plutôt que les scripts `migrate_*`
   ad hoc (versionné, réversible).
4. **Tests** : aucune suite de tests réelle. Ajouter `pytest` + TestClient
   FastAPI (auth, projets, admin) et des tests composants frontend.
5. **CI** : lint (ruff/eslint) + build + tests sur chaque push.
6. **Durée de vie JWT** (24 h) : ajouter un refresh token et raccourcir
   l'access token.
7. **CORS** : remplacer la longue liste localhost par une origine configurée
   via variable d'environnement par environnement.
