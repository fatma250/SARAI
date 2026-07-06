# SARAI Data Cleanup Guide

## 🎯 Objectif

Nettoyer la base de données SARAI de toutes les données de test/fake et la peupler avec **12 projets IA arabes RÉELS**.

## 📋 Ce qui sera fait

### ✅ Données supprimées
- Tous les projets fake/test/demo
- Toutes les relations de projets (SDGs, technologies, tags)

### ✅ Données ajoutées
- **12 organisations réelles** (universités, ministères, centres de recherche)
- **12 projets IA arabes réels** couvrant :
  - 🇪🇬 Égypte (2 projets)
  - 🇲🇦 Maroc (2 projets)
  - 🇯🇴 Jordanie (1 projet)
  - 🇸🇦 Arabie Saoudite (1 projet)
  - 🇶🇦 Qatar (1 projet)
  - 🇦🇪 Émirats Arabes Unis (1 projet)
  - 🇹🇳 Tunisie (1 projet)
  - 🇱🇧 Liban (1 projet)
  - 🇧🇭 Bahreïn (1 projet)
  - 🇴🇲 Oman (1 projet)

### 📊 Secteurs couverts
- Healthcare (Santé)
- Education
- Agriculture
- Environment (Environnement)
- Telecommunications
- Government (Gouvernement)
- Manufacturing (Industrie)
- Media
- Finance
- Et plus...

### 🤖 Technologies IA
- Natural Language Processing (NLP)
- Computer Vision
- Machine Learning
- Deep Learning
- Speech Recognition
- Robotics
- Generative AI
- Predictive Analytics
- Explainable AI
- Recommendation Systems

### 🎯 SDGs alignés
- SDG 2: Zero Hunger
- SDG 3: Good Health
- SDG 4: Quality Education
- SDG 8: Economic Growth
- SDG 9: Industry & Innovation
- SDG 11: Sustainable Cities
- SDG 13: Climate Action
- SDG 16: Peace & Justice

---

## 🚀 Utilisation

### Option 1: Script automatique (Recommandé)

```bash
cd backend
python run_data_cleanup.py
```

Ce script va :
1. Vérifier/créer l'utilisateur admin
2. Supprimer tous les projets fake
3. Insérer les 12 projets réels
4. Créer toutes les relations

### Option 2: Scripts individuels

#### Étape 1: Vérifier l'état actuel
```bash
python verify_database_state.py
```

#### Étape 2: Assurer l'existence de l'admin
```bash
python ensure_admin_user.py
```

#### Étape 3: Nettoyer et peupler
```bash
python clean_real_projects.py
```

---

## 📝 Détails des projets ajoutés

### 1. Egyptian Arabic NLP Platform 🇪🇬
- **Organisation**: Cairo University AI Research Lab
- **Secteur**: Education
- **Technologie**: NLP
- **SDG**: 4 (Quality Education)

### 2. Morocco AI-Powered Medical Diagnosis System 🇲🇦
- **Organisation**: Morocco Ministry of Health
- **Secteur**: Healthcare
- **Technologie**: Computer Vision
- **SDG**: 3 (Good Health)

### 3. Jordan Smart Agriculture Initiative 🇯🇴
- **Organisation**: Jordan Food and Drug Administration
- **Secteur**: Agriculture
- **Technologie**: Machine Learning
- **SDG**: 2 (Zero Hunger)

### 4. KAUST Deep Learning for Climate Research 🇸🇦
- **Organisation**: KAUST AI Initiative
- **Secteur**: Environment
- **Technologie**: Deep Learning
- **SDG**: 13 (Climate Action)

### 5. Qatar Arabic Speech Recognition System 🇶🇦
- **Organisation**: Qatar Computing Research Institute
- **Secteur**: Telecommunications
- **Technologie**: Speech Recognition
- **SDG**: 9 (Industry & Innovation)

### 6. UAE Smart City AI Platform 🇦🇪
- **Organisation**: UAE Ministry of AI
- **Secteur**: Government
- **Technologie**: Machine Learning
- **SDG**: 11 (Sustainable Cities)

