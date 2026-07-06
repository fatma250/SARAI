# Fix Stakeholders Display

## 🐛 Problème

Le frontend affiche "4 stakeholders • 3 countries" mais aucune carte n'apparaît, alors que nous avons ajouté 30 organisations dans la base de données.

## 🔍 Cause

L'API `/api/stakeholders/` lit depuis l'**ancienne table `stakeholders`** (qui contient seulement 4 entrées) au lieu de la **nouvelle table `organizations`** (qui contient 30 entrées).

## ✅ Solution Appliquée

**Fichier modifié**: `backend/app/routers/stakeholders.py`

### Changement

**Avant**:
```python
sql = "SELECT ... FROM stakeholders WHERE 1=1"
```

**Après**:
```python
sql = """
    SELECT o.id, o.name, o.type, o.category, c.name as country, 
           o.description, o.website, o.email as contact_email, 
           o.created_at, o.updated_at
    FROM organizations o
    LEFT JOIN countries c ON o.country_id = c.id
    WHERE 1=1
"""
```

### Avantages
- ✅ Lit depuis la table `organizations` (30 entrées)
- ✅ Fait un JOIN avec `countries` pour obtenir le nom du pays
- ✅ Utilise `o.email` au lieu de `contact_email`
- ✅ Tri par nom d'organisation

## 🚀 Comment Tester

### Étape 1: Redémarrer le Backend

Si le backend est déjà en cours d'exécution, **redémarrez-le** pour charger les modifications :

```bash
# Arrêter le backend (Ctrl+C dans le terminal)
# Puis redémarrer
cd backend
uvicorn app:app --reload
```

### Étape 2: Tester l'API

#### Option A: Avec le script Python
```bash
cd backend
python test_stakeholders_api.py
```

**Résultat attendu**:
```
✓ Success! Found 30 stakeholders

First 3 stakeholders:

1. American University of Beirut
   Type: University
   Country: Lebanon
   Website: None

2. Arab ICT Organization
   Type: NGO
   Country: Egypt
   Website: https://www.aicto.org

3. Bahrain Polytechnic
   Type: University
   Country: Bahrain
   Website: None

By Type:
  • University: 13
  • Government: 9
  • Research Lab: 5
  • NGO: 2
  • Startup: 1
```

#### Option B: Avec le navigateur
Ouvrir: http://localhost:8000/api/stakeholders/

Vous devriez voir un JSON avec 30 stakeholders.

#### Option C: Avec Swagger
1. Ouvrir: http://localhost:8000/docs
2. Chercher: GET `/api/stakeholders/`
3. Cliquer sur "Try it out"
4. Cliquer sur "Execute"
5. Vérifier la réponse : 30 stakeholders

### Étape 3: Vérifier le Frontend

1. Rafraîchir la page: http://localhost:3001/stakeholders
2. **Vous devriez maintenant voir 30 cartes de stakeholders !** 🎉

## 📊 Résultat Attendu dans le Frontend

### Avant
```
4 stakeholders • 3 countries
[Aucune carte affichée]
```

### Après
```
30 stakeholders • 12 countries

[30 cartes affichées avec:]
- Universités (13)
- Gouvernements (9)
- Research Labs (5)
- NGO (2)
- Startup (1)
```

### Exemples de Cartes

```
┌─────────────────────────────────────────┐
│ 🎓 Cairo University AI Research Lab     │
│ University · Egypt                      │
│                                         │
│ Leading AI research center in Egypt...  │
│                                         │
│ 🌐 cu.edu.eg                            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🏛️ UAE Ministry of AI                   │
│ Government · United Arab Emirates       │
│                                         │
│ Government entity responsible for AI... │
│                                         │
│ 🌐 ai.gov.ae                            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🔬 Qatar Computing Research Institute   │
│ Research Lab · Qatar                    │
│                                         │
│ World-class research institute...       │
│                                         │
│ 🌐 qcri.org                             │
└─────────────────────────────────────────┘
```

## 🐛 Dépannage

### Problème: Toujours 4 stakeholders

**Cause**: Backend pas redémarré

**Solution**:
1. Arrêter le backend (Ctrl+C)
2. Redémarrer: `uvicorn app:app --reload`
3. Rafraîchir le frontend

### Problème: Erreur 500 dans l'API

**Cause**: Problème SQL ou table manquante

**Solution**:
1. Vérifier les logs du backend
2. Vérifier que la table `organizations` existe:
   ```bash
   python show_stakeholders.py
   ```
3. Si la table est vide, exécuter:
   ```bash
   python populate_stakeholders.py
   ```

### Problème: Frontend affiche "Failed to fetch"

**Cause**: Backend pas démarré ou CORS

**Solution**:
1. Vérifier que le backend tourne sur port 8000
2. Vérifier CORS dans `backend/app/__init__.py`

### Problème: Cartes vides ou mal formatées

**Cause**: Frontend s'attend à des champs différents

**Solution**: Vérifier que l'API renvoie bien:
- `id`
- `name`
- `type`
- `country` (nom du pays, pas country_id)
- `description`
- `website`
- `contact_email`

## 📝 Fichiers Modifiés

1. ✅ `backend/app/routers/stakeholders.py` - API corrigée pour lire depuis `organizations`
2. ✅ `backend/test_stakeholders_api.py` - Script de test créé

## ✅ Checklist

- [ ] Backend redémarré
- [ ] API testée (30 stakeholders retournés)
- [ ] Frontend rafraîchi
- [ ] 30 cartes affichées
- [ ] Filtres fonctionnent
- [ ] Recherche fonctionne

## 🎉 Résultat Final

Après ces corrections:

✅ **API** renvoie 30 stakeholders depuis `organizations`  
✅ **Frontend** affiche 30 cartes  
✅ **Filtres** par type fonctionnent  
✅ **Recherche** fonctionne  
✅ **Statistiques** correctes (30 stakeholders, 12 pays)  

---

## 🚀 Commandes Rapides

```bash
# Redémarrer le backend
cd backend
uvicorn app:app --reload

# Tester l'API
python test_stakeholders_api.py

# Vérifier la base de données
python show_stakeholders.py

# Ajouter plus de stakeholders
python populate_stakeholders.py
```

---

**Status**: ✅ Prêt à tester  
**Date**: 7 Mai 2026  
**Stakeholders**: 30 organisations réelles
