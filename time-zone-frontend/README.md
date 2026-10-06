# Time Zone – Front-end

Application Angular du projet Timezone de Tahiti Numérique. Elle propose deux usages :

- **Accueil** (`/`) : on choisit un fuseau horaire et une date, et l'application affiche la date correspondante dans tous les autres fuseaux configurés. Il faut au moins deux fuseaux.
- **Administration** (`/admin`) : liste paginée des fuseaux horaires, avec création, consultation, modification et suppression.

Les données viennent de l'API du back-end Spring Boot (dossier `../time-zone`), exposée sous `/api/timezones`.

**Stack** : Angular 21 (composants standalone, zoneless, signals), PrimeNG 21 (thème Lara), PrimeFlex, Vitest + jsdom, angular-eslint.

## Prérequis

- Node.js 20.19+ ou 22.12+ (l'image Docker utilise Node 22), et npm
- le back-end `time-zone` démarré sur le port **7373**

## Démarrage en local

```bash
npm ci
npm start
```

L'application est servie sur http://localhost:4200 et se recharge à chaque modification.

`npm start` lance `ng serve --proxy-config proxy.conf.json` : les appels à `/api` sont redirigés vers `http://localhost:7373`.

> Lancer `ng serve` seul n'active pas le proxy. Les appels à l'API échouent alors, et l'accueil affiche « Impossible de charger les fuseaux horaires ».

## Commandes

| Commande | Rôle |
|---|---|
| `npm start` | Serveur de développement avec proxy vers le back |
| `npm test -- --watch=false` | Tests unitaires (Vitest, jsdom) en une passe. Sans l'option, les tests tournent en mode watch |
| `npm run lint` | ESLint sur le TypeScript et les templates (règles dans `eslint.config.js`). `npx ng lint --fix` corrige ce qui peut l'être |
| `npm run build` | Build de production dans `dist/browser/` |

## Docker

Le `Dockerfile` construit l'application avec Node 22, puis la sert avec `nginx-unprivileged` (non root) sur le port **8080**.

La configuration `nginx/default.conf` :
- renvoie `index.html` pour toutes les routes de l'application (fallback SPA) ;
- force la revalidation de `index.html` (`no-cache`), pour que le navigateur charge toujours la dernière version ;
- met en cache indéfiniment les fichiers dont le nom contient un hash (`main-XXXX.js`, `chunk-XXXX.js`…) ;
- inclut `/etc/nginx/extra/*.conf`. **Sans fichier monté dans ce dossier, `/api` n'est redirigé nulle part.**

La redirection vers le back est fournie par `nginx/api_redirection-local.conf` (`/api` vers `http://backend:7373`). Il faut la monter au lancement :

```bash
docker build -t time-zone-frontend .
docker run -p 8080:8080 \
  -v "$(pwd)/nginx/api_redirection-local.conf:/etc/nginx/extra/api_redirection-local.conf:ro" \
  time-zone-frontend
```

Le nom d'hôte `backend` doit être résolu depuis le conteneur. Le plus simple est d'utiliser le `docker-compose.yml` à la racine du dépôt : il démarre le back et le front, et monte déjà ce fichier.

```bash
cd ..
docker-compose up    # front sur http://localhost:8080
```

## Structure du code

```
src/
├── app/
│   ├── app.config.ts          # providers : router, HttpClient + intercepteur, PrimeNG
│   ├── app.routes.ts          # routes principales, toutes chargées à la demande
│   ├── shared/
│   │   ├── component/header/  # barre du haut
│   │   ├── interceptor/       # toast d'erreur sur toute erreur HTTP
│   │   ├── model/             # interfaces des requêtes et réponses de l'API
│   │   └── service/           # TimezoneService (appels HTTP) et utilitaires de date
│   └── view/
│       ├── home/              # calcul de date
│       ├── administration/    # liste, puis timezone/ (consultation, création, modification)
│       └── not-found/         # page 404
└── testing/                   # fixtures partagées par les tests
```

Les pages de consultation et de modification reçoivent le fuseau horaire via un resolver (`timezone.routes.ts`), injecté dans l'input `data` grâce à `withComponentInputBinding`. Si le fuseau n'existe pas, le resolver redirige vers `/404`.

## Claude Code

Le projet fournit deux skills [Claude Code](https://docs.claude.com/en/docs/claude-code) dans `.claude/skills/`. Ils servent à auditer le front et à suivre la correction des points relevés. Ils travaillent tous les deux sur le fichier `rapport-analyse-frontend.md`, à la racine du projet.

### `/analyse-frontend` : analyser le front

Ce skill lance `ng lint`, `ng test` et `ng build`, lit le code et la configuration, puis crée ou met à jour `rapport-analyse-frontend.md`.

Le rapport est une **liste de suivi** sur la durée. On le relance après des corrections pour voir ce qui est réglé et ce qui est nouveau.

**Structure du rapport :**
- une synthèse : nombre de points ouverts par gravité, résultat du lint, des tests et du build ;
- *1. Analyse technique* : Linter, Structure du code, Homogénéité, Qualité ;
- *2. Analyse fonctionnelle* : Bugs potentiels, Analyse UX/UI, Linter (templates et accessibilité), Wording ;
- *Points clos* : points corrigés ou ignorés ;
- *Historique des analyses* : une ligne par exécution.

**Conventions :**
- **Identifiant** : `FRONT-AAAAMMJJ-NN`. La date est celle de la découverte du point. L'identifiant est définitif : il n'est jamais renuméroté ni réutilisé.
- **Gravité** : Critique, Majeur, Mineur ou Info.
- **Tri** : dans chaque sous-section, par gravité puis par date de découverte (la plus ancienne en premier).
- **Statuts** : `Ouvert`, `Corrigé le …` ou `Ignoré le … (faux positif | choix technique | hors périmètre)`.

**Quand on relance l'analyse :**
- un point toujours présent garde son identifiant ;
- un point disparu du code passe en `Corrigé` ;
- un point qui réapparaît est rouvert avec le même identifiant ;
- un point ignoré n'est pas re-signalé ;
- les notes ajoutées à la main sont conservées.

### `/correction-frontend <identifiant>` : traiter un point du rapport

```
/correction-frontend FRONT-20261006-07
```

Ce skill traite un seul point du rapport :

1. Il relit le point et vérifie dans le code que le constat tient toujours.
2. **Si le problème est réel**, il propose une correction et attend la validation de l'utilisateur. Il l'applique ensuite et lance le lint et les tests. Le point passe en `Corrigé le …` avec une ligne `Correction`.
3. **Sinon**, il argumente, preuves à l'appui : faux positif, choix technique assumé ou hors périmètre. Après confirmation, le point passe en `Ignoré le … (motif)` avec une ligne `Justification`. Si le constat n'est que partiellement juste, le point est révisé dans le rapport et reste ouvert.
4. Il met à jour le rapport : le point est déplacé dans « Points clos » et la synthèse est recalculée.

Aucune modification du code ni du rapport n'est faite sans validation, et rien n'est commité automatiquement.

### Workflow conseillé

1. `/analyse-frontend` pour produire ou rafraîchir le rapport.
2. `/correction-frontend FRONT-…` pour chaque point à traiter, en commençant par les plus graves.
3. `/analyse-frontend` de nouveau pour confirmer les corrections et détecter les régressions.
