# Time Zone – Front-end

Application Angular du projet Timezone de Tahiti Numérique. Elle propose deux usages :

- **Accueil** (`/`) : on choisit un fuseau horaire et une date, et l'application affiche la date correspondante dans tous les autres fuseaux configurés. Il faut au moins deux fuseaux.
- **Administration** (`/admin`) : liste paginée des fuseaux horaires, avec création, consultation, modification et suppression.

Les données viennent de l'API du back-end Spring Boot (dossier `../time-zone`), exposée sous `/api/timezones`.

**Stack** : Angular 21 (composants standalone, zoneless, signals), PrimeNG 21 (thème Lara), Tailwind CSS 4 (avec `tailwindcss-primeui`), Zod 4 (`zod/mini`), Vitest + jsdom, angular-eslint, Prettier.

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
| `npm run format` | Formate `src/` avec Prettier (règles dans `.prettierrc`). `npm run format:check` vérifie sans modifier |
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
│   ├── app.config.ts          # providers : router, HttpClient + intercepteurs, PrimeNG
│   ├── app.routes.ts          # routes principales, toutes chargées à la demande
│   ├── shared/
│   │   ├── component/header/  # barre du haut
│   │   ├── interceptor/       # validation Zod des réponses, toast sur toute erreur HTTP
│   │   ├── model/             # schémas Zod des réponses, interfaces des requêtes
│   │   └── service/           # TimezoneService (appels HTTP) et utilitaires de date
│   └── view/
│       ├── home/              # calcul de date
│       ├── administration/    # liste, puis timezone/ (consultation, création, modification)
│       └── not-found/         # page 404
├── styles.css                 # styles globaux : Tailwind et ses calques
└── testing/                   # fixtures partagées par les tests
```

Les pages de consultation et de modification reçoivent le fuseau horaire via un resolver (`timezone.routes.ts`), injecté dans l'input `data` grâce à `withComponentInputBinding`. Si le back répond 404, le resolver redirige vers `/404`. Pour toute autre erreur, déjà signalée par un toast, la navigation est annulée et l'utilisateur reste sur la page courante.

## Styles (Tailwind CSS)

La mise en page passe par les classes utilitaires de [Tailwind CSS](https://tailwindcss.com) 4, directement dans les templates (`flex`, `items-center`, `gap-2`, `w-full`…). Le projet ne définit pas de classes CSS à lui.

- `src/styles.css` importe le thème et les utilitaires de Tailwind, ainsi que `tailwindcss-primeui`. Ce plugin donne accès aux couleurs du thème PrimeNG : `bg-surface-200`, `text-primary`…
- Tailwind est branché sur le build Angular par PostCSS (`.postcssrc.json`). Seules les classes présentes dans les templates sont générées : la feuille de styles reste petite.
- Le preflight de Tailwind (sa remise à zéro des styles du navigateur) n'est pas importé : il modifierait l'apparence des titres, des marges et des listes.
- Les styles de PrimeNG sont placés dans le calque CSS `primeng` (option `cssLayer` dans `app.config.ts`), déclaré avant `utilities`. Une classe Tailwind posée sur un composant PrimeNG (`<p-select class="w-full">`) l'emporte donc sur le style du composant, sans `!important`.

**Conventions :**
- Utiliser les classes Tailwind plutôt que d'écrire du CSS. Si un style ne s'exprime pas avec Tailwind, le placer dans la feuille du composant concerné.
- Pour les couleurs, utiliser celles du thème PrimeNG (`surface-*`, `primary-*`) plutôt que la palette Tailwind, pour rester cohérent avec les composants.

## Modèles et validation des réponses (Zod)

Les réponses de l'API sont validées et converties à l'exécution avec [Zod](https://zod.dev), dans `src/app/shared/model/`.

- Chaque réponse est décrite par un **schéma**. Le type TypeScript du même nom en est déduit (`z.infer`) : le schéma est la seule source de vérité.
- La validation est faite par l'intercepteur `responseValidationInterceptor` (`src/app/shared/interceptor/`), pas par les services. Chaque appel HTTP déclare le schéma attendu via `HttpContext`, avec la fonction `expecting(Schema)`. L'intercepteur valide le corps et le remplace par la sortie du schéma. Un JSON non conforme lève une erreur au lieu de circuler avec un type faux.
- Les services, comme `TimezoneService`, se limitent à décrire les endpoints. Un nouveau service d'API n'a qu'à déclarer ses schémas, sans recopier de logique de validation.
- Les conversions se font dans les schémas, sans modifier l'objet reçu. Par exemple, `isoDate` transforme les dates ISO du back en `Date` à l'aide de `toDate`.
- `OffsetUTC` est une liste fermée de libellés (`"UTC"`, `"UTC+01"`…), identiques à ceux envoyés par le back. Les options du formulaire viennent de `OffsetUTC.options`.
- Les requêtes (`TimezoneRequest`, `CalculateDateRequest`) restent de simples interfaces, car elles sont envoyées et non reçues.

Exemple :

```ts
import * as z from "zod/mini";

export const TimezoneResponse = z.object({
  id: z.number(),
  label: z.string(),
  offsetUTC: OffsetUTC,
  audit: AuditResponse
});
export type TimezoneResponse = z.infer<typeof TimezoneResponse>;

