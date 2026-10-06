# Rapport d'analyse front-end

> Projet : time-zone-frontend · Dernière analyse : 2026-10-07 · Commit analysé : 6cd521f

## Synthèse

> Points clos : voir `rapport-analyse-frontend-clos.md`.

| Section | Critique | Majeur | Mineur | Info | Total ouverts |
|---|---|---|---|---|---|
| 1. Analyse technique | 0 | 0 | 0 | 1 | 1 |
| 2. Analyse fonctionnelle | 0 | 0 | 6 | 0 | 6 |
| **Total** | **0** | **0** | **6** | **1** | **7** |

**Outils** : lint OK (0 erreur) · tests 39/39 passés (8 fichiers) · build OK avec 1 avertissement (budget initial dépassé : 955,68 kB pour 500 kB)

**Depuis la dernière analyse** : 2 nouveaux (FRONT-20261007-01, -02), 2 corrigés par une évolution (FRONT-20261006-07, -08, résolus par l'introduction de Zod dans le commit `d115c04`), 0 rouvert. Les points FRONT-20261006-02 et FRONT-20261006-05, corrigés après la précédente analyse, sont confirmés absents du code.

## 1. Analyse technique

### 1.1 Linter

Aucun point ouvert.

### 1.2 Structure du code

#### FRONT-20261006-04 · Info · Administration accessible sans authentification
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/app.routes.ts:10-13`
- **Constat** : la route `admin` n'a ni `canActivate` ni `canMatch`. N'importe quel visiteur peut créer, modifier ou supprimer des fuseaux.
- **Impact** : acceptable pour un test technique. À traiter avant une mise en production, côté back comme côté front.
- **Recommandation** : ajouter un guard `canMatch` sur `admin` une fois qu'une authentification existe côté back.

### 1.3 Homogénéité

#### FRONT-20261006-06 · Mineur · Style de code hétérogène (guillemets, espaces dans les imports, points-virgules)

- **Statut** : Ouvert

- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-07

- **Emplacement** : par exemple `src/app/app.component.ts:1-4`, `src/app/shared/service/timezone.service.ts:1-6`, `src/app/shared/service/date.function.ts`, `src/app/view/administration/timezone/timezone.routes.ts`

- **Constat** : un même fichier mélange `import { X } from '...'` et `import {X} from "..."`. Les points-virgules manquent dans certains fichiers (`date.function.ts`, `timezone.routes.ts`) et sont présents ailleurs.

- **Impact** : diffs bruyants, et pas de convention claire pour les contributeurs.

- **Recommandation** : ajouter Prettier (avec un `.prettierrc` et `eslint-config-prettier`) ou les règles `@stylistic` correspondantes, puis reformater tout le projet en un seul commit.

Aucun point ouvert.

### 1.4 Qualité

Aucun point ouvert.

## 2. Analyse fonctionnelle

### 2.1 Bugs potentiels

#### FRONT-20261006-12 · Mineur · Heures décalées pendant le passage à l'heure d'été du navigateur
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/shared/service/date.function.ts:1-15`, `src/app/shared/model/calculateDate.model.ts:6`, `src/app/view/home/home.component.ts:124`
- **Constat** : l'heure saisie et l'heure affichée passent par un `Date` exprimé dans le fuseau du *navigateur*. Si cette heure n'existe pas localement (changement d'heure), JavaScript la décale. Vérifié avec `TZ=Europe/Paris` : 2026-03-29 02:30 saisi devient `2026-03-29T03:30:00.000Z` à l'envoi. De même, un résultat `LocalDateTime` à 02:30 ce jour-là s'affiche 03:30.
- **Impact** : un calcul faux d'une heure, une heure par an, uniquement pour les utilisateurs dont le navigateur est dans un fuseau à heure d'été. Tahiti n'est pas concerné.
- **Recommandation** : ne pas passer par l'heure locale. Formater la saisie avec `formatDate(value, "yyyy-MM-dd'T'HH:mm:ss", 'fr')` et envoyer la chaîne obtenue. Afficher le résultat directement depuis la chaîne `LocalDateTime` reçue, ou avec `date:'…':'UTC'` après l'avoir parsée comme UTC.

### 2.2 Analyse UX/UI

