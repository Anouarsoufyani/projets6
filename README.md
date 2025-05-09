# Plateforme de Livraison

Application de mise en relation entre clients, commerçants et livreurs pour faciliter les livraisons de produits.

## 📋 Fonctionnalités principales

### Client
- Création et suivi de commandes
- Gestion de profil
- Consultation des commandes passées
- Réception de notifications

### Commerçant
- Gestion des commandes reçues
- Suivi des livraisons
- Gestion de profil et informations boutique
- Envoi de requêtes aux livreurs (manuel ou automatique)
- Consultation des statistiques de vente
- Consultation des avis et notifications

### Livreur
- Gestion des véhicules et pièces justificatives
- Gestion de disponibilité
- Réception et traitement des requêtes de livraison
- Suivi des commandes attribuées
- Validation des livraisons par code
- Consultation des avis et notifications

### Administrateur
- Tableau de bord avec statistiques globales
- Gestion des utilisateurs
- Validation des pièces justificatives
- Suivi des commandes
- Consultation des notifications

## 🚀 Installation et démarrage

### Prérequis
- Node.js (v14 ou supérieur)
- NPM (v7 ou supérieur)
- MongoDB (installé localement ou connecté à un cluster distant)

### Configuration

1. Clonez le dépôt
```bash
git clone https://github.com/Anouarsoufyani/projets6.git
cd projets6
```

2. Configuration des variables d'environnement
   - Créez un fichier `.env` dans le dossier `backend` en vous basant sur `.env.example`
   - Configurez les variables nécessaires (connexion MongoDB, clés JWT, etc.)

### Installation et lancement

#### Backend
```bash
# Se déplacer dans le dossier backend
cd backend

# Installer les dépendances
npm i

# Lancer le serveur en mode développement
npm run dev
```

#### Frontend
```bash
# Dans un nouveau terminal, se déplacer dans le dossier client
cd client

# Installer les dépendances
npm i

# Lancer l'application client en mode développement
npm run dev
```

L'application backend tournera sur `http://localhost:5001` et le frontend sur `http://localhost:3000` par défaut.

## 📊 Architecture technique

### Backend
- Node.js avec Express
- MongoDB avec Mongoose
- Authentification JWT

### Frontend
- React.js avec hooks
- TanstackQuery pour les requêtes API
- Tailwind CSS pour le design
- Google Maps pour l'affichage des cartes et itinéraires
