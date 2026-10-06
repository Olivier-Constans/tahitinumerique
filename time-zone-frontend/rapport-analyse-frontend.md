# Rapport d'analyse front-end

> Projet : time-zone-frontend · Dernière analyse : 2026-10-06

## Synthèse

| Section | Critique | Majeur | Mineur | Info | Total ouverts |
|---|---|---|---|---|---|
| 1. Analyse technique | 0 | 1 | 6 | 4 | 11 |
| 2. Analyse fonctionnelle | 0 | 2 | 7 | 0 | 9 |
| **Total** | **0** | **3** | **13** | **4** | **20** |

**Outils** : lint OK (0 erreur) · tests 39/39 passés (8 fichiers) · build OK avec 1 avertissement (budget initial dépassé : 947,94 kB pour 500 kB)

**Depuis la dernière analyse** : première analyse, 20 nouveaux points.

## 1. Analyse technique

### 1.1 Linter

#### FRONT-20261006-01 · Info · Configuration ESLint sans règles basées sur les types
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `eslint.config.js:11-14`
- **Constat** : la configuration étend `tseslint.configs.recommended` et `stylistic`, qui n'analysent pas les types. Les assertions non nulles (`!`) et les doubles casts (`as unknown as`) passent donc sans alerte. `ng lint` ne remonte aucune erreur.
- **Impact** : aucun défaut actuel, mais le linter ne détecte pas les contournements de typage relevés en FRONT-20261006-07 et FRONT-20261006-08.
- **Recommandation** : passer à `tseslint.configs.recommendedTypeChecked` (avec `parserOptions.projectService: true`), ou au minimum activer `@typescript-eslint/no-non-null-assertion` en `warn`.

### 1.2 Structure du code

#### FRONT-20261006-02 · Mineur · Code mort et fichiers vides
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `src/app/shared/service/date.function.ts:7`, `src/app/app.component.ts:14`, `src/app/app.component.scss`, `src/styles.scss`
- **Constat** : `toUTCDate` n'est utilisée que dans son test. `AppComponent.title` n'est lu nulle part. `app.component.scss` est vide et `styles.scss` ne contient que le commentaire généré par Angular CLI.
- **Impact** : du bruit à la lecture, et un test qui maintient une fonction inutilisée.
- **Recommandation** : supprimer `toUTCDate` et son test, ainsi que `title`. Supprimer `app.component.scss` et retirer `styleUrl` du composant.

#### FRONT-20261006-03 · Mineur · Utilitaires de date rangés dans `service/` et appelés par un modèle
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `src/app/shared/service/date.function.ts`, `src/app/shared/model/audit.model.ts:1`
- **Constat** : `date.function.ts` contient des fonctions pures, pas un service injectable, mais il est rangé dans `service/`. De plus, `audit.model.ts` importe ce fichier : le modèle dépend de la couche service.
- **Impact** : la hiérarchie des dépendances est floue (modèle → service), et un utilitaire est difficile à trouver.
- **Recommandation** : déplacer vers `shared/util/date.util.ts`, et sortir `auditResponseTransform` du modèle, par exemple dans le service ou dans un fichier `mapper`.

#### FRONT-20261006-04 · Info · Administration accessible sans authentification
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `src/app/app.routes.ts:10-13`
- **Constat** : la route `admin` n'a ni `canActivate` ni `canMatch`. N'importe quel visiteur peut créer, modifier ou supprimer des fuseaux.
- **Impact** : acceptable pour un test technique. À traiter avant une mise en production, côté back comme côté front.
- **Recommandation** : ajouter un guard `canMatch` sur `admin` une fois qu'une authentification existe côté back.

### 1.3 Homogénéité

