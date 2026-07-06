# SARAI - Guide des Stakeholders (Parties Prenantes)

## 🎯 Qu'est-ce qu'un Stakeholder ?

Un **Stakeholder** (partie prenante) dans SARAI est une **organisation, institution ou entité** qui joue un rôle dans l'écosystème de l'IA dans le monde arabe.

---

## 📋 Types de Stakeholders

### 1. **Universités et Centres de Recherche** 🎓
Institutions académiques qui font de la recherche en IA

**Exemples**:
- Cairo University AI Research Lab (Égypte)
- King Abdullah University of Science and Technology - KAUST (Arabie Saoudite)
- Qatar Computing Research Institute - QCRI (Qatar)
- American University of Beirut - AUB (Liban)
- Mohammed VI Polytechnic University - UM6P (Maroc)
- Zewail City of Science and Technology (Égypte)
- Sultan Qaboos University (Oman)
- Birzeit University (Palestine)

### 2. **Gouvernements et Ministères** 🏛️
Entités gouvernementales qui développent ou soutiennent l'IA

**Exemples**:
- UAE Ministry of AI (Émirats Arabes Unis)
- Saudi Data and AI Authority - SDAIA (Arabie Saoudite)
- Morocco Ministry of Health (Maroc)
- Jordan Food and Drug Administration (Jordanie)
- Egyptian Environmental Affairs Agency (Égypte)
- Algeria Ministry of Transport (Algérie)
- Morocco National Tourist Office (Maroc)

### 3. **Startups et Entreprises** 🚀
Entreprises privées qui développent des solutions IA

**Exemples**:
- Startups IA arabes (FinTech, HealthTech, EdTech)
- Entreprises de Computer Vision
- Plateformes NLP arabes
- Solutions de Smart Cities
- Entreprises de Robotique

### 4. **ONG et Organisations Internationales** 🌍
Organisations non-gouvernementales travaillant sur l'IA

**Exemples**:
- AICTO (Arab ICT Organization) - Votre organisation !
- UNESCO bureaux régionaux
- UNDP Arab States
- Organisations de développement durable
- Think tanks technologiques

### 5. **Laboratoires de Recherche** 🔬
Labs spécialisés en IA et technologies avancées

**Exemples**:
- Kuwait Institute for Scientific Research
- Research labs universitaires
- Innovation hubs
- Centres d'excellence en IA

### 6. **Incubateurs et Accélérateurs** 💡
Structures qui soutiennent les startups IA

**Exemples**:
- Dubai Future Foundation
- Innovation hubs dans les pays arabes
- Accélérateurs technologiques
- Espaces de co-working tech

---

## 📊 Informations à Collecter pour Chaque Stakeholder

### Informations de Base
- **Nom** : Nom complet de l'organisation
- **Type** : University / Government / Company / NGO / Research Lab / Startup
- **Pays** : Pays où se trouve le siège principal
- **Ville** : Ville principale
- **Site web** : URL officielle

### Informations de Contact
- **Email** : Email de contact principal
- **Téléphone** : Numéro de téléphone (optionnel)
- **Adresse** : Adresse physique (optionnel)

### Informations Descriptives
- **Description** : Présentation de l'organisation et ses activités IA
- **Secteur d'activité** : Healthcare, Education, Finance, etc.
- **Logo** : URL ou fichier du logo

### Informations Techniques
- **Technologies IA utilisées** : NLP, Computer Vision, ML, etc.
- **Domaines d'expertise** : Spécialités de l'organisation
- **Projets associés** : Liste des projets IA développés

---

## 🎯 Différence entre Stakeholders et Organizations

Dans SARAI, il y a eu une **évolution** :

### Avant (Ancien Modèle)
- **Stakeholders** : Table unique pour toutes les entités

### Maintenant (Nouveau Modèle)
- **Organizations** : Table normalisée pour les organisations
- **Stakeholders** : Conservée pour compatibilité mais **Organizations est préférée**

**Recommandation** : Utilisez la table **Organizations** pour ajouter de nouvelles entités.

---

## 📝 Exemples Concrets de Stakeholders

### Exemple 1: Université
```
Nom: Cairo University AI Research Lab
Type: University
Pays: Egypt
Ville: Cairo
Description: Leading AI research center in Egypt, focusing on Arabic NLP, 
             computer vision, and machine learning applications for the 
             Arab region.
Secteur: Education & Research
Technologies: NLP, Machine Learning, Computer Vision
Site web: https://ai.cu.edu.eg
Email: contact@ai.cu.edu.eg
```

