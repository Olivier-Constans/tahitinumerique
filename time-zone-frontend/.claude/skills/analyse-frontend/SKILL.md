---
name: analyse-frontend
description: Analyse le front-end Angular du projet (lint, structure, homogénéité, qualité, bugs potentiels, UX/UI, accessibilité, wording) et crée ou met à jour le rapport `rapport-analyse-frontend.md` à la racine du front, en conservant les identifiants et statuts des points déjà connus. À utiliser dès que l'utilisateur demande d'analyser, d'auditer ou de faire une revue du front, de mettre à jour ou rafraîchir le rapport d'analyse front, ou de vérifier quels points du rapport ont été corrigés.
---

# Analyse front-end

Ce skill produit et maintient un rapport d'analyse du front-end dans `rapport-analyse-frontend.md`, à la racine du projet front (le dossier qui contient `package.json` et `angular.json`).

Le rapport sert de **liste de suivi** sur la durée, pas d'instantané : on le relance après des corrections pour voir ce qui est réglé et ce qui est nouveau. Tout ce qui suit découle de cet objectif. Un point déjà connu doit garder son identifiant, sa date de découverte et son historique, sinon il devient impossible de suivre son évolution d'une analyse à l'autre.

## Déroulé

1. **Lire le rapport existant** s'il y en a un. Noter chaque point avec son identifiant, son statut, son emplacement et son constat.
2. **Collecter les faits** en lançant les outils du projet et en notant leur résultat brut :
   - `npm run lint` (ou `npx ng lint`)
   - `npx ng test --watch=false` : nombre de tests passés et en échec
   - `npx ng build` si le temps le permet : avertissements et budgets dépassés

   Si une commande échoue pour une raison d'environnement (dépendances absentes, par exemple), le noter dans le rapport plutôt que de deviner son résultat.
3. **Lire le code** de `src/` : composants, templates, services, modèles, routes, intercepteurs, tests. Lire aussi la configuration (`angular.json`, `tsconfig*.json`, `eslint.config.js`, `Dockerfile`, nginx, proxy). Quand le dépôt du back-end est accessible, vérifier les contrats d'API (types, formats de date, enums) avant de signaler une incohérence.
4. **Vérifier avant d'affirmer.** Un « bug potentiel » doit s'appuyer sur une lecture précise du code, et si possible sur un test existant ou un essai rapide. Si un test existant prouve que le comportement est correct, ne pas signaler le point. Un faux positif fait perdre confiance dans tout le rapport.
5. **Rapprocher les constats du rapport existant** (voir « Mise à jour »), puis écrire le fichier.
6. **Résumer dans la conversation** : nombre de points nouveaux, corrigés et toujours ouverts, et les deux ou trois points les plus graves. Si une évolution du code a fait bouger des points existants (résolus, déplacés, transformés), les citer. Le détail reste dans le fichier.

## Sections du rapport

Chaque point relevé va dans **une seule** sous-section, celle qui correspond le mieux :

**1. Analyse technique**
- **1.1 Linter** : résultat de `ng lint` sur le TypeScript, règles absentes ou désactivées qui mériteraient d'être activées, `eslint-disable` injustifiés.
- **1.2 Structure du code** : découpage en dossiers, lazy loading, séparation des responsabilités (composant, service, modèle), code mort, dépendances inutiles.
- **1.3 Homogénéité** : conventions de nommage, fautes de frappe dans les identifiants, styles d'import, cohérence des patterns (signals ou RxJS, gestion d'erreur, désabonnement).
- **1.4 Qualité** : typage (`as unknown as`, `!`, `any`), couverture et pertinence des tests, mutabilité, configuration de build et de déploiement.

