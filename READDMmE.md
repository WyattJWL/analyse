# JWL Marketing — Générateur d'analyses SEO

Outil admin en pur HTML/CSS/JS (sans serveur) pour générer des rapports d'analyse SEO & concurrentielle sous forme de liens encodés.

## Structure du projet

```
jwl-marketing/
├── index.html          # Panel admin (login + génération d'analyses)
├── view.html           # Visualiseur public d'analyse (lu depuis le hash URL)
├── css/
│   └── styles.css      # Tous les styles (login, onboarding, admin, modal...)
├── js/
│   ├── auth.js         # Auth, sessions, gestion des admins (CRUD)
│   └── form.js         # Logique du formulaire, génération du lien
└── data/
    └── admins.json     # Référence structure admins (stockage réel = localStorage)
```

## Fonctionnalités

- **Login sécurisé** avec session `sessionStorage`
- **First-step onboarding** à la première connexion : demande prénom, nom, photo de profil (auto-rempli dans chaque analyse)
- **Génération d'analyse** : données encodées en base64 dans l'URL (`view.html#...`)
- **Gestion des admins** (Wyatt uniquement) :
  - Créer / modifier / supprimer un compte admin
  - Voir la dernière connexion de chaque admin
  - Upload photo de profil (base64) ou URL

## Comptes par défaut

| Identifiant | Mot de passe | Rôle |
|---|---|---|
| Wyatt | 100124 | Super Admin |
| Jodie | Watson2011@ | Admin |

> Les comptes sont stockés dans `localStorage` du navigateur (clé `jwl_admins_v2`). Ils persistent entre les sessions.

## Déploiement

Aucun serveur nécessaire — ouvrez simplement `index.html` dans un navigateur, ou déployez sur **GitHub Pages** / **Netlify** / tout hébergement statique.

### GitHub Pages
1. Push le repo sur GitHub
2. Settings → Pages → Source : `main` / `root`
3. URL : `https://[username].github.io/[repo]/`

## Notes techniques

- Pas de dépendances npm — tout est natif HTML/CSS/JS
- Les analyses ne sont PAS stockées sur un serveur : toutes les données sont encodées dans l'URL
- Les admins sont stockés dans `localStorage` (persistant par navigateur/machine)
- Compatible tous navigateurs modernes

---
Développé par Wyatt LAPAILLERIE-ENGONE pour JWL Marketing.