### Exemple 2: Gouvernement
```
Nom: UAE Ministry of AI
Type: Government
Pays: United Arab Emirates
Ville: Dubai
Description: Government entity responsible for AI strategy and implementation 
             across the UAE, leading smart city initiatives and digital 
             transformation.
Secteur: Government & Smart Cities
Technologies: Machine Learning, IoT, Smart City Tech
Site web: https://ai.gov.ae
Email: info@ai.gov.ae
```

### Exemple 3: Startup
```
Nom: ArabicAI Solutions
Type: Startup
Pays: Saudi Arabia
Ville: Riyadh
Description: Startup specializing in Arabic language AI solutions, providing 
             chatbots, translation, and sentiment analysis for businesses.
Secteur: Technology & NLP
Technologies: NLP, Chatbots, Machine Translation
Site web: https://arabicai.sa
Email: hello@arabicai.sa
```

### Exemple 4: Centre de Recherche
```
Nom: Qatar Computing Research Institute
Type: Research Lab
Pays: Qatar
Ville: Doha
Description: World-class research institute focusing on computing and AI, 
             with expertise in Arabic NLP, social computing, and data analytics.
Secteur: Research & Technology
Technologies: NLP, Data Science, Social Computing
Site web: https://www.qcri.org
Email: info@qcri.org
```

---

## 🔍 Où Trouver des Stakeholders ?

### Sources Officielles
1. **Sites web gouvernementaux** des pays arabes
2. **Universités** avec départements IA/Computer Science
3. **Conférences IA** dans la région arabe
4. **Publications scientifiques** d'auteurs arabes
5. **LinkedIn** - Recherche d'organisations IA arabes

### Bases de Données
- **AICTO** - Votre propre réseau !
- **UNESCO** - Initiatives IA dans les pays arabes
- **Crunchbase** - Startups IA arabes
- **Google Scholar** - Institutions de recherche
- **GitHub** - Projets open source arabes

### Événements
- **AI Summit Dubai**
- **Cairo ICT**
- **Saudi AI Summit**
- **Arab AI Conference**
- **GITEX Technology Week**

---

## 📊 Structure de la Table Organizations (Recommandée)

```sql
CREATE TABLE organizations (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,              -- Nom de l'organisation
    type VARCHAR(50) NOT NULL,               -- University/Government/Company/NGO/Research Lab/Startup
    category VARCHAR(100),                   -- Sous-catégorie
    country_id INTEGER,                      -- Référence au pays
    website VARCHAR(500),                    -- Site web
    description TEXT,                        -- Description détaillée
    email VARCHAR(255),                      -- Email de contact
    phone VARCHAR(50),                       -- Téléphone
    address TEXT,                            -- Adresse
    city VARCHAR(100),                       -- Ville
    logo_url TEXT,                           -- URL du logo
    is_active INTEGER DEFAULT 1,            -- Actif ou non
    is_verified INTEGER DEFAULT 0,          -- Vérifié par admin
    created_at TIMESTAMP,                    -- Date de création
    updated_at TIMESTAMP                     -- Date de mise à jour
);
```

---

## 🚀 Comment Ajouter des Stakeholders

### Option 1: Via Script Python

Créez un fichier `add_stakeholders.py`:

```python
from app.database import engine
from sqlalchemy import text
from datetime import datetime

stakeholders = [
    {
        "name": "Cairo University AI Research Lab",
        "type": "University",
        "country_id": 8,  # Egypt
        "city": "Cairo",
        "website": "https://ai.cu.edu.eg",
        "description": "Leading AI research center in Egypt",
        "email": "contact@ai.cu.edu.eg"
    },
    # Ajoutez plus de stakeholders ici...
]

with engine.connect() as conn:
    trans = conn.begin()
    try:
        for s in stakeholders:
            conn.execute(text("""
                INSERT INTO organizations 
                (name, type, country_id, city, website, description, email, 
                 is_active, is_verified, created_at, updated_at)
                VALUES 
                (:name, :type, :country_id, :city, :website, :description, :email,
                 1, 1, :now, :now)
            """), {**s, "now": datetime.utcnow()})
        trans.commit()
        print(f"✓ Added {len(stakeholders)} stakeholders")
    except Exception as e:
        trans.rollback()
        print(f"✗ Error: {e}")
```

### Option 2: Via Interface Admin (À Développer)

Créer une page admin pour ajouter des stakeholders via formulaire.