**2. Analyse fonctionnelle**
- **2.1 Bugs potentiels** : comportements incorrects ou fragiles qu'un utilisateur peut rencontrer (dates, pagination, navigation, cas d'erreur, conditions de concurrence).
- **2.2 Analyse UX/UI** : parcours, retours visuels (chargement, erreurs, confirmations), cohérence de l'interface, responsive.
- **2.3 Linter (templates et accessibilité)** : résultats des règles de templates et d'accessibilité, et manques qu'elles ne détectent pas (boutons réduits à une icône sans `ariaLabel`, `lang` du document, labels de formulaires).
- **2.4 Wording** : textes affichés (fautes, mélange de langues, termes incohérents, titres de page, messages d'erreur).

Si une sous-section n'a aucun point ouvert, écrire « Aucun point ouvert. » plutôt que de la supprimer : la structure reste stable d'une analyse à l'autre.

## Identifiants

Format : `FRONT-AAAAMMJJ-NN`
- `AAAAMMJJ` : date de **découverte** du point, c'est-à-dire la date de l'analyse qui l'a relevé pour la première fois.
- `NN` : numéro d'ordre sur deux chiffres parmi les points découverts ce jour-là, à partir de `01`. Si une analyse a déjà eu lieu le même jour, reprendre après le plus grand `NN` existant pour cette date.

Un identifiant est **définitif**. Il n'est jamais renuméroté, réutilisé ni modifié, même si le point change de gravité, de section ou de statut.

## Gravité

| Niveau | Quand l'utiliser |
|---|---|
| Critique | Perte de données, faille de sécurité exploitable, fonctionnalité principale cassée |
| Majeur | Bug probable, erreur de typage qui masque un vrai problème, défaut d'accessibilité bloquant, action destructrice sans garde-fou |
| Mineur | Incohérence, dette technique, UX perfectible, wording |
| Info | Remarque ou suggestion sans défaut avéré |

## Ordre des points

Dans chaque sous-section, trier par **gravité** (Critique, puis Majeur, Mineur, Info), puis par **date de découverte**, de la plus ancienne à la plus récente. À gravité égale, un point qui traîne depuis longtemps apparaît ainsi en premier. Si la date est aussi la même, trier par identifiant.

## Format d'un point

```markdown
#### FRONT-20261006-03 · Majeur · Typage incorrect de `OffsetUTC`
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `src/app/shared/model/offsetUTC.model.ts:1`
- **Constat** : enum numérique (valeurs 0 à 40) alors que l'application manipule et envoie ses noms (`"UTC+01"`).
- **Impact** : le type ment, ce qui oblige à des `as unknown as OffsetUTC` dans les tests.
- **Recommandation** : remplacer par une constante `as const` et un type union dérivé.
```

Quelques règles :
- Rédiger le titre comme un constat court, pas comme une action.
- Indiquer l'emplacement avec `fichier:ligne` (plusieurs si besoin).
- Écrire la recommandation de façon concrète, avec un extrait de code quand ça aide.
- Mettre les références au code entre backticks.
- Ne mettre aucun emoji, ni dans le rapport ni dans le résumé : la gravité s'écrit en toutes lettres (Critique, Majeur, Mineur, Info).

Statuts possibles : `Ouvert`, `Corrigé le AAAA-MM-JJ`, `Ignoré le AAAA-MM-JJ`, suivi si possible du motif `(faux positif | choix technique | hors périmètre)`. `Ignoré` n'est posé que si l'utilisateur le demande, via le skill `correction-frontend` ou `manuel-correction-frontend` : ne pas décider seul qu'un point est sans intérêt.

Les skills `correction-frontend` et `manuel-correction-frontend` ajoutent parfois à un point une ligne `Correction`, `Justification`, `Révisé le …` ou `Rouvert le …`. Ces lignes font partie de l'historique du point et doivent être conservées.

## Mise à jour d'un rapport existant

Pour chaque point du rapport existant :
- **Toujours présent** : garder l'identifiant et la date de découverte, mettre à jour `Dernière vérification` et l'emplacement (les numéros de ligne bougent). Ajuster la gravité ou le texte si la situation a changé.
- **Disparu du code** : passer le statut à `Corrigé le <date du jour>` et déplacer le point dans la section « Points clos ». Si la disparition vient d'une évolution et non d'une correction dédiée (refonte, suppression du composant, changement de bibliothèque), ajouter la ligne `- **Correction** : résolu par une évolution, sans correction dédiée : <ce qui a changé>`. L'historique git des fichiers concernés (`git log --since=<dernière vérification>`) aide à l'identifier.
- **Déplacé par une évolution** (fichier renommé ou déplacé, composant refondu, problème identique) : c'est le même point. Garder l'identifiant, mettre à jour l'emplacement et ajouter une ligne « Révisé le … : déplacé de `<ancien emplacement>` vers `<nouvel emplacement>` ».
- **Partiellement résolu par une évolution** : le point reste `Ouvert`. Réduire l'emplacement et le constat à ce qui subsiste et ajouter une ligne « Révisé le … ».
- **Étendu par une évolution** (le même problème apparaît à de nouveaux endroits) : ajouter les emplacements au point existant, avec une ligne « Révisé le … », plutôt que de créer un nouveau point.
- **Transformé par une évolution** (le problème d'origine a disparu, mais un autre problème, de nature différente, est apparu au même endroit) : fermer l'ancien point comme « Disparu du code » en mentionnant « remplacé par FRONT-… », et créer un nouveau point avec la date du jour qui renvoie à l'ancien (« fait suite à FRONT-… »).
- **Marqué `Corrigé` manuellement mais toujours présent dans le code** : le rouvrir, ajouter une ligne « Rouvert le … : constat toujours présent dans le code », et le signaler dans le résumé.
- **Statut `Ignoré`** : le laisser tel quel dans « Points clos » et ne pas le re-signaler comme nouveau, même si le code n'a pas changé : c'est une décision validée par l'utilisateur. Le rouvrir seulement si le contexte qui justifiait la décision a disparu, et l'expliquer dans le résumé.
- **Réapparu après correction** : le rouvrir avec le même identifiant (statut `Ouvert`) et ajouter une ligne « Rouvert le … ».

Pour reconnaître qu'un constat correspond à un point existant, se fier à sa **nature et à sa localisation** (même fichier ou même composant, même problème), pas au texte exact. Un problème déjà connu, simplement reformulé, ne doit pas recevoir un nouvel identifiant. Après une refonte, la localisation peut avoir changé : c'est alors la nature du problème qui prime. En cas de doute entre « même point déplacé » et « nouveau point », préférer conserver l'identifiant existant et l'expliquer dans la ligne « Révisé le … ».

Les constats sans correspondance sont des **nouveaux points** : leur attribuer un identifiant avec la date du jour.

Les éventuelles notes ajoutées à la main par l'utilisateur dans un point doivent être conservées.

## Modèle du rapport

```markdown
# Rapport d'analyse front-end

> Projet : <nom du package.json> · Dernière analyse : AAAA-MM-JJ

## Synthèse

| Section | Critique | Majeur | Mineur | Info | Total ouverts |
|---|---|---|---|---|---|
| 1. Analyse technique | | | | | |
| 2. Analyse fonctionnelle | | | | | |
| **Total** | | | | | |

**Outils** : lint <OK / N erreurs> · tests <X/Y passés> · build <OK / avertissements>

**Depuis la dernière analyse** : N nouveaux, N corrigés, N rouverts.

## 1. Analyse technique
### 1.1 Linter
### 1.2 Structure du code
### 1.3 Homogénéité
### 1.4 Qualité

## 2. Analyse fonctionnelle
### 2.1 Bugs potentiels
### 2.2 Analyse UX/UI
### 2.3 Linter (templates et accessibilité)
### 2.4 Wording

## Points clos
<!-- Points corrigés ou ignorés, triés par date de clôture (la plus récente en premier), au même format -->

## Historique des analyses

| Date | Nouveaux | Corrigés | Rouverts | Ouverts au total | Lint | Tests |
|---|---|---|---|---|---|---|
```

Ajouter une ligne en haut de l'historique à chaque analyse. Ne jamais supprimer les lignes précédentes.