#### FRONT-20261006-05 · Mineur · Fautes de frappe dans les identifiants
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `src/app/shared/model/calculateDate.model.ts:3,7,11`, `src/app/shared/model/audit.model.ts:8`, `src/app/view/administration/timezone/timezone-edit/timezone-edit.component.ts:85`
- **Constat** : `CaculateDateItemResponse`, `CaculateDateResponse`, `CaculateDateResquest`, `AutitableResponse`, `reponse`.
- **Impact** : les recherches dans le code échouent, et la relecture laisse une impression de négligence.
- **Recommandation** : renommer en `CalculateDateItemResponse`, `CalculateDateResponse`, `CalculateDateRequest`, `AuditableResponse` et `response` (renommage via l'IDE).

#### FRONT-20261006-06 · Mineur · Style de code hétérogène (guillemets, espaces dans les imports, points-virgules)
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : par exemple `src/app/app.component.ts:1-4`, `src/app/shared/service/date.function.ts`, `src/app/view/administration/timezone/timezone.routes.ts`
- **Constat** : un même fichier mélange `import { X } from '...'` et `import {X} from "..."`. Les points-virgules manquent dans certains fichiers (`date.function.ts`, `timezone.routes.ts`) et sont présents ailleurs.
- **Impact** : diffs bruyants, et pas de convention claire pour les contributeurs.
- **Recommandation** : ajouter Prettier (avec un `.prettierrc` et `eslint-config-prettier`) ou les règles `@stylistic` correspondantes, puis reformater tout le projet en un seul commit.

### 1.4 Qualité

#### FRONT-20261006-07 · Majeur · Typage incorrect de `OffsetUTC`
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `src/app/shared/model/offsetUTC.model.ts:2`, `src/app/view/administration/timezone/timezone-edit/timezone-edit.component.ts:46`, `src/testing/timezone.fixture.ts:9`
- **Constat** : `OffsetUTC` est un enum numérique (valeurs 0 à 40). Pourtant, l'application manipule et envoie ses *noms* (`"UTC+01"`), comme le back qui attend un libellé (`OffsetUTC.getEnumForLabel`). Il faut `isNaN(Number(k))` pour extraire les options, et `as unknown as OffsetUTC` dans les tests.
- **Impact** : le type annoncé ne correspond pas à la valeur réelle. Une comparaison du type `offsetUTC === OffsetUTC["UTC+01"]` serait toujours fausse, sans erreur de compilation.
- **Recommandation** :
  ```ts
  export const OFFSETS_UTC = ['UTC', 'UTC+01', /* … */ 'UTC-12'] as const;
  export type OffsetUTC = typeof OFFSETS_UTC[number];
  ```
  Ensuite, `optionsOffsetUTC = [...OFFSETS_UTC]`, et les casts disparaissent des tests.

#### FRONT-20261006-08 · Mineur · Transformations de réponses par mutation et double cast
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `src/app/shared/model/audit.model.ts:12-16`, `src/app/shared/service/timezone.service.ts:47-55`
- **Constat** : `auditResponseTransform` et `calculateDate` modifient directement l'objet reçu, et déclarent comme `Date` des champs qui arrivent en `string` (`as unknown as string`).
- **Impact** : le type est faux jusqu'à la transformation. Un appel qui oublie la transformation compile sans erreur et manipule des chaînes typées `Date`.
- **Recommandation** : typer la réponse brute (`interface AuditDto { createDate: string; … }`) et renvoyer un nouvel objet : `({...data, audit: {createDate: toDate(data.audit.createDate), …}})`.

#### FRONT-20261006-09 · Mineur · Budget du bundle initial dépassé (PrimeFlex chargé en entier)
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `angular.json:31-35` (styles), `angular.json:41-45` (budgets)
- **Constat** : `ng build` affiche « bundle initial exceeded maximum budget » : 947,94 kB bruts pour 500 kB autorisés. La feuille `styles` pèse à elle seule 359 kB, car `primeflex.css` est importé en entier (446 kB) alors que l'application n'utilise qu'une vingtaine de classes (`flex`, `gap-2`, `m-2`, `p-2`, `w-full`, `text-center`…). Le transfert compressé reste raisonnable (153 kB).
- **Impact** : un avertissement permanent au build, qui finira par masquer un vrai dépassement. Le CSS chargé est surtout inutile.
- **Recommandation** : remplacer PrimeFlex par quelques classes utilitaires maison ou par Tailwind (avec purge, et qui est la recommandation actuelle de PrimeNG). À défaut, ajuster le budget en connaissance de cause.

#### FRONT-20261006-10 · Info · Couverture de tests incomplète
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `src/app/view/not-found/`, `src/app/view/administration/timezone/`
- **Constat** : 39 tests passent. `TimezoneEditComponent` et `TimezoneComponent` ne sont testés qu'à travers `timezone.routes.spec.ts`, ce qui est un bon choix. `NotFoundComponent` n'a aucun test et il n'y a pas de test e2e.
- **Impact** : faible pour l'instant. Le parcours complet (création puis calcul) n'est vérifié nulle part de bout en bout.
- **Recommandation** : ajouter un scénario Playwright couvrant la création de deux fuseaux, puis le calcul sur la page d'accueil.

#### FRONT-20261006-11 · Info · README générique d'Angular CLI
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `README.md`
- **Constat** : le README décrit `ng serve` et `ng generate`, mais ne dit rien du proxy `/api` vers `localhost:7373`, de l'image Docker, de la configuration nginx (`/etc/nginx/extra/*.conf`) ni du rôle de l'application.
- **Impact** : une prise en main plus lente pour un nouveau développeur ou un relecteur.
- **Recommandation** : ajouter une section « Démarrage » (back requis sur le port 7373, `npm start`) et une section « Docker » (build, montage de `api_redirection-local.conf`).

## 2. Analyse fonctionnelle

### 2.1 Bugs potentiels

#### FRONT-20261006-12 · Mineur · Heures décalées pendant le passage à l'heure d'été du navigateur
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `src/app/shared/service/date.function.ts:1-5,11-19`, `src/app/view/home/home.component.ts:125`
- **Constat** : l'heure saisie et l'heure affichée passent par un `Date` exprimé dans le fuseau du *navigateur*. Si cette heure n'existe pas localement (changement d'heure), JavaScript la décale. Vérifié avec `TZ=Europe/Paris` : 2026-03-29 02:30 saisi devient `2026-03-29T03:30:00.000Z` à l'envoi. De même, un résultat `LocalDateTime` à 02:30 ce jour-là s'affiche 03:30.
- **Impact** : un calcul faux d'une heure, une heure par an, uniquement pour les utilisateurs dont le navigateur est dans un fuseau à heure d'été. Tahiti n'est pas concerné.
- **Recommandation** : ne pas passer par l'heure locale. Formater la saisie avec `formatDate(value, "yyyy-MM-dd'T'HH:mm:ss", 'fr')` et envoyer la chaîne obtenue. Afficher le résultat directement depuis la chaîne `LocalDateTime` reçue, ou avec `date:'…':'UTC'` après l'avoir parsée comme UTC.

