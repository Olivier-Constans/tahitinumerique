# Rapport d'analyse front-end

> Projet : time-zone-frontend · Dernière analyse : 2026-10-07 · Commit analysé : 127d108

## Synthèse

> Points clos : voir `rapport-analyse-frontend-clos.md`.

| Section | Critique | Majeur | Mineur | Info | Total ouverts |
|---|---|---|---|---|---|
| 1. Analyse technique | 0 | 0 | 0 | 3 | 3 |
| 2. Analyse fonctionnelle | 0 | 0 | 5 | 0 | 5 |
| **Total** | **0** | **0** | **5** | **3** | **8** |

**Outils** : lint OK · tests 66/66 passés (13 fichiers) · build OK sans avertissement (bundle initial 648,24 kB pour un budget de 750 kB) · Prettier OK

**Depuis la dernière analyse** (analyse complète) : 4 nouveaux (FRONT-20261007-09 à -12), 4 corrigés et clos (FRONT-20261007-03 et -06, clos entre les deux analyses et confirmés absents du code ; FRONT-20261007-05 et FRONT-20261006-06, clos par cette analyse), 0 rouvert.

## 1. Analyse technique

### 1.1 Linter

Aucun point ouvert.

### 1.2 Structure du code

#### FRONT-20261006-04 · Info · Administration accessible sans authentification
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/app.routes.ts:10-14`
- **Constat** : la route `admin` n'a ni `canActivate` ni `canMatch`. N'importe quel visiteur peut créer, modifier ou supprimer des fuseaux.
- **Impact** : acceptable pour un test technique. À traiter avant une mise en production, côté back comme côté front.
- **Recommandation** : ajouter un guard `canMatch` sur `admin` une fois qu'une authentification existe côté back.

### 1.3 Homogénéité

#### FRONT-20261007-10 · Info · Générateurs configurés pour SCSS dans un projet en CSS
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `angular.json:9-11,24`
- **Constat** : `@schematics/angular:component` déclare `"style": "scss"` et `inlineStyleLanguage` vaut `scss`, alors que le projet n'a qu'une feuille globale `src/styles.css` et aucun style de composant (mise en forme par Tailwind et PrimeNG).
- **Impact** : `ng generate component` crée des fichiers `.scss`, ce qui introduirait un second langage de style.
- **Recommandation** : passer les deux valeurs à `css`, ou `"style": "none"` si les composants ne doivent pas avoir de feuille propre.

### 1.4 Qualité

#### FRONT-20261007-11 · Info · Polices d'icônes exclues du cache longue durée de nginx
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `nginx/default.conf:20`
- **Constat** : la règle de cache immuable ne vise que `^/(main|chunk|polyfills|styles)-[A-Z0-9]{8}\.(js|css)$`. Le build produit aussi `media/primeicons-4GST5W3O.woff2` (et `.woff`, `.ttf`, `.svg`), dont le nom est haché mais qui tombent dans `location /` et reçoivent `Cache-Control: no-cache`.
- **Impact** : la police d'icônes est revalidée à chaque chargement de page. Coût faible (requête conditionnelle, réponse 304), mais inutile.
- **Recommandation** : étendre la règle, par exemple `location ~* "^/(media/[^/]+|(main|chunk|polyfills|styles))-[A-Z0-9]{8}\.(js|css|woff2?|ttf|svg)$"`, ou ajouter un bloc `location /media/` avec le même en-tête.

## 2. Analyse fonctionnelle

### 2.1 Bugs potentiels

#### FRONT-20261006-12 · Mineur · Heures décalées pendant le passage à l'heure d'été du navigateur
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/shared/util/date.util.ts:7-19`, `src/app/shared/model/calculateDate.model.ts:19`, `src/app/view/home/home.component.ts:95`, `src/app/shared/model/date.model.ts:4`
- **Constat** : l'heure saisie et l'heure affichée passent par un `Date` exprimé dans le fuseau du *navigateur*. Si cette heure n'existe pas localement (changement d'heure), JavaScript la décale. Vérifié avec `TZ=Europe/Paris` : 2026-03-29 02:30 saisi devient `2026-03-29T03:30:00.000Z` à l'envoi. De même, un résultat `LocalDateTime` à 02:30 ce jour-là s'affiche 03:30.
- **Impact** : un calcul faux d'une heure, une heure par an, uniquement pour les utilisateurs dont le navigateur est dans un fuseau à heure d'été. Tahiti n'est pas concerné.
- **Recommandation** : ne pas passer par l'heure locale. Formater la saisie avec `formatDate(value, "yyyy-MM-dd'T'HH:mm:ss", 'fr')` et envoyer la chaîne obtenue. Afficher le résultat directement depuis la chaîne `LocalDateTime` reçue, ou avec `date:'…':'UTC'` après l'avoir parsée comme UTC.
- **Révisé le 2026-10-07** : déplacé de `src/app/shared/service/date.function.ts` vers `src/app/shared/util/date.util.ts` (correction de FRONT-20261006-03), problème identique.

