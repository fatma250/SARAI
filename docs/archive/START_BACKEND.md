# Démarrer le Backend SARAI

## Commande

```bash
cd backend
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

## Tester l'API

### 1. Ouvrir Swagger UI
http://localhost:8000/docs

### 2. Tester les endpoints

#### GET /api/projects/
http://localhost:8000/api/projects/

#### GET /api/countries/
http://localhost:8000/api/countries/

### 3. Avec curl
```bash
curl http://localhost:8000/api/projects/
curl http://localhost:8000/api/countries/
```

### 4. Avec Python
```bash
python test_api_simple.py
```

## Vérifier que ça fonctionne

Vous devriez voir :
- ✅ 12 projets retournés
- ✅ Chaque projet a un `country_id`
- ✅ 22 pays retournés
- ✅ Chaque pays a un `name`

## Ensuite

Une fois le backend démarré et testé :
1. Ouvrir un nouveau terminal
2. Aller dans le dossier frontend
3. Démarrer le frontend : `npm run dev`
4. Ouvrir http://localhost:3000 (ou 3001)
5. Les projets devraient s'afficher !