#### FRONT-20261006-14 · Mineur · Retours visuels incomplets (chargement, succès)
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/view/home/home.component.html:11`, `src/app/view/administration/administration.component.html:12`, `src/app/view/administration/timezone/timezone-edit/timezone-edit.component.html:20`
- **Constat** : rien ne s'affiche pendant le chargement initial de la page d'accueil et de l'administration. Les boutons « Calculer » et « Enregistrer » n'ont pas d'état `loading` et restent cliquables pendant la requête. Seules les erreurs donnent lieu à un toast : la création, la modification et la suppression réussies ne sont pas confirmées.
- **Impact** : sur un réseau lent, l'écran reste vide et l'utilisateur peut soumettre plusieurs fois.
- **Recommandation** : afficher des `p-skeleton` ou un `p-progressSpinner` pendant le chargement, ajouter `[loading]` sur les boutons de soumission et un `messageService.add({severity: 'success', …})` après chaque écriture.

#### FRONT-20261006-15 · Mineur · Navigation incomplète dans l'administration
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/view/administration/timezone/timezone.component.html:1-7`, `src/app/view/administration/timezone/timezone-edit/timezone-edit.component.html:1`
- **Constat** : la page de consultation n'a pas de bouton « Modifier ». Le fil d'Ariane est un lien texte `> Administration`, avec un chevron saisi à la main.
- **Impact** : pour modifier un fuseau qu'on consulte, il faut revenir à la liste.
- **Recommandation** : ajouter un bouton « Modifier » (`[routerLink]="['edit']"`) et utiliser `p-breadcrumb`.

#### FRONT-20261006-21 · Mineur · Formulaire de fuseau sans contrainte de longueur ni message de validation
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/view/administration/timezone/timezone-edit/timezone-edit.component.ts:51-54`, `src/app/view/administration/timezone/timezone-edit/timezone-edit.component.html:9-20`
- **Constat** : le champ « Nom » n'a que `Validators.required`. Le back refuse un libellé de plus de 100 caractères (`Timezone.LABEL_MAX_LENGTH`, `ObjectValidator.maxLength`), mais le front ne le sait pas : l'utilisateur ne l'apprend qu'au toast d'erreur après l'envoi. Un nom composé uniquement d'espaces passe aussi `required`. Enfin, aucun message n'est affiché sous les champs : le bouton « Enregistrer » est simplement désactivé, sans dire pourquoi.
- **Impact** : un aller-retour serveur pour une erreur détectable à la saisie, et un bouton grisé sans explication.
- **Recommandation** : ajouter `Validators.maxLength(100)` et un validateur « non vide après `trim()` », `maxlength="100"` sur l'input, et un `<small class="p-error">` (ou `p-message`) sous chaque champ lorsqu'il est `invalid && touched`.

#### FRONT-20261006-22 · Mineur · Résultats du calcul sans rappel de la saisie et périmés après modification
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/view/home/home.component.html:40-47`, `src/app/view/home/home.component.ts:66-71`
- **Constat** : la section « Résultats » liste les dates obtenues sans rappeler le fuseau et la date de départ. Si l'utilisateur change ensuite le fuseau ou la date sans relancer le calcul, les anciens résultats restent affichés sous le formulaire modifié.
- **Impact** : des résultats qui ne correspondent plus aux valeurs visibles du formulaire, donc un risque de mauvaise lecture.
- **Recommandation** : titrer la section avec la saisie (« Le 06/10/2026 à 10:00 à Tahiti correspond à : »), à partir de la requête envoyée, et vider `result` (ou le griser) sur `form.valueChanges`.

### 2.3 Linter (templates et accessibilité)

#### FRONT-20261006-18 · Mineur · Langue du document déclarée en anglais
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/index.html:2`
- **Constat** : `<html lang="en">` alors que l'interface est principalement en français.
- **Impact** : les lecteurs d'écran prononcent le texte avec une phonétique anglaise, et la traduction automatique du navigateur se déclenche à tort.
- **Recommandation** : `<html lang="fr">`, et enregistrer la locale `fr` (`registerLocaleData(localeFr)` et `LOCALE_ID`) pour les pipes de date.

### 2.4 Wording

Aucun point ouvert.

## Historique des analyses

| Date | Nouveaux | Corrigés | Rouverts | Ouverts au total | Lint | Tests |
|---|---|---|---|---|---|---|
| 2026-10-07 | 2 | 2 | 0 | 17 | OK | 39/39 |
| 2026-10-06 (2e analyse) | 3 | 4 | 1 | 19 | OK | 39/39 |
| 2026-10-06 | 20 | 0 | 0 | 20 | OK | 39/39 |