### Option 3: Via API

```bash
curl -X POST http://localhost:8000/api/stakeholders/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cairo University AI Lab",
    "type": "University",
    "country_id": 8,
    "website": "https://ai.cu.edu.eg"
  }'
```

---

## 📋 Liste de Stakeholders Suggérés pour SARAI

### Universités (20+)
1. Cairo University (Egypt)
2. KAUST (Saudi Arabia)
3. American University of Beirut (Lebanon)
4. UM6P (Morocco)
5. Qatar University (Qatar)
6. UAE University (UAE)
7. King Saud University (Saudi Arabia)
8. Alexandria University (Egypt)
9. Jordan University of Science and Technology (Jordan)
10. Tunis Business School (Tunisia)
11. Sultan Qaboos University (Oman)
12. Birzeit University (Palestine)
13. University of Bahrain (Bahrain)
14. Kuwait University (Kuwait)
15. Zewail City (Egypt)

### Gouvernements (15+)
1. UAE Ministry of AI
2. Saudi Data and AI Authority (SDAIA)
3. Egypt Ministry of Communications
4. Morocco Ministry of Digital Transformation
5. Jordan Ministry of Digital Economy
6. Qatar Ministry of Transport and Communications
7. Tunisia Ministry of Technology
8. Oman Ministry of Technology and Communications

### Centres de Recherche (10+)
1. Qatar Computing Research Institute (QCRI)
2. Kuwait Institute for Scientific Research
3. Dubai AI Lab
4. Saudi AI Research Center
5. Egypt AI Research Center

### Startups (20+)
1. Startups FinTech arabes
2. Startups HealthTech arabes
3. Startups EdTech arabes
4. Startups AgriTech arabes

### Organisations Internationales (5+)
1. AICTO (Arab ICT Organization)
2. UNESCO Regional Office
3. UNDP Arab States
4. Arab League Digital Economy Committee

---

## 🎯 Utilité des Stakeholders dans SARAI

### 1. **Annuaire (Directory)**
- Liste complète des acteurs IA dans la région
- Facilite le networking
- Permet de trouver des partenaires

### 2. **Cartographie de l'Écosystème**
- Visualiser qui fait quoi
- Identifier les clusters d'innovation
- Voir la distribution géographique

### 3. **Liens avec les Projets**
- Chaque projet est lié à un stakeholder
- Voir tous les projets d'une organisation
- Analyser la productivité

### 4. **Statistiques**
- Nombre de stakeholders par pays
- Types d'organisations les plus actifs
- Secteurs les plus représentés

---

## 📊 Page Stakeholder Directory (Frontend)

La page devrait afficher:

### Vue Liste
```
┌─────────────────────────────────────────────────┐
│ 🎓 Cairo University AI Research Lab             │
│ University · Egypt · Cairo                      │
│ Leading AI research center in Egypt...          │
│ 🌐 ai.cu.edu.eg  📧 contact@ai.cu.edu.eg       │
│ [View Projects] [Contact]                       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🏛️ UAE Ministry of AI                           │
│ Government · UAE · Dubai                        │
│ Government entity responsible for AI strategy...│
│ 🌐 ai.gov.ae  📧 info@ai.gov.ae                │
│ [View Projects] [Contact]                       │
└─────────────────────────────────────────────────┘
```

### Filtres
- Par type (University, Government, Company, etc.)
- Par pays
- Par secteur d'activité
- Par technologie

---

## ✅ Checklist pour Ajouter un Stakeholder

- [ ] Nom complet et officiel
- [ ] Type correct (University/Government/Company/NGO/Research Lab/Startup)
- [ ] Pays et ville
- [ ] Site web vérifié
- [ ] Description claire et professionnelle
- [ ] Email de contact (si disponible)
- [ ] Logo (si disponible)
- [ ] Vérifier qu'il n'existe pas déjà
- [ ] Lier aux projets existants si applicable

---

## 🎉 Résumé

**Stakeholders = Organisations qui font de l'IA dans le monde arabe**

**Types principaux**:
- 🎓 Universités
- 🏛️ Gouvernements
- 🚀 Startups
- 🔬 Centres de recherche
- 🌍 ONG
- 💡 Incubateurs

**Objectif**: Créer un **annuaire complet** de l'écosystème IA arabe pour faciliter la collaboration et le networking.

---

**Besoin d'aide pour ajouter des stakeholders ? Je peux créer un script pour vous ! 🚀**
