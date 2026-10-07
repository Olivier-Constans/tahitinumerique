---
name: manuel-correction-backend
description: Change manuellement le statut d'un point du rapport `rapport-analyse-backend.md` (Ouvert, Corrigé, Ignoré) à partir de son identifiant, sans analyser ni modifier le code.
argument-hint: <identifiant BACK-AAAAMMJJ-NN> <Ouvert|Corrigé|Ignoré>
disable-model-invocation: true
model: haiku
---

# Changement manuel du statut d'un point

L'utilisateur sait déjà ce qu'il en est : ne pas lire le code, ne pas le modifier, ne lancer aucun outil du projet. Ne pas lire non plus le rapport : tout passe par le script, lancé depuis la racine du back. Enchaîner les commandes d'une étape dans un seul appel Bash, en commençant par `S=.claude/skills/analyse-backend/scripts/rapport.mjs;` (la variable ne survit pas d'un appel à l'autre).

## Arguments

`<identifiant> <état>`, par exemple `BACK-20261007-07 Corrigé`.
- **Identifiant** : complet, ou numéro seul s'il est unique. S'il est introuvable ou ambigu, le script le dit : montrer les correspondances (`node $S liste`) et demander.
- **État** : `Ouvert`, `Corrigé` ou `Ignoré`, sans tenir compte des accents ni de la casse. Pour toute autre valeur, rappeler les trois états et demander.

Si un argument manque, le demander.

## Déroulé

1. `node $S bloc <ID>` pour connaître le statut actuel. Si c'est déjà l'état demandé, le dire et s'arrêter.
2. Appliquer les commandes (date du jour au format AAAA-MM-JJ) :

**Corrigé**
```
node $S statut <ID> "Corrigé le <date>"
node $S ligne <ID> "**Correction** : déclarée manuellement par l'utilisateur, sans vérification du code.<précision éventuelle de l'utilisateur>"
node $S clore <ID>
```

**Ignoré** : demander d'abord la raison (l'utilisateur peut répondre `N/A`), car la prochaine analyse ne re-signalera pas ce point.
```
node $S statut <ID> "Ignoré le <date> (<motif>)"   # motif : faux positif | choix technique | hors périmètre, seulement s'il est évident ; sinon pas de parenthèse
node $S ligne <ID> "**Justification** : <raison ou N/A>"
node $S clore <ID>
```

**Ouvert** (réouverture d'un point clos ; les lignes `Correction` et `Justification` sont conservées)
```
node $S statut <ID> Ouvert
node $S ligne <ID> "**Rouvert le <date>** : manuellement par l'utilisateur."
node $S placer <ID> <sous-section>
```
Déduire la sous-section (`1.1` à `2.4`) de la nature du point, d'après la liste des sections de `../analyse-backend/conventions.md`. En cas de doute, demander.

3. Résumer en une ou deux lignes : point, ancien statut, nouveau statut, et nombre de points ouverts (dernière ligne du script). Ne pas committer.
