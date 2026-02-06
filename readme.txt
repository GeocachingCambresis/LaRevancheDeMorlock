# 🚀 La Revanche De Morlock - SHMUP by GeocachingCambresis

Un jeu de tir spatial (Shoot 'em up) vertical développé en **HTML5 Canvas** et **JavaScript**. Ce projet est optimisé pour être joué sur navigateurs mobiles (iOS/Android) et desktop.

## 🌟 Fonctionnalités

* **Gameplay Fluide :** Optimisé à 60 FPS avec gestion du redimensionnement des assets en mémoire.
* **Contrôles Tactiles :** Pilotage au doigt sur mobile et à la souris sur ordinateur.
* **Système de Boss :** Un boss final avec des patterns de tir circulaires ("Bullet Hell").
* **Parallaxe Spatial :** Fond étoilé dynamique sur deux niveaux pour un effet de profondeur.
* **Classement Local :** Sauvegarde automatique du Top 5 des meilleurs scores via `localStorage`.
* **Responsive Design :** S'adapte automatiquement à toutes les tailles d'écran.

## 🛠️ Installation & Déploiement

### 1. Pré-requis
Assurez-vous d'avoir les assets suivants dans le dossier racine :
* `vaisseau.png` (Joueur)
* `ennemi.png` (Ennemis de base)
* `boss.png` (Boss final)
* `laser.mp3`, `explosion.mp3`, `boss-music.mp3`

### 2. Test Local
Pour éviter les erreurs de sécurité (CORS) liées au chargement des images :
1. Utilisez l'extension **Live Server** sur VS Code.
2. Ou lancez un serveur Python local : `python -m http.server 8000`.

### 3. Hébergement (GitHub Pages)
1. Créez un nouveau dépôt sur GitHub.
2. Téléchargez vos fichiers.
3. Allez dans **Settings > Pages** et activez la publication sur la branche `main`.

## 🎮 Comment Jouer ?

* **Mobile :** Glissez votre doigt sur l'écran pour déplacer le vaisseau. Le tir est automatique.
* **Desktop :** Utilisez la souris pour diriger le vaisseau.
* **Objectif :** Détruisez les ennemis pour gagner des points. Atteignez 200 points pour faire apparaître le Boss Final.

## 📜 Licence
Ce projet est sous licence MIT. Vous pouvez l'utiliser et le modifier librement pour vos propres projets.