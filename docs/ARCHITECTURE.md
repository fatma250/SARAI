# SARAI — Architecture Decision Record

## Decision: keep a **modular monolith**, do **not** split into microservices (yet)

### Context
SARAI is a single FastAPI application (`backend/app`) backed by one PostgreSQL
database, plus a React/Vite single-page app. It is a stocktaking/registry
platform: projects, stakeholders, resources, countries, SDGs, plus search,
analytics, a chatbot and an admin workflow. It is built and operated by a
small team.

### Why not microservices
1. **One tightly-coupled relational domain.** Projects join to stakeholders,
   countries, SDGs, technologies, tags, documents and comments through foreign
   keys and many-to-many tables. Splitting these into separate services would
   replace cheap SQL joins with chatty cross-service calls and force either
   distributed transactions or eventual-consistency plumbing — large cost, no
   current benefit.
2. **No independent scaling need.** Traffic is read-heavy and modest. Nothing
   in the domain has a scaling profile that diverges enough to justify its own
   deployable unit.
3. **Team size.** Microservices pay off when many teams need to deploy
   independently. With a small team the operational overhead (N pipelines, N
   runtimes, service discovery, tracing, contract tests) outweighs the gains.
4. **The seams that *do* exist are already isolated.** Search (Elasticsearch),
   embeddings/semantic search (pgvector) and the chatbot (Ollama/OpenAI) are
   the parts most likely to ever be extracted — and they already live behind
   service modules in `app/services/`. They can be promoted to separate
   services later without touching the domain code.

### Recommended target: clean modular monolith
Keep one deployable, but enforce clear internal boundaries so a future split is
cheap if it's ever warranted:

```
backend/
  main.py                 # composition root: app, middleware, router wiring
  app/
    routers/              # HTTP layer only (REST endpoints, no business logic)
    services/             # business logic + external integrations (ES, AI, mail, PDF)
    models/               # SQLAlchemy ORM (persistence)
    schemas/              # Pydantic DTOs (validation / serialization)
    database/             # engine + session + get_db
    dependencies.py       # cross-cutting auth/authz (get_current_user, require_admin)
  scripts/                # operational tooling (init_db, create_admin, seeders, ES sync)
    legacy/               # archived one-off data/migration scripts (not part of runtime)
  migrations/             # schema/data migrations
```

Rule of thumb to preserve the boundaries:
*routers* call *services*; *services* use *models*; *schemas* cross the HTTP
boundary. Routers should not contain queries-heavy business logic, and models
should never import routers.

### When to revisit
Promote a module to its own service only when at least one is true:
- a component needs to scale or be deployed on a fundamentally different cadence
  (e.g. the embedding/LLM workload grows heavy and GPU-bound), or
- a second team takes ownership of a bounded context, or
- an integration (search/AI) needs independent availability guarantees.

The likely first extraction is the **AI/search service** (Elasticsearch +
pgvector + Ollama), because it is already isolated behind `app/services/` and
has the most distinct runtime profile.