### 2.2 Analyse UX/UI

#### FRONT-20261006-15 · Mineur · Navigation incomplète dans l'administration
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/view/administration/timezone/timezone.component.html:1-7`, `src/app/view/administration/timezone/timezone-edit/timezone-edit.component.html:1`
- **Constat** : la page de consultation n'a pas de bouton « Modifier ». Le fil d'Ariane est un lien texte `> Administration`, avec un chevron saisi à la main.
- **Impact** : pour modifier un fuseau qu'on consulte, il faut revenir à la liste.
- **Recommandation** : ajouter un bouton « Modifier » (`[routerLink]="['edit']"`) et utiliser `p-breadcrumb`.

#### FRONT-20261007-12 · Mineur · Liste des décalages UTC non triée et sans recherche
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/view/administration/timezone/timezone-edit/timezone-edit.component.ts:56`, `src/app/view/administration/timezone/timezone-edit/timezone-edit.component.html:44-56`, `src/app/shared/model/offsetUTC.model.ts:4-46`
- **Constat** : le `p-select` reprend l'ordre de l'enum (identique à l'enum Java `OffsetUTC`) : `UTC`, puis `UTC+01` à `UTC+14`, puis `UTC-01` à `UTC-12`. Les décalages négatifs arrivent après les positifs, et `UTC-12` est en toute fin de liste. Les 41 options s'affichent sans champ de recherche (`[filter]` absent).
- **Impact** : pour Tahiti (`UTC-10`), il faut faire défiler presque toute la liste, après `UTC+14`. L'ordre ne correspond pas à l'axe des fuseaux.
- **Recommandation** : présenter les options de `UTC-12` à `UTC+14`, par exemple avec une liste ordonnée dédiée à l'affichage (sans toucher à l'enum de contrat), et ajouter `[filter]="true"` au `p-select`.

### 2.3 Linter (templates et accessibilité)

#### FRONT-20261007-07 · Mineur · Titre de document identique sur toutes les pages
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/app.routes.ts:5-24`, `src/app/view/administration/administration.routes.ts`, `src/app/view/administration/timezone/timezone.routes.ts:22-39`
- **Constat** : aucune route ne définit `title`. L'onglet affiche « Fuseaux horaires » sur l'accueil, l'administration, la consultation, le formulaire et la page introuvable.
- **Impact** : critère WCAG 2.4.2 (titre de page) non respecté, et un lecteur d'écran n'annonce pas le changement de page lors d'une navigation dans l'application. L'historique du navigateur est aussi indistinct.
- **Recommandation** : ajouter `title` aux routes (« Administration · Fuseaux horaires », « Nouveau fuseau horaire · Fuseaux horaires », « Page introuvable · Fuseaux horaires »), et un `ResolveFn<string>` ou une `TitleStrategy` pour reprendre le nom du fuseau consulté ou modifié.

### 2.4 Wording

#### FRONT-20261007-08 · Mineur · Guillemets droits dans le titre de modification
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/view/administration/timezone/timezone-edit/timezone-edit.component.html:7`
- **Constat** : le titre affiche `Modification du fuseau horaire "Tahiti"`, avec des guillemets droits, alors que les toasts et la confirmation de suppression utilisent les guillemets français (« Tahiti »).
- **Impact** : typographie incohérente au sein de l'interface.
- **Recommandation** : `Modification du fuseau horaire « {{ timezone.label }} »`, avec des espaces insécables si possible.
  

## Historique des analyses

| Date | Nouveaux | Corrigés | Rouverts | Ouverts au total | Lint | Tests |
|---|---|---|---|---|---|---|
| 2026-10-07 (2e analyse, complète) | 4 | 4 | 0 | 10 | OK | 66/66 |
| 2026-10-07 | 2 | 2 | 0 | 17 | OK | 39/39 |
| 2026-10-06 (2e analyse) | 3 | 4 | 1 | 19 | OK | 39/39 |
| 2026-10-06 | 20 | 0 | 0 | 20 | OK | 39/39 |