// dans le service
getTimezoneById(id: number): Observable<TimezoneResponse> {
  return this._http.get<TimezoneResponse>(`${this.baseUrl}/${id}`, { context: expecting(TimezoneResponse) });
}
```

**Conventions :**
- On importe `zod/mini`, toujours avec `import * as z from "zod/mini"`. Avec `import {z}` ou le Zod classique, le bundle initial dépasse le budget de 1 Mo défini dans `angular.json`.
- Pour transformer une valeur, on enchaîne validation et transformation : `z.pipe(z.string(), z.transform(fn))`.
- Le type passé à `get<T>` (ou `post<T>`, `put<T>`) doit être celui déduit du schéma donné à `expecting`. Le compilateur ne vérifie pas la correspondance entre les deux.
- Une requête sans `expecting` (par exemple `deleteTimezone`) n'est pas validée.
- Si une réponse ne respecte pas son schéma, l'intercepteur journalise la `$ZodError` en console (avec la méthode et l'URL), affiche le toast « Réponse inattendue du serveur. », puis propage l'erreur à l'appelant.
- Dans `app.config.ts`, `responseValidationInterceptor` doit rester **avant** `httpErrorInterceptor`. Dans l'ordre inverse, `httpErrorInterceptor` intercepterait aussi l'erreur de validation et afficherait un second toast.

## Claude Code

Le projet fournit trois skills [Claude Code](https://docs.claude.com/en/docs/claude-code) dans `.claude/skills/`. Ils servent à auditer le front et à suivre la correction des points relevés. Ils travaillent sur `rapport-analyse-frontend.md` (points ouverts) et `rapport-analyse-frontend-clos.md` (points clos), à la racine du projet. Les conventions communes sont dans `.claude/skills/analyse-frontend/conventions.md`, et le script `.claude/skills/analyse-frontend/scripts/rapport.mjs` modifie un point (statut, clôture, réouverture, synthèse) sans relire tout le rapport.

### `/analyse-frontend` : analyser le front

Ce skill lance `ng lint`, `ng test` et `ng build`, lit le code et la configuration, puis crée ou met à jour `rapport-analyse-frontend.md`. Par défaut, l'analyse est incrémentale : seuls les fichiers modifiés depuis le commit noté dans le rapport, et ceux cités par les points ouverts, sont relus. Demander une « analyse complète » pour tout relire.

Le rapport est une **liste de suivi** sur la durée. On le relance après des corrections pour voir ce qui est réglé et ce qui est nouveau.

**Structure du rapport :**
- une synthèse : nombre de points ouverts par gravité, résultat du lint, des tests et du build ;
- *1. Analyse technique* : Linter, Structure du code, Homogénéité, Qualité ;
- *2. Analyse fonctionnelle* : Bugs potentiels, Analyse UX/UI, Linter (templates et accessibilité), Wording ;
- *Historique des analyses* : une ligne par exécution.

Les points corrigés ou ignorés sont déplacés dans `rapport-analyse-frontend-clos.md`, du plus récemment clos au plus ancien.

**Conventions :**
- **Identifiant** : `FRONT-AAAAMMJJ-NN`. La date est celle de la découverte du point. L'identifiant est définitif : il n'est jamais renuméroté ni réutilisé.
- **Gravité** : Critique, Majeur, Mineur ou Info.
- **Tri** : dans chaque sous-section, par gravité puis par date de découverte (la plus ancienne en premier).
- **Statuts** : `Ouvert`, `Corrigé le …` ou `Ignoré le …`, avec si possible un motif (faux positif, choix technique ou hors périmètre).

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
4. Il met à jour le rapport : le point est déplacé dans `rapport-analyse-frontend-clos.md` et la synthèse est recalculée.

Aucune modification du code ni du rapport n'est faite sans validation, et rien n'est commité automatiquement.

### `/manuel-correction-frontend <identifiant> <état>` : changer le statut à la main

```
/manuel-correction-frontend FRONT-20261006-07 Corrigé
/manuel-correction-frontend FRONT-20261006-04 Ignoré
/manuel-correction-frontend FRONT-20261006-07 Ouvert
```

Ce skill met à jour le statut d'un point sans lire ni modifier le code. Il sert quand la décision est déjà prise : un point corrigé à la main, ou un point qu'on choisit d'écarter.

- **Corrigé** : le point passe en `Corrigé le …` avec la mention « déclarée manuellement, sans vérification du code », puis il est déplacé dans le fichier des points clos. Si le problème est toujours dans le code, la prochaine analyse le rouvrira.
- **Ignoré** : le skill demande la raison (on peut répondre `N/A`). Le point passe en `Ignoré le …` avec une ligne `Justification`, puis il est déplacé dans le fichier des points clos. Il ne sera plus re-signalé.
- **Ouvert** : le point est rouvert et replacé dans sa sous-section, avec une ligne `Rouvert le …`. Son historique (`Correction`, `Justification`) est conservé.

La synthèse est recalculée à chaque changement. Ce skill ne se déclenche que sur appel explicite : Claude ne l'utilise jamais de lui-même.

### Workflow conseillé

1. `/analyse-frontend` pour produire ou rafraîchir le rapport.
2. `/correction-frontend FRONT-…` pour chaque point à traiter, en commençant par les plus graves, ou `/manuel-correction-frontend FRONT-… <état>` quand la décision est déjà prise.
3. `/analyse-frontend` de nouveau pour confirmer les corrections et détecter les régressions.
