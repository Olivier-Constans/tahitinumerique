---
name: correction-backend
description: Traite un point BACK-AAAAMMJJ-NN du rapport d'analyse back : vérifie le code, corrige, constate une résolution par évolution, ou argumente un rejet, puis met à jour le rapport.
argument-hint: <identifiant BACK-AAAAMMJJ-NN>
---

# Correction d'un point du rapport back-end

Traite **un seul** point, pour le fermer proprement : par une correction vérifiée, ou par une justification validée par l'utilisateur. Les conventions (statuts, lignes d'historique, évolutions, commandes Maven, script `rapport.mjs`) sont dans `../analyse-backend/conventions.md` : les lire d'abord.

Ne lire ni le rapport entier ni le fichier des points clos : passer par `rapport.mjs bloc <ID>`.

## Argument

- Identifiant complet ou numéro seul : `bloc` le résout, ou signale l'ambiguïté.
- Aucun identifiant, ou identifiant ambigu : `rapport.mjs liste ouverts`, puis demander lequel traiter.
- Point déjà clos : le signaler et demander s'il faut le rouvrir.

## Déroulé

### 1. Vérifier dans le code

Lire le bloc, puis les fichiers cités en cherchant le code concerné (les lignes bougent), avec son contexte utile : appelants, tests, `messages.properties`, et usage par le front (`../time-zone-frontend`) si le contrat d'API est en jeu. Si le code a changé depuis la découverte, consulter `git log --since=<date de découverte>`.

Conclure honnêtement :
- **le problème existe** : étape 2 ;
- **une évolution l'a fait disparaître** : étape 3 ;
- **une évolution l'a déplacé, réduit, étendu, transformé ou en a changé la gravité** : appliquer la règle des conventions, présenter la mise à jour avant de l'écrire, puis traiter ce qui reste. Un point transformé est fermé selon l'étape 3, et le nouveau problème est signalé sans être créé : la prochaine analyse lui donnera un identifiant ;
- **il n'a jamais existé, ou ne vaut pas d'être corrigé** : étape 4.

La recommandation du rapport est une piste, pas un ordre.

### 2. Proposer, appliquer, vérifier

1. **Proposer avant de toucher au code** : fichiers et nature du changement (court extrait de diff si parlant), effets de bord (en particulier sur le contrat d'API consommé par le front), tests ajoutés ou adaptés. Attendre l'accord : une correction refusée ne laisse aucune modification.
2. **Appliquer** dans le style du code environnant, dans le périmètre du point. Si un autre point est réglé au passage, le dire, sans le fermer. Si le contrat d'API change, signaler ce que le front doit adapter, sans modifier le front.
3. **Vérifier** avec les commandes Maven des conventions (compilation avec avertissements, puis tests), en ne gardant que le résumé. Lancer aussi le paquet si `pom.xml`, la configuration ou le `Dockerfile` changent. Ne pas fermer le point tant qu'un test échoue.
4. **Mettre à jour le rapport** : `statut`, `ligne` (`**Correction** : …`), puis `clore`.

### 3. Constater une résolution par évolution

Présenter les preuves : ce qui a changé (fichiers, commit) et pourquoi le problème n'existe plus, après avoir vérifié qu'il n'est pas simplement ailleurs (rechercher le motif dans `src/`). Attendre la confirmation, puis appliquer `statut`, `ligne` (`**Correction** : résolu par une évolution, sans correction dédiée : …`, avec « remplacé par : … » si besoin) et `clore`. Le code n'est pas modifié, il n'y a donc ni compilation ni tests à lancer.

### 4. Argumenter un rejet

Expliquer, preuves à l'appui (code, test, documentation de Spring ou du JDK, contrainte du front), pourquoi le point est un **faux positif**, un **choix technique** ou **hors périmètre**. Proposer `Ignoré` avec ce motif et attendre la confirmation. Ensuite, `statut`, `ligne` (`**Justification** : …`) et `clore`. Si l'utilisateur n'est pas convaincu, revenir à l'étape 2.

Si le constat n'est que partiellement juste (gravité, emplacement, recommandation), proposer plutôt de le requalifier et de le laisser ouvert.

## Fin

Résumer en quelques lignes : décision prise, fichiers modifiés, résultat de la compilation et des tests, impact éventuel sur le front, autres points touchés au passage (signalés, pas traités), et nouveau problème introduit par une évolution, s'il y en a un.
