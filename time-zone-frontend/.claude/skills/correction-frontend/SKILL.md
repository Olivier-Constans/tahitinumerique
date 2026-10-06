---
name: correction-frontend
description: Traite un point FRONT-AAAAMMJJ-NN du rapport d'analyse front : vérifie le code, corrige, constate une résolution par évolution, ou argumente un rejet, puis met à jour le rapport.
argument-hint: <identifiant FRONT-AAAAMMJJ-NN>
---

# Correction d'un point du rapport front-end

Traite **un seul** point, pour le fermer proprement : par une correction vérifiée, ou par une justification validée par l'utilisateur. Les conventions (statuts, lignes d'historique, évolutions, script `rapport.mjs`) sont dans `../analyse-frontend/conventions.md` : les lire d'abord.

Ne lire ni le rapport entier ni le fichier des points clos : passer par `rapport.mjs bloc <ID>`.

## Argument

- Identifiant complet ou numéro seul : `bloc` le résout, ou signale l'ambiguïté.
- Aucun identifiant, ou identifiant ambigu : `rapport.mjs liste ouverts`, puis demander lequel traiter.
- Point déjà clos : le signaler et demander s'il faut le rouvrir.

## Déroulé

### 1. Vérifier dans le code

Lire le bloc, puis les fichiers cités en cherchant le code concerné (les lignes bougent), avec son contexte utile : appelants, tests, contrat d'API du back. Si le code a changé depuis la découverte, consulter `git log --since=<date de découverte>`.

Conclure honnêtement :
- **le problème existe** : étape 2 ;
- **une évolution l'a fait disparaître** : étape 3 ;
- **une évolution l'a déplacé, réduit, étendu, transformé ou en a changé la gravité** : appliquer la règle des conventions, présenter la mise à jour avant de l'écrire, puis traiter ce qui reste. Un point transformé est fermé selon l'étape 3, et le nouveau problème est signalé sans être créé : la prochaine analyse lui donnera un identifiant ;
- **il n'a jamais existé, ou ne vaut pas d'être corrigé** : étape 4.

La recommandation du rapport est une piste, pas un ordre.

### 2. Proposer, appliquer, vérifier

1. **Proposer avant de toucher au code** : fichiers et nature du changement (court extrait de diff si parlant), effets de bord, tests ajoutés ou adaptés. Attendre l'accord : une correction refusée ne laisse aucune modification.
2. **Appliquer** dans le style du code environnant, dans le périmètre du point. Si un autre point est réglé au passage, le dire, sans le fermer.
3. **Vérifier**, en ne gardant que le résumé : `npm run lint 2>&1 | tail -30` et `npx ng test --watch=false 2>&1 | grep -E "Test Files|Tests|FAILED|Error" | head -30`. Lancer aussi `npx ng build` (filtré sur warning, error et budget) si la configuration, les styles ou les dépendances changent. Ne pas fermer le point tant qu'un test échoue.
4. **Mettre à jour le rapport** : `statut`, `ligne` (`**Correction** : …`), puis `clore`.

### 3. Constater une résolution par évolution

Présenter les preuves : ce qui a changé (fichiers, commit) et pourquoi le problème n'existe plus, après avoir vérifié qu'il n'est pas simplement ailleurs (rechercher le motif dans `src/`). Attendre la confirmation, puis appliquer `statut`, `ligne` (`**Correction** : résolu par une évolution, sans correction dédiée : …`, avec « remplacé par : … » si besoin) et `clore`. Le code n'est pas modifié, il n'y a donc ni lint ni tests à lancer.

### 4. Argumenter un rejet

Expliquer, preuves à l'appui (code, test, documentation du framework, contrainte du back), pourquoi le point est un **faux positif**, un **choix technique** ou **hors périmètre**. Proposer `Ignoré` avec ce motif et attendre la confirmation. Ensuite, `statut`, `ligne` (`**Justification** : …`) et `clore`. Si l'utilisateur n'est pas convaincu, revenir à l'étape 2.

Si le constat n'est que partiellement juste (gravité, emplacement, recommandation), proposer plutôt de le requalifier et de le laisser ouvert.

## Fin

Résumer en quelques lignes : décision prise, fichiers modifiés, résultat du lint et des tests, autres points touchés au passage (signalés, pas traités), et nouveau problème introduit par une évolution, s'il y en a un.