### 2.2 Analyse UX/UI

#### FRONT-20261006-13 · Majeur · Suppression d'un fuseau sans confirmation
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `src/app/view/administration/administration.component.html:27`, `src/app/view/administration/administration.component.ts:52`
- **Constat** : un seul clic sur la corbeille supprime le fuseau immédiatement. Aucune confirmation ni annulation n'est proposée.
- **Impact** : une suppression accidentelle est irréversible. Le bouton est en plus placé juste à côté de « Voir ».
- **Recommandation** : utiliser `ConfirmationService` et `<p-confirmDialog />` de PrimeNG (« Supprimer le fuseau "Tahiti" ? »), puis afficher un toast de succès.

#### FRONT-20261006-14 · Mineur · Retours visuels incomplets (chargement, succès)
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `src/app/view/home/home.component.html:11`, `src/app/view/administration/administration.component.html:12`, `src/app/view/administration/timezone/timezone-edit/timezone-edit.component.html:20`
- **Constat** : rien ne s'affiche pendant le chargement initial de la page d'accueil et de l'administration. Les boutons « Calculer » et « Enregistrer » n'ont pas d'état `loading` et restent cliquables pendant la requête. Seules les erreurs donnent lieu à un toast : la création, la modification et la suppression réussies ne sont pas confirmées.
- **Impact** : sur un réseau lent, l'écran reste vide et l'utilisateur peut soumettre plusieurs fois.
- **Recommandation** : afficher des `p-skeleton` ou un `p-progressSpinner` pendant le chargement, ajouter `[loading]` sur les boutons de soumission et un `messageService.add({severity: 'success', …})` après chaque écriture.

