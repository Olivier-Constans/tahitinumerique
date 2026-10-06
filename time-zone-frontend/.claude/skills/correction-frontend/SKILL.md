---
name: correction-frontend
description: Traite un point du rapport `rapport-analyse-frontend.md` à partir de son identifiant (ex. FRONT-20261006-07) - relit le constat, vérifie dans le code, propose et applique une correction, constate qu'une évolution du code l'a résolu ou déplacé, ou argumente pourquoi il ne faut pas corriger (faux positif, choix technique assumé), puis met à jour le rapport. À utiliser dès que l'utilisateur donne un identifiant FRONT-… ou demande de corriger, traiter, régler ou contester un point du rapport d'analyse front.
argument-hint: <identifiant FRONT-AAAAMMJJ-NN>
---

# Correction d'un point du rapport front-end

Ce skill traite **un seul** point du rapport `rapport-analyse-frontend.md`, situé à la racine du projet front. Le rapport est produit par le skill `analyse-frontend`, et ses conventions (identifiants, statuts, ordre, format) s'appliquent ici aussi.

L'objectif est de fermer le point proprement : soit par une correction vérifiée, soit par une justification que l'utilisateur valide. Dans les deux cas, le rapport doit refléter ce qui s'est passé, pour que la prochaine analyse ne re-signale pas le point à tort.

## Argument

L'identifiant du point, par exemple `FRONT-20261006-07`.
- Si l'utilisateur ne donne que le numéro (`07`) et qu'un seul point porte ce numéro, le prendre.
- Si plusieurs points portent ce numéro, ou si aucun identifiant n'est donné, lister les points ouverts (identifiant, gravité, titre) et demander lequel traiter.
- Si le point est déjà clos (`Corrigé` ou `Ignoré`), le signaler et demander s'il faut le rouvrir avant d'aller plus loin.

## Déroulé

### 1. Relire le point

Lire le bloc du point dans le rapport : constat, emplacement, impact, recommandation, et les éventuelles notes de l'utilisateur.

### 2. Vérifier dans le code

Ouvrir les fichiers cités. Les numéros de ligne peuvent avoir bougé : chercher le code concerné plutôt que de se fier à la ligne. Lire aussi le contexte utile : appelants, tests existants, et contrat d'API côté back si le point en dépend.

Si le code cité a changé depuis la découverte du point, consulter l'historique (`git log --since=<date de découverte> -- <fichiers>`, ou sur le dossier parent si les fichiers ont été renommés ou supprimés) pour comprendre ce qui a évolué. C'est ce qui permet de distinguer un problème qui n'a jamais existé d'un problème qu'une évolution a fait disparaître.

Se demander honnêtement si le constat tient toujours :
- **Le problème existe** : passer à l'étape 3.
- **Le problème existait mais une évolution du code l'a fait disparaître** (refonte, suppression d'un composant, changement de bibliothèque, correction d'un autre point) : passer à l'étape 3 bis.
- **Le problème existe toujours, mais une évolution l'a déplacé ou transformé** : voir « Point touché par une évolution » plus bas.
- **Le problème n'a jamais existé** : passer à l'étape 4. C'est le cas d'un faux positif ou d'un comportement garanti par un framework ou un test.
- **Le problème existe mais le corriger ne vaut pas le coût**, ou il résulte d'un choix technique assumé : passer à l'étape 4.

La recommandation du rapport est une piste, pas un ordre. Si une meilleure solution apparaît en lisant le code, la proposer.

#### Point touché par une évolution

Une évolution entre deux analyses peut modifier un point sans le régler. Les cas possibles :
- **Déplacé** : le code a été renommé, déplacé ou refondu, mais le problème est identique. C'est le même point : mettre à jour l'emplacement (ligne `Révisé le …`), puis passer à l'étape 3.
- **Partiellement résolu** : l'évolution a réglé une partie des emplacements ou des aspects du constat. Le point reste `Ouvert` : réduire l'emplacement et le constat à ce qui subsiste (ligne `Révisé le …`), puis passer à l'étape 3 pour le reste.
- **Étendu** : l'évolution a reproduit le même problème à d'autres endroits. Ajouter ces emplacements au point (ligne `Révisé le …`) plutôt que de créer un nouveau point.
- **Transformé** : le problème d'origine a disparu, mais l'évolution en a introduit un autre, de nature différente, au même endroit. Ce n'est plus le même point. Fermer celui-ci selon l'étape 3 bis et signaler le nouveau problème à l'utilisateur, sans le créer dans le rapport : la prochaine analyse lui attribuera un identifiant.
- **Gravité changée** : l'évolution rend le problème plus ou moins grave (par exemple, un écran devenu central ou au contraire peu utilisé). Requalifier le point.

Ces mises à jour du rapport suivent les règles du point requalifié (voir « Mise à jour du rapport »). Les présenter à l'utilisateur avant de les écrire.

### 3 bis. Constater une résolution par évolution

Le problème a disparu sans correction dédiée. Ce n'est ni un faux positif ni un point à ignorer : le constat était juste au moment de l'analyse.

