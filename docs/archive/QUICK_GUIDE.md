# SARAI - Guide Rapide 🚀

**5 minutes pour démarrer !**

---

## 🎯 Objectif

Nettoyer la base de données et ajouter **12 projets IA arabes RÉELS**.

---

## ⚡ Démarrage Rapide

### 1️⃣ Ouvrir le Terminal
```bash
cd c:\Users\Fatma\OneDrive\Documents\GitHub\Stage-PFE-AICTO\backend
```

### 2️⃣ Tester la Connexion
```bash
python test_connection.py
```
✅ Doit afficher: "Database connection test PASSED"

### 3️⃣ Nettoyer et Peupler ⭐
```bash
python run_data_cleanup.py
```
- Taper **"yes"** quand demandé
- Attendre ~10 secondes
- ✅ Terminé !

### 4️⃣ Vérifier
```bash
python verify_database_state.py
```
✅ Doit afficher: "Projects: 12"

### 5️⃣ Démarrer le Backend
```bash
uvicorn app:app --reload
```
✅ Ouvrir: http://localhost:8000/docs

---

## 📊 Résultat Attendu

Après `run_data_cleanup.py`:

```
✅ 12 projets IA arabes RÉELS
✅ 12 organisations créées
✅ Tous les projets approuvés
✅ Toutes les relations établies
✅ Base de données propre
```

---

## 🌍 Projets Ajoutés

1. 🇪🇬 Egyptian Arabic NLP Platform
2. 🇲🇦 Morocco AI Medical Diagnosis
3. 🇯🇴 Jordan Smart Agriculture
4. 🇸🇦 KAUST Climate Research
5. 🇶🇦 Qatar Speech Recognition
6. 🇦🇪 UAE Smart City Platform
7. 🇹🇳 Tunisia E-Learning Engine
8. 🇱🇧 Lebanon Healthcare Analytics
9. 🇪🇬 Egypt Manufacturing Robotics
10. 🇲🇦 Morocco Generative AI
11. 🇧🇭 Bahrain Financial AI
12. 🇴🇲 Oman Explainable AI

---

## 🎁 Bonus: Ajouter Plus de Projets

```bash
python add_more_projects.py
```
✅ Ajoute 8 projets supplémentaires (total: 20)

---

## 🧪 Tester l'API

```bash
# Démarrer le serveur
uvicorn app:app --reload

# Dans un autre terminal
python test_api_endpoints.py
```

Ou ouvrir dans le navigateur:
- http://localhost:8000/docs
- Essayer: GET /api/projects

---

## 🎨 Tester le Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Ouvrir: http://localhost:3000/projects

---

## ❓ Problèmes ?

### "python" ne fonctionne pas
Essayer: `python3` ou `py`

### Connexion échoue
1. Vérifier PostgreSQL est démarré
2. Vérifier `.env` (DB_PASSWORD=0000)

### Tables manquantes
```bash
python migrations/001_create_new_schema.py
python migrations/002_migrate_existing_data.py
```

---

## 📚 Documentation Complète

- **[NEXT_STEPS.md](NEXT_STEPS.md)** - Guide détaillé
- **[DATA_CLEANUP_GUIDE.md](backend/DATA_CLEANUP_GUIDE.md)** - Guide de nettoyage
- **[README_SCRIPTS.md](backend/README_SCRIPTS.md)** - Tous les scripts
- **[WORK_SUMMARY.md](WORK_SUMMARY.md)** - Résumé complet

---

## ✅ Checklist

- [ ] Terminal ouvert dans `/backend`
- [ ] `python test_connection.py` ✅
- [ ] `python run_data_cleanup.py` ⭐
- [ ] Taper "yes" pour confirmer
- [ ] `python verify_database_state.py` ✅
- [ ] `uvicorn app:app --reload` ✅
- [ ] Ouvrir http://localhost:8000/docs ✅

---

## 🎉 C'est Tout !

Votre base de données SARAI contient maintenant **12 projets IA arabes RÉELS** !

**Prochaine étape**: Tester le frontend et vérifier l'affichage.

---

**Temps total**: ~5 minutes  
**Difficulté**: Facile ✅  
**Résultat**: Base de données production-ready 🚀
