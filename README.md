# 🚚 Projet de Livraison - README

## 📌 Introduction

Ce projet vise à créer une plateforme de gestion des livraisons permettant aux commerçants de gérer leurs commandes, aux livreurs d'accepter des courses, et aux clients de suivre leur commande en temps réel. L'objectif est d'offrir une solution intuitive, optimisée et fiable pour tous les acteurs impliqués.

## 🚀 Fonctionnalités Principales

### Systeme de validation de livreur (upload de documents et verification par admin)

### Le commercant est oblige de soumettre une adresse

### Le livreur ne doit pas recevoir de commande s'il n'est pas disponible

### Profile admin

### 1. **Modélisation et Base de Données** (🔴 Priorité haute)

- Conception optimisée et normalisée de la base de données.
- Utilisation de l'algorithme de Chase pour garantir une structure efficace.
- Mise en place d'un système robuste de sauvegarde et de récupération des données.

### 2. **Gestion des Itinéraires et Suivi des Commandes** (🔴 Priorité haute)

- Intégration de Google Maps pour l'affichage des itinéraires et positions ✅.
- Intégration de Google Maps pour l'affichage des itinéraires et positions en temps réel 📌.
- Mettre a jour et partager la position du livreur aux autres 📌.
- Recuperer la position du livreur et l'afficher dans la liste des livreurs disponibles lorsqu'il souhaite travailler 📌.
- Securisation des routes pour les suivis de commandes ✅.
- API de gestion des commandes et itinéraires (les itinéraires doivent être recalculés en fonction de la position du livreur uniquement).
- Suivi des commandes en direct pour tous les acteurs impliqués ✅.
- Calcul optimisé de l'itinéraire en fonction du trafic en temps réel (partiellement implémenté, à améliorer).

### 3. **Système de Commande** (🔴 Priorité haute)

- Optimisation du processus de création des commandes.
- Recuperation des coordonnees en fonction d'une adresse ✅.
- Génération d'un lien de suivi pour chaque acteur ✅.
- Mise en place d'un système de notifications en temps réel (WebSockets) 📌.
- Lorsque le client commande, le commercant doit confirmer la validation de la commande 📌.
- Option pour le client de modifier ou annuler une commande avant validation ✅.

### 4. **Sélection et Attribution des Courses** (🔴 Priorité haute)

- Possibilité pour les livreurs d'accepter des courses si elles leur sont proposées.
- Affichage des livreurs disponibles sur la carte.
- Visualisation des commerçants sur la carte 📌.
- Tri intelligent des livreurs par distance et disponibilité.
- Vérification des capacités des véhicules pour assurer une livraison adaptée (poids, taille, volume).
- Implémentation d'un algorithme d'optimisation pour attribuer automatiquement la course au livreur le plus adapté.

## 🔹 Fonctionnalités Moins Prioritaires

### 5. **Gestion des Profils** (🟡 Priorité moyenne)

- Édition et personnalisation des profils utilisateur.
- Système de validation des documents des livreurs (permis, assurance, etc.).

### 6. **Tableau de Bord et Statistiques** (🟡 Priorité moyenne)

- Statistiques avancées sur les ventes des commerçants.
- Historique complet des commandes et livraisons.
- Analyse des performances des livreurs (temps moyen de livraison, notes des clients, etc.).

### 7. **Optimisation de l'Attribution des Courses** (🟡 Priorité moyenne / évolution future)

- Attribution automatique des commandes aux livreurs les plus proches.
- Mise en place d'un système de notation des livreurs et commerçants.
- Programme de fidélisation pour les livreurs et commerçants performants.

### 8. **Sécurité et Fiabilité** (🟡 Priorité moyenne)

- Authentification sécurisée (JWT, OAuth).
- Protection avancée contre la fraude et les abus (détection d'anomalies, validation des paiements).
- Chiffrement des données sensibles pour garantir la confidentialité.

### 9. **Support et Assistance** (🟡 Priorité moyenne)

- Mise en place d'un support client via chatbot et service de ticketing.
- Documentation complète pour les utilisateurs.

## 📅 Plan de Développement

1. Finalisation de la modélisation de la base de données ✅
2. Intégration de Google Maps et amélioration du suivi en temps réel 📌
3. Développement du système de gestion des commandes 📌
4. Implémentation du système de notification 📌
5. Développement et optimisation de l'interface utilisateur 📌
6. Ajout et amélioration des fonctionnalités secondaires 📌

---

### 🔍 Suggestions d'Amélioration

1. Améliorer la précision du suivi en temps réel.
2. Ajouter un mode "urgence" pour les livraisons prioritaires.
3. Intégrer un comparateur de prix pour les frais de livraison selon distance et volume.
4. Automatiser la répartition des courses en fonction de l'affluence.
5. Ajouter un système de récompenses pour les livreurs performants.