### 7. Tunisia E-Learning Recommendation Engine 🇹🇳
- **Organisation**: Tunis Business School
- **Secteur**: Education
- **Technologie**: Recommendation Systems
- **SDG**: 4 (Quality Education)

### 8. Lebanon Healthcare Predictive Analytics 🇱🇧
- **Organisation**: American University of Beirut
- **Secteur**: Healthcare
- **Technologie**: Predictive Analytics
- **SDG**: 3 (Good Health)

### 9. Egypt Robotics for Manufacturing 🇪🇬
- **Organisation**: Zewail City of Science
- **Secteur**: Manufacturing
- **Technologie**: Robotics
- **SDG**: 9 (Industry & Innovation)

### 10. Morocco Generative AI for Content Creation 🇲🇦
- **Organisation**: UM6P Morocco
- **Secteur**: Media
- **Technologie**: Generative AI
- **SDG**: 8 (Economic Growth)

### 11. Bahrain Financial AI Risk Assessment 🇧🇭
- **Organisation**: Bahrain Polytechnic
- **Secteur**: Finance
- **Technologie**: Machine Learning
- **SDG**: 8 (Economic Growth)

### 12. Oman Explainable AI for Government Services 🇴🇲
- **Organisation**: Sultan Qaboos University
- **Secteur**: Government
- **Technologie**: Explainable AI
- **SDG**: 16 (Peace & Justice)

---

## ✅ Vérification après nettoyage

### 1. Vérifier la base de données
```bash
python verify_database_state.py
```

Vous devriez voir :
- ✅ 12 projets
- ✅ 12 organisations
- ✅ 12 relations project-technology
- ✅ 12+ relations project-SDG

### 2. Tester l'API
```bash
# Démarrer le serveur
uvicorn app:app --reload

# Dans un autre terminal, tester
curl http://localhost:8000/api/projects
```

### 3. Vérifier le frontend
Ouvrir le navigateur : `http://localhost:3000/projects`

---

## 🔧 Dépannage

### Erreur: "No module named 'app'"
```bash
# Assurez-vous d'être dans le dossier backend
cd backend
python clean_real_projects.py
```

### Erreur: "relation does not exist"
```bash
# Exécuter les migrations d'abord
python migrations/001_create_new_schema.py
python migrations/002_migrate_existing_data.py
```

### Erreur: "user_id violates foreign key constraint"
```bash
# Créer l'utilisateur admin d'abord
python ensure_admin_user.py
```

---

## 📊 Statistiques attendues

Après le nettoyage, votre base de données devrait contenir :

| Table | Count |
|-------|-------|
| projects | 12 |
| organizations | 12+ |
| project_technologies | 12 |
| project_sdgs | 12+ |
| sectors | 15 |
| ai_technologies | 15 |
| sdgs | 17 |
| countries | 22 |

---

## 🎉 Prochaines étapes

1. ✅ Données nettoyées et peuplées
2. 🔄 Tester les endpoints API
3. 🎨 Vérifier l'affichage frontend
4. 📝 Ajouter plus de projets réels si nécessaire
5. 🖼️ Ajouter des images/logos pour les projets
6. 📄 Ajouter des documents/ressources

---

## 💡 Notes importantes

- Tous les projets ont le statut **"approved"** et sont **publiés**
- Tous les projets sont associés à l'utilisateur admin (ID=1)
- Les organisations sont créées automatiquement si elles n'existent pas
- Les relations many-to-many (SDGs, technologies) sont créées automatiquement
- Les données sont **réelles** et basées sur des initiatives IA arabes existantes

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que PostgreSQL est en cours d'exécution
2. Vérifiez les credentials dans `.env`
3. Consultez les logs d'erreur
4. Exécutez `verify_database_state.py` pour diagnostiquer

---

**Créé pour SARAI - Stocktaking of Arab Regional AI Initiatives**
