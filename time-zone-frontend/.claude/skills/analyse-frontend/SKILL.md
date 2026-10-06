---
name: analyse-frontend
description: Analyse le front Angular (lint, structure, qualité, bugs, UX/UI, accessibilité, wording) et crée ou met à jour `rapport-analyse-frontend.md` en conservant identifiants et statuts. Pour auditer le front, rafraîchir le rapport ou vérifier les points corrigés.
---

# Analyse front-end

Lire d'abord `conventions.md` (dans le dossier de ce skill) : fichiers du rapport, script, sections, identifiants, gravité, format, statuts et règles d'évolution.

## Mode incrémental ou complet

- **Incrémental** (par défaut si le rapport existe et indique un `Commit analysé`) : ne relire que ce qui a pu changer :
  - `git diff --name-only <commit analysé>` (inclut les modifications non commitées) et `git ls-files --others --exclude-standard` ;
  - les fichiers cités dans l'emplacement des points ouverts.
- **Complet** : si le rapport n'existe pas, s'il n'a pas de commit analysé, si l'utilisateur demande une analyse complète, ou si le diff touche la configuration globale (`angular.json`, `tsconfig*.json`, `eslint.config.js`, `package.json`). Lire alors tout `src/` et la configuration (`angular.json`, `tsconfig*.json`, `eslint.config.js`, `Dockerfile`, nginx, proxy).

Indiquer le mode utilisé dans le résumé.

## Déroulé

1. **Lire le rapport ouvert** `rapport-analyse-frontend.md`. Pour les points clos, ne pas lire le fichier : `rapport.mjs liste clos` suffit, et `bloc <ID>` si un point clos semble réapparaître.
2. **Collecter les faits**, en ne gardant que le résumé des sorties :
   - `npm run lint 2>&1 | tail -30`
   - `npx ng test --watch=false 2>&1 | grep -E "Test Files|Tests|FAILED|Error" | head -30`
   - `npx ng build 2>&1 | grep -iE "warning|error|budget|bundle generation" | head -20` si le temps le permet.

   Si une commande échoue pour une raison d'environnement, le noter plutôt que de deviner son résultat. N'afficher la sortie complète que pour comprendre une erreur.
3. **Lire le code** selon le mode. Quand le dépôt du back est accessible, vérifier les contrats d'API (types, dates, enums) avant de signaler une incohérence.
4. **Vérifier avant d'affirmer.** Un bug potentiel s'appuie sur une lecture précise du code, et si possible sur un test ou un essai. Si un test prouve que le comportement est correct, ne pas le signaler : un faux positif décrédibilise le rapport.
5. **Rapprocher** chaque constat des points existants (« Point touché par une évolution » dans les conventions) :
   - toujours présent : `verif <ID>`, et mettre à jour l'emplacement si les lignes ont bougé ;
   - disparu du code : statut, ligne `Correction` (évolution si aucune correction dédiée), puis `clore` ;
   - marqué corrigé mais toujours présent, ou réapparu : rouvrir (`Rouvert le …`, `placer`) et le signaler dans le résumé ;
   - `Ignoré` : ne pas le re-signaler ;
   - sans correspondance : nouveau point avec la date du jour.
6. **Écrire le rapport ouvert** : les nouveaux points à leur place, l'en-tête (`Dernière analyse : <date> · Commit analysé : <git rev-parse --short HEAD>`), la ligne **Outils**, la ligne **Depuis la dernière analyse**, et une ligne en tête de « Historique des analyses » (ne jamais supprimer les précédentes). Les petites modifications passent par `Edit` ou le script. Une réécriture complète n'est justifiée que si beaucoup de points changent. Terminer par `rapport.mjs synthese`.
7. **Résumer dans la conversation** : mode utilisé, nouveaux, corrigés, rouverts et ouverts au total, les deux ou trois points les plus graves, et les points qu'une évolution a fait bouger. Le détail reste dans le fichier.

## Modèle du rapport (création)

```markdown
# Rapport d'analyse front-end

> Projet : <nom du package.json> · Dernière analyse : AAAA-MM-JJ · Commit analysé : <hash court>

## Synthèse

> Points clos : voir `rapport-analyse-frontend-clos.md`.

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

## Historique des analyses

| Date | Nouveaux | Corrigés | Rouverts | Ouverts au total | Lint | Tests |
|---|---|---|---|---|---|---|
```

Le fichier des points clos est créé par `rapport.mjs clore` au premier point clos.
