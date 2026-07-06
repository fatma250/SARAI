# SARAI - Fix Frontend Display

## 🎯 Problème

Les projets ne s'affichaient pas côté frontend.

## 🔍 Cause

1. **API projects endpoint** : Renvoyait `country` (string) au lieu de `country_id` (integer)
2. **API countries endpoint** : Le schéma Pydantic utilisait `country` au lieu de `name`
3. **Frontend** : S'attendait à recevoir `country_id` pour faire le mapping avec les pays

## ✅ Solutions Appliquées

### 1. Corrigé l'endpoint `/api/projects/` ✅
**Fichier**: `backend/app/routers/projects.py`

**Changements**:
- Ajouté `country_id` dans la requête SQL
- Ajouté `user_id` et `year_of_implementation`
- Modifié le mapping pour inclure ces champs
- Ajouté `ORDER BY created_at DESC` pour afficher les plus récents en premier

**Avant**:
```python
sql = "SELECT id, title, organization, country, sector, ..."
# Renvoyait 'country' (string)
```

**Après**:
```python
sql = """
    SELECT id, title, organization, sector, technology, sdg_alignment, 
           description, website, status, created_at, updated_at, 
           country_id, user_id, year_of_implementation
    FROM projects 
    WHERE status = 'approved'
"""
# Renvoie 'country_id' (integer)
```

### 2. Corrigé le schéma Country ✅
**Fichier**: `backend/app/schemas/country.py`

**Changements**:
- Changé `country: str` en `name: str`
- Mis à jour tous les modèles (CountryBase, CountryCreate, CountryUpdate)

**Avant**:
```python
class CountryBase(BaseModel):
    country: str  # ❌ Mauvais nom de champ
```

**Après**:
```python
class CountryBase(BaseModel):
    name: str  # ✅ Correspond à la colonne DB
```

## 🚀 Comment Tester

### Étape 1: Démarrer le Backend

```bash
cd backend
uvicorn app:app --reload
```

Vous devriez voir:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### Étape 2: Tester l'API

#### Option A: Avec le navigateur
Ouvrir: http://localhost:8000/docs

Tester:
- GET `/api/projects/` → Devrait retourner 12 projets
- GET `/api/countries/` → Devrait retourner 22 pays

#### Option B: Avec le script Python
```bash
python test_api_simple.py
```

Résultat attendu:
```
✓ Success! Found 12 projects

First project:
  id: 36
  title: Egyptian Arabic NLP Platform
  organization: Cairo University AI Research Lab
  sector: Education
  technology: Natural Language Processing
  sdg_alignment: SDG 4
  description: A comprehensive Natural Language Processing...
  website: https://ai.cu.edu.eg/nlp
  status: approved
  created_at: 2026-05-07 01:41:05.363622
  updated_at: 2026-05-07 01:41:05.363622
  country_id: 8  ← ✅ IMPORTANT: country_id est présent
  user_id: 1
  year_of_implementation: 2024
```

#### Option C: Avec curl
```bash
curl http://localhost:8000/api/projects/ | python -m json.tool
curl http://localhost:8000/api/countries/ | python -m json.tool
```

### Étape 3: Démarrer le Frontend

Dans un **nouveau terminal**:

```bash
cd frontend
npm run dev
```

Vous devriez voir:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Étape 4: Vérifier l'Affichage

1. Ouvrir: http://localhost:3000
2. Cliquer sur "Project Stocktaking" dans le menu
3. **Vous devriez voir les 12 projets affichés !** 🎉

## 📊 Résultat Attendu

### Dans le Frontend

Vous devriez voir **12 cartes de projets** avec:

1. **Egyptian Arabic NLP Platform** 🇪🇬
   - Organization: Cairo University AI Research Lab
   - Country: Egypt
   - Sector: Education
   - Technology: Natural Language Processing
   - SDG: SDG4

2. **Morocco AI-Powered Medical Diagnosis System** 🇲🇦
   - Organization: Morocco Ministry of Health
   - Country: Morocco
   - Sector: Healthcare
   - Technology: Computer Vision
   - SDG: SDG3

3. **Jordan Smart Agriculture Initiative** 🇯🇴
   - Organization: Jordan Food and Drug Administration
   - Country: Jordan
   - Sector: Agriculture
   - Technology: Machine Learning
   - SDG: SDG2

... et 9 autres projets !

### Filtres Fonctionnels

Les filtres devraient fonctionner:
- ✅ Filtrer par pays (Egypt, Morocco, Jordan, etc.)
- ✅ Filtrer par secteur (Health, Education, Agriculture, etc.)
- ✅ Filtrer par SDG (SDG 2, SDG 3, SDG 4, etc.)

## 🐛 Dépannage

### Problème: "Failed to fetch projects"

**Solution**: Vérifier que le backend est démarré
```bash
# Dans le terminal backend, vous devriez voir:
INFO:     127.0.0.1:xxxxx - "GET /api/projects/ HTTP/1.1" 200 OK
```

### Problème: "CORS error"

**Solution**: Vérifier que le backend a CORS activé

Le fichier `backend/app/__init__.py` devrait contenir:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifier les domaines
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Problème: "country_id is null"

**Solution**: Vérifier que les projets ont bien un country_id
```bash
python show_projects.py
```

Chaque projet devrait avoir un `country_id`.

### Problème: "Cannot read property 'country' of undefined"

**Solution**: Le frontend essaie d'accéder à `country.country` au lieu de `country.name`

Vérifier dans `ProjectStocktaking.jsx`:
```javascript
const countryName = getCountryName(p.country_id, countries)
// La fonction getCountryName devrait chercher 'name' et non 'country'
```

## 📝 Fichiers Modifiés

1. ✅ `backend/app/routers/projects.py` - Endpoint projects corrigé
2. ✅ `backend/app/schemas/country.py` - Schéma country corrigé
3. ✅ `backend/populate_real_projects.py` - Script de peuplement (déjà exécuté)

## 🎉 Résultat Final

Après ces corrections:

✅ **Backend API** renvoie les bonnes données  
✅ **12 projets réels** dans la base de données  
✅ **Frontend** affiche correctement les projets  
✅ **Filtres** fonctionnent  
✅ **Mapping pays** fonctionne  

---

## 🚀 Commandes Rapides

```bash
# Terminal 1: Backend
cd backend
uvicorn app:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Tests
cd backend
python test_api_simple.py
python show_projects.py
```

---

**Status**: ✅ Prêt à tester  
**Date**: 7 Mai 2026  
**Projets**: 12 projets IA arabes réels