#### FRONT-20261006-15 · Mineur · Navigation incomplète dans l'administration
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `src/app/view/administration/timezone/timezone.component.html:1-7`, `src/app/view/administration/timezone/timezone-edit/timezone-edit.component.html:1`
- **Constat** : la page de consultation n'a pas de bouton « Modifier ». Le fil d'Ariane est un lien texte `> Administration`, avec un chevron saisi à la main.
- **Impact** : pour modifier un fuseau qu'on consulte, il faut revenir à la liste.
- **Recommandation** : ajouter un bouton « Modifier » (`[routerLink]="['edit']"`) et utiliser `p-breadcrumb`.

#### FRONT-20261006-16 · Mineur · Le pipe `titlecase` modifie les libellés saisis
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `src/app/view/home/home.component.html:44`
- **Constat** : les résultats affichent `data.timezone.label | titlecase`, alors que le libellé est affiché tel quel partout ailleurs (liste, consultation, select). « la Réunion » devient « La Réunion » et « USA – EST » devient « Usa – Est ».
- **Impact** : un même fuseau est présenté différemment d'une page à l'autre, et les sigles sont abîmés.
- **Recommandation** : retirer `titlecase` et afficher le libellé tel que l'administrateur l'a saisi.

### 2.3 Linter (templates et accessibilité)

#### FRONT-20261006-17 · Majeur · Boutons réduits à une icône sans libellé accessible
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `src/app/shared/component/header/header.component.html:13`, `src/app/view/administration/administration.component.html:7,25,26,27`
- **Constat** : les boutons `pi-cog`, `pi-plus`, `pi-pencil`, `pi-eye` et `pi-trash` n'ont ni `ariaLabel` ni texte. La règle `templateAccessibility` ne contrôle pas les composants PrimeNG, ce qui explique que `ng lint` ne les signale pas.
- **Impact** : un lecteur d'écran annonce seulement « bouton », ce qui rend l'administration inutilisable sans la vue. L'absence d'infobulle gêne aussi les utilisateurs voyants.
- **Recommandation** : ajouter par exemple `ariaLabel="Supprimer {{result.label}}"` et `pTooltip`, et faire de même pour « Administration », « Ajouter », « Modifier » et « Voir ».

#### FRONT-20261006-18 · Mineur · Langue du document déclarée en anglais
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `src/index.html:2`
- **Constat** : `<html lang="en">` alors que l'interface est principalement en français.
- **Impact** : les lecteurs d'écran prononcent le texte avec une phonétique anglaise, et la traduction automatique du navigateur se déclenche à tort.
- **Recommandation** : `<html lang="fr">`, et enregistrer la locale `fr` (`registerLocaleData(localeFr)` et `LOCALE_ID`) pour les pipes de date.

### 2.4 Wording

#### FRONT-20261006-19 · Mineur · Mélange d'anglais et de français dans l'interface
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `src/index.html:5`, `src/app/shared/component/header/header.component.html:9`, `src/app/view/administration/administration.component.html:4`, `src/app/view/administration/timezone/timezone.component.html:6`
- **Constat** : « TimeZoneFrontend » (titre de l'onglet), « Timezone project », « Timezone configuration » et « Offset: » côtoient des textes en français.
- **Impact** : une interface qui paraît inachevée.
- **Recommandation** : « Fuseaux horaires » pour l'onglet et le header, « Configuration des fuseaux horaires », « Décalage UTC : ».

#### FRONT-20261006-20 · Mineur · Terminologie « timezone » et « fuseau horaire » incohérente
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `src/app/view/administration/administration.component.html:19`, `src/app/view/administration/timezone/timezone-edit/timezone-edit.component.html:5,10,15`
- **Constat** : « Pas de timezone configurée », « Modification de la timezone », « Création timezone » et le label de champ « Label » côtoient « Fuseau horaire » et « Ajouter un fuseau horaire ». Le champ intitulé « Fuseau horaire » sert en réalité à choisir un décalage UTC.
- **Impact** : le vocabulaire est incohérent, et il y a une ambiguïté entre le fuseau (l'entité) et le décalage (sa propriété).
- **Recommandation** : utiliser « fuseau horaire » partout. Renommer les champs « Nom » et « Décalage UTC », et le titre en « Nouveau fuseau horaire ».

## Points clos

Aucun point clos.

## Historique des analyses

| Date | Nouveaux | Corrigés | Rouverts | Ouverts au total | Lint | Tests |
|---|---|---|---|---|---|---|
| 2026-10-06 | 20 | 0 | 0 | 20 | OK | 39/39 |
