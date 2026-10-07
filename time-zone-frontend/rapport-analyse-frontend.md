# Rapport d'analyse front-end

> Projet : time-zone-frontend · Dernière analyse : 2026-10-07 · Commit analysé : 0767ab0

## Synthèse

> Points clos : voir `rapport-analyse-frontend-clos.md`.

| Section | Critique | Majeur | Mineur | Info | Total ouverts |
|---|---|---|---|---|---|
| 1. Analyse technique | 0 | 0 | 0 | 3 | 3 |
| 2. Analyse fonctionnelle | 0 | 0 | 5 | 1 | 6 |
| **Total** | **0** | **0** | **5** | **4** | **9** |

**Outils** : lint OK · tests 75/75 passés (13 fichiers) · build OK sans avertissement (bundle initial 652,64 kB pour un budget de 750 kB) · Prettier OK

**Depuis la dernière analyse** (analyse complète, `package.json` et `Dockerfile` modifiés) : 2 nouveaux (FRONT-20261007-13 et -14), 1 corrigé (FRONT-20261007-12, résolu par l'évolution vers les lieux), 0 rouvert. Évolution analysée : remplacement des fuseaux par des lieux à décalage fixe ou zone IANA, listes de décalages et de zones fournies par le back.

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
- **Emplacement** : `src/app/view/administration/place/place.component.html:1-12`, `src/app/view/administration/place/place-edit/place-edit.component.html:1`
- **Constat** : la page de consultation n'a pas de bouton « Modifier ». Le fil d'Ariane est un lien texte `> Administration`, avec un chevron saisi à la main.
- **Impact** : pour modifier un lieu qu'on consulte, il faut revenir à la liste.
- **Recommandation** : ajouter un bouton « Modifier » (`[routerLink]="['edit']"`) et utiliser `p-breadcrumb`.
- **Révisé le 2026-10-07** : déplacé de `view/administration/timezone/` vers `view/administration/place/` (passage aux lieux), problème identique.

#### FRONT-20261007-14 · Info · Type de lieu proposé par défaut : le décalage fixe, sans heure d'été
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/view/administration/place/place-edit/place-edit.component.ts:100`
- **Constat** : un nouveau lieu est créé par défaut en « Décalage UTC fixe ». Pour un lieu réel qui change d'heure (Paris, New York), ce type donne un résultat faux une partie de l'année ; seule la zone IANA suit l'heure d'été.
- **Impact** : un utilisateur qui ne change pas le type par défaut enregistre Paris en `UTC+01:00` et obtient des calculs décalés d'une heure tout l'été.
- **Recommandation** : proposer la zone par défaut (`ZONE_ID`), le décalage fixe restant disponible pour les cas sans heure d'été ; ou n'en présélectionner aucun pour forcer un choix conscient.

### 2.3 Linter (templates et accessibilité)

#### FRONT-20261007-07 · Mineur · Titre de document identique sur toutes les pages
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/app.routes.ts:5-24`, `src/app/view/administration/administration.routes.ts`, `src/app/view/administration/place/place.routes.ts:22-39`
- **Constat** : aucune route ne définit `title`. L'onglet affiche « Fuseaux horaires » sur l'accueil, l'administration, la consultation, le formulaire et la page introuvable.
- **Impact** : critère WCAG 2.4.2 (titre de page) non respecté, et un lecteur d'écran n'annonce pas le changement de page lors d'une navigation dans l'application. L'historique du navigateur est aussi indistinct.
- **Recommandation** : ajouter `title` aux routes (« Administration · Fuseaux horaires », « Nouveau lieu · Fuseaux horaires », « Page introuvable · Fuseaux horaires »), et un `ResolveFn<string>` ou une `TitleStrategy` pour reprendre le nom du lieu consulté ou modifié.
- **Révisé le 2026-10-07** : déplacé de `timezone.routes.ts` vers `place.routes.ts` (passage aux lieux) ; titres proposés adaptés au terme « lieu ».

### 2.4 Wording

#### FRONT-20261007-08 · Mineur · Guillemets droits dans le titre de modification
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/view/administration/place/place-edit/place-edit.component.html:7`
- **Constat** : le titre affiche `Modification du lieu "Tahiti"`, avec des guillemets droits, alors que les toasts et la confirmation de suppression utilisent les guillemets français (« Tahiti »).
- **Impact** : typographie incohérente au sein de l'interface.
- **Recommandation** : `Modification du lieu « {{ place.label }} »`, avec des espaces insécables si possible.
- **Révisé le 2026-10-07** : déplacé de `timezone-edit.component.html` vers `place-edit.component.html` (passage aux lieux), problème identique.

#### FRONT-20261007-13 · Mineur · Terme technique « Zone IANA » présenté à l'utilisateur
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/shared/model/place.model.ts:50-53`, `src/app/view/administration/place/place-edit/place-edit.component.html:41,56,76`, `src/app/view/administration/place/place.component.html:8`
- **Constat** : le formulaire propose de choisir entre « Décalage UTC fixe » et « Zone IANA », puis affiche le champ « Zone IANA » et le message « La zone IANA est obligatoire. ». La page de consultation affiche « Type : Zone IANA » et « Zone IANA : Europe/Paris ». IANA est le nom de l'organisme qui maintient la base des fuseaux, pas un terme connu des utilisateurs. Le libellé du choix, « Type de fuseau », emploie aussi « fuseau » alors que le reste de l'administration parle de « lieu ».
- **Impact** : l'utilisateur ne comprend pas ce qui distingue les deux types, en particulier que seule la zone suit l'heure d'été.
- **Recommandation** : un libellé qui décrit l'effet plutôt que la source, par exemple « Fuseau géographique (heure d'été comprise) » face à « Décalage UTC fixe », avec un texte d'aide sous le choix ; « Zone » ou « Fuseau » pour le champ, avec un exemple (« Europe/Paris »). Adapter `PLACE_TYPE_LABELS`, les libellés et le message d'erreur ensemble.
  

## Historique des analyses

| Date | Nouveaux | Corrigés | Rouverts | Ouverts au total | Lint | Tests |
|---|---|---|---|---|---|---|
| 2026-10-07 (3e analyse, complète) | 2 | 1 | 0 | 9 | OK | 75/75 |
| 2026-10-07 (2e analyse, complète) | 4 | 4 | 0 | 10 | OK | 66/66 |
| 2026-10-07 | 2 | 2 | 0 | 17 | OK | 39/39 |
| 2026-10-06 (2e analyse) | 3 | 4 | 1 | 19 | OK | 39/39 |
| 2026-10-06 | 20 | 0 | 0 | 20 | OK | 39/39 |
