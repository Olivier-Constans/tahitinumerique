---
name: manuel-correction-frontend
description: Change manuellement le statut d'un point du rapport `rapport-analyse-frontend.md` (Ouvert, Corrigé, Ignoré) à partir de son identifiant, sans analyser ni modifier le code.
argument-hint: <identifiant FRONT-AAAAMMJJ-NN> <Ouvert|Corrigé|Ignoré>
disable-model-invocation: true
---

# Changement manuel du statut d'un point

Ce skill met à jour le statut d'**un** point du rapport `rapport-analyse-frontend.md`, situé à la racine du projet front, selon la décision de l'utilisateur. Il ne lit pas le code, ne le modifie pas et ne lance aucun outil : c'est l'utilisateur qui sait déjà ce qu'il en est. Par exemple, il a corrigé le point à la main, ou il décide de l'écarter.

Les conventions du rapport (identifiants, statuts, ordre, format, aucun emoji) sont celles du skill `analyse-frontend`. Le traitement assisté d'un point, avec vérification et correction du code, relève du skill `correction-frontend`.

## Arguments

`<identifiant> <état>`, par exemple `FRONT-20261006-07 Corrigé`.

- **Identifiant** : l'identifiant complet, ou le numéro seul (`07`) s'il est unique dans le rapport. S'il est introuvable ou ambigu, lister les points correspondants et demander lequel traiter.
- **État** : `Ouvert`, `Corrigé` ou `Ignoré`. Accepter les variantes sans accent et quelle que soit la casse (`corrige`, `IGNORE`, `ouvert`). Pour toute autre valeur, rappeler les trois états possibles et demander.

Si un argument manque, le demander plutôt que de deviner.

## Déroulé

1. Lire le rapport et trouver le bloc du point.
2. **Si l'état demandé est déjà l'état actuel**, le dire et ne rien modifier.
3. **Si l'état est `Ignoré`**, demander la raison à l'utilisateur avant toute modification. Il peut répondre `N/A` s'il ne souhaite pas en donner. La raison est nécessaire parce que la prochaine analyse ne re-signalera pas ce point : sans trace écrite, personne ne saura plus pourquoi il a été écarté.
4. Appliquer le changement (voir ci-dessous) avec la date du jour, puis mettre à jour la synthèse.
5. Résumer en une ou deux lignes : point concerné, ancien statut, nouveau statut, et nombre de points ouverts.

## Changements par état

**Corrigé**
- Statut : `Corrigé le AAAA-MM-JJ`.
- Ajouter la ligne `- **Correction** : déclarée manuellement par l'utilisateur, sans vérification du code.` Si l'utilisateur a donné une précision dans sa demande, l'ajouter à la suite.
- Déplacer le bloc dans « Points clos ».

**Ignoré**
- Statut :
  - `Ignoré le AAAA-MM-JJ (faux positif | choix technique | hors périmètre)` si la raison donnée relève clairement de l'un de ces motifs ;
  - sinon, simplement `Ignoré le AAAA-MM-JJ`.
- Ajouter la ligne `- **Justification** : <raison donnée par l'utilisateur>`, ou `- **Justification** : N/A` s'il a répondu `N/A`.
- Déplacer le bloc dans « Points clos ».

**Ouvert** (réouverture d'un point clos)
- Statut : `Ouvert`.
- Conserver les lignes `Correction` ou `Justification` existantes, qui font partie de l'historique du point. Ajouter la ligne `- **Rouvert le AAAA-MM-JJ** : manuellement par l'utilisateur.`
- Replacer le bloc dans sa sous-section d'origine, en respectant l'ordre : gravité, puis date de découverte, puis identifiant. La sous-section se déduit de la nature du point ; en cas de doute, demander. Si elle contenait « Aucun point ouvert. », retirer cette mention.

## Dans tous les cas

- Ne modifier que le point concerné, sans régénérer le reste du rapport.
- Garder intacts l'identifiant, le titre, la gravité et la date de découverte.
- Respecter l'ordre de « Points clos » : par date de clôture, de la plus récente à la plus ancienne. Le point qui vient d'être clos va donc en tête.
- Si la sous-section quittée n'a plus de point ouvert, y écrire « Aucun point ouvert. ».
- Recalculer le tableau de synthèse : nombre de points ouverts par gravité et par section.
- Ne pas ajouter de ligne à « Historique des analyses », qui ne suit que les analyses complètes.
- Ne pas committer.