1. **Présenter les preuves** : ce qui a changé (fichiers, commit si on l'identifie) et pourquoi le problème n'existe plus. Vérifier que le problème n'a pas simplement été déplacé ailleurs (rechercher le motif en cause dans `src/`).
2. **Attendre la confirmation** de l'utilisateur.
3. **Mettre à jour le rapport** avec le statut `Corrigé le <date du jour>` et une ligne `Correction` qui précise qu'il s'agit d'une évolution (voir plus bas).

Le code n'est pas modifié. Il n'est donc pas nécessaire de relancer le lint ni les tests.

### 3. Proposer puis appliquer la correction

1. **Présenter la proposition** avant de toucher au code :
   - fichiers modifiés et nature du changement (un extrait de diff court si c'est parlant) ;
   - effets de bord éventuels ;
   - tests ajoutés ou adaptés.

   Attendre l'accord de l'utilisateur. Il peut vouloir une autre approche, et une correction refusée ne doit pas laisser de modifications dans le code.
2. **Appliquer** en respectant le style du code environnant. Rester dans le périmètre du point. Si la correction règle aussi un autre point du rapport, le dire, mais ne fermer que celui qui est demandé : l'autre sera constaté à la prochaine analyse.
3. **Vérifier** : lancer `npm run lint` et `npx ng test --watch=false`, ainsi que `npx ng build` si la correction touche la configuration, les styles ou les dépendances. Si un test échoue, corriger ou revenir vers l'utilisateur. Ne pas fermer le point avec des tests en échec.
4. **Mettre à jour le rapport** (voir plus bas), avec le statut `Corrigé le <date du jour>`.

Ne pas committer, sauf si l'utilisateur le demande.

### 4. Argumenter quand il ne faut pas corriger

Expliquer à l'utilisateur, preuves à l'appui (extrait de code, test existant, comportement documenté du framework, contrainte du back), pourquoi le point est :
- **un faux positif** : le problème décrit n'existe pas ;
- **un choix technique** : le comportement est voulu, et le changer coûterait plus que ça ne rapporte ;
- **hors périmètre** : le point relève du back, de l'infrastructure ou d'une décision produit.

Proposer ensuite le statut `Ignoré` avec ce motif, et **attendre la confirmation** de l'utilisateur avant de modifier le rapport. Si l'utilisateur n'est pas convaincu, laisser le point `Ouvert` et revenir à l'étape 3.

Si le constat n'est que partiellement juste (gravité surestimée, emplacement erroné, recommandation inadaptée), proposer plutôt de corriger le point dans le rapport et de le laisser `Ouvert`.

## Mise à jour du rapport

Modifier uniquement ce qui concerne le point traité, sans régénérer le reste du rapport.

**Point corrigé**
- Statut : `Corrigé le AAAA-MM-JJ`.
- Ajouter une ligne `- **Correction** : <ce qui a été changé, fichiers concernés, tests ajoutés>`.
- Déplacer le bloc dans « Points clos ». Cette section est triée par date de clôture, de la plus récente à la plus ancienne.

**Point résolu par une évolution**
- Statut : `Corrigé le AAAA-MM-JJ`.
- Ajouter une ligne `- **Correction** : résolu par une évolution, sans correction dédiée : <ce qui a changé, fichiers ou commit concernés>`.
- Si l'évolution a introduit un problème de nature différente au même endroit, le mentionner sur cette ligne (« remplacé par : … »), sans créer de nouveau point.
- Déplacer le bloc dans « Points clos ».

**Point ignoré**
- Statut : `Ignoré le AAAA-MM-JJ (faux positif | choix technique | hors périmètre)`.
- Ajouter une ligne `- **Justification** : <argument résumé, avec la preuve>`.
- Déplacer le bloc dans « Points clos ».

**Point requalifié** (resté ouvert, y compris un point déplacé, partiellement résolu ou étendu par une évolution)
- Mettre à jour la gravité, le constat, l'emplacement ou la recommandation.
- Mettre à jour `Dernière vérification` avec la date du jour.
- Ajouter une ligne `- **Révisé le AAAA-MM-JJ** : <ce qui a changé et pourquoi>`.
- Si la gravité change, replacer le point selon l'ordre de sa sous-section : gravité, puis date de découverte.

**Dans tous les cas**
- Garder l'identifiant et la date de découverte intacts.
- Recalculer le tableau de synthèse (nombre de points ouverts par gravité).
- Ne pas ajouter de ligne à « Historique des analyses » : cette table ne suit que les analyses complètes.
- Si la sous-section n'a plus de point ouvert, y écrire « Aucun point ouvert. ».
- N'utiliser aucun emoji.

## Fin

Résumer en quelques lignes :
- la décision prise (corrigé, résolu par une évolution, ignoré ou requalifié) ;
- les fichiers modifiés ;
- le résultat du lint et des tests ;
- les autres points du rapport touchés au passage, s'il y en a, y compris ceux qu'une évolution semble avoir réglés ou transformés : les signaler sans les traiter ;
- le nouveau problème introduit par une évolution, s'il y en a un, à faire relever par la prochaine analyse.
