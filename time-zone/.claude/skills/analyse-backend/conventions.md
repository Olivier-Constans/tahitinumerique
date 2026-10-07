# Conventions du rapport d'analyse back-end

Partagées par `analyse-backend`, `correction-backend` et `manuel-correction-backend`.

## Fichiers

À la racine du back (dossier de `pom.xml`) :
- `rapport-analyse-backend.md` : en-tête (projet, date, commit analysé), synthèse, points **ouverts** par sous-section, historique des analyses.
- `rapport-analyse-backend-clos.md` : points corrigés ou ignorés, du plus récemment clos au plus ancien.

Le rapport est une liste de suivi dans la durée : un point garde son identifiant, sa date de découverte et ses lignes d'historique (`Correction`, `Justification`, `Révisé le …`, `Rouvert le …`, notes de l'utilisateur) pour toujours.

## Script

`node .claude/skills/analyse-backend/scripts/rapport.mjs <commande>`, à lancer depuis la racine du back. Il évite de relire ou réécrire tout le rapport :

| Commande | Effet |
|---|---|
| `liste [ouverts\|clos]` | une ligne par point : identifiant, gravité, sous-section, statut, titre |
| `bloc <ID>` | le bloc du point, avec son fichier et ses numéros de ligne |
| `statut <ID> <texte>` | remplace la valeur de la ligne Statut |
| `verif <ID>` | met « Dernière vérification » à la date du jour |
| `ligne <ID> <texte>` | ajoute `- <texte>` à la fin du bloc |
| `clore <ID>` | déplace le point en tête du fichier des points clos |
| `placer <ID> [<sous-section>]` | range un point ouvert à sa place (gravité puis identifiant) dans sa sous-section, ou dans celle indiquée (`2.1`) ; sert à rouvrir un point clos ou à le replacer après un changement de gravité |
| `synthese` | recalcule le tableau de synthèse et les mentions « Aucun point ouvert. » |

`<ID>` accepte le numéro seul s'il est unique. Les commandes qui modifient le rapport recalculent la synthèse et signalent les anomalies (point non ouvert resté dans le rapport principal). Pour une modification de constat, d'emplacement ou de titre, lire le bloc avec `bloc`, puis faire un `Read` ciblé (offset et limit) et un `Edit` : ne jamais relire ni réécrire le fichier entier pour traiter un seul point.

## Commandes Maven

Depuis la racine du back, avec le wrapper (`-o` hors ligne si le dépôt local est complet ; le retirer si une dépendance manque) :
- **Compilation et avertissements** : `./mvnw -B -o -q clean compile -Dmaven.compiler.showWarnings=true -Dmaven.compiler.showDeprecation=true 2>&1 | grep -E "^\[(WARNING|ERROR)\]" | head -30`
- **Tests** : `./mvnw -B -o test 2>&1 | grep -E "Tests run:|FAIL|BUILD|^\[ERROR\]" | tail -20`
- **Paquet** (si la configuration de build ou le `Dockerfile` change) : `./mvnw -B -o -q -DskipTests package 2>&1 | tail -20`

Les avertissements de la JVM (`sun.misc.Unsafe` appelé par Lombok, agent Byte Buddy chargé par Mockito) et les journaux `ERROR` émis volontairement par les tests ne sont pas des défauts du projet.

## Sections

**1. Analyse technique**
- **1.1 Compilation et analyse statique** : avertissements de `javac` (dépréciations, types bruts, `unchecked`), outils d'analyse absents ou mal configurés (Checkstyle, SpotBugs, formatage), `@SuppressWarnings` injustifiés.
- **1.2 Architecture et structure** : découpage en couches (`controller`, `service`, `mapper`, `persistence`), dépendances entre couches, entités exposées hors de la persistance, code mort, dépendances Maven inutiles.
- **1.3 Homogénéité** : nommage (classes, paquets, DTO `Request`/`Response`), fautes de frappe dans les identifiants, usage de Lombok et MapStruct, cohérence des patterns (injection, exceptions, `Optional`).
- **1.4 Qualité** : tests (couverture, cas limites, tests fragiles), gestion du `null`, transactions, immutabilité, configuration (`application.properties`, profils), build et déploiement (`pom.xml`, `Dockerfile`).

**2. Analyse fonctionnelle**
- **2.1 Bugs potentiels** : comportements incorrects ou fragiles (dates et fuseaux, décalages UTC, pagination, tri, concurrence, persistance, audit).
- **2.2 Contrat d'API** : routes, verbes et codes HTTP, validation des entrées, format des erreurs, pagination, sérialisation des dates et enums, cohérence avec ce qu'attend le front.
- **2.3 Sécurité et robustesse** : validation et limites des entrées, CORS, informations divulguées par les erreurs, journaux, console H2 ou endpoints exposés, utilisateur du conteneur.
- **2.4 Messages et wording** : `messages.properties`, messages d'erreur renvoyés au client, journaux, fautes, mélange de langues, termes incohérents.

Un point va dans une seule sous-section. Une sous-section sans point ouvert contient « Aucun point ouvert. » (le script s'en charge).

## Identifiants

`BACK-AAAAMMJJ-NN` : date de l'analyse qui a découvert le point, puis numéro d'ordre sur deux chiffres à partir de `01` (reprendre après le plus grand `NN` existant pour cette date, ouverts et clos compris). Un identifiant est définitif : jamais renuméroté, réutilisé ni modifié.

## Gravité

| Niveau | Quand l'utiliser |
|---|---|
| Critique | Perte ou corruption de données, faille exploitable, fonctionnalité principale cassée |
| Majeur | Bug probable, contrat d'API incohérent ou trompeur, erreur serveur sur une entrée utilisateur, action destructrice sans garde-fou |
| Mineur | Incohérence, dette technique, test manquant, wording |
| Info | Remarque ou suggestion sans défaut avéré |

Ordre dans une sous-section : gravité (Critique à Info), puis date de découverte croissante, puis identifiant.

## Format d'un point

```markdown
#### BACK-20261007-03 · Majeur · Requête de calcul sans validation de la date
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/metier/zoneOffsetFixed/controller/CalculateDateRequest.java:12`
- **Constat** : le champ `date` n'est pas contrôlé, une requête sans date atteint le service.
- **Impact** : `NullPointerException` traduite en erreur 500 au lieu d'une erreur 400 explicite.
- **Recommandation** : valider le champ avant l'appel au service et renvoyer un message de `messages.properties`.
```

Titre rédigé comme un constat, pas comme une action. Emplacement en `fichier:ligne`, chemin relatif à la racine du back. Recommandation concrète, avec extrait de code si utile. Références au code entre backticks. Aucun emoji, gravité en toutes lettres.

## Statuts et lignes d'historique

| Situation | Statut | Ligne ajoutée | Puis |
|---|---|---|---|
| Corrigé par une modification dédiée | `Corrigé le AAAA-MM-JJ` | `**Correction** : <changement, fichiers, tests>` | `clore` |
| Résolu par une évolution | `Corrigé le AAAA-MM-JJ` | `**Correction** : résolu par une évolution, sans correction dédiée : <ce qui a changé, fichiers ou commit>` | `clore` |
| Écarté | `Ignoré le AAAA-MM-JJ (faux positif \| choix technique \| hors périmètre)` | `**Justification** : <argument et preuve>` | `clore` |
| Requalifié, resté ouvert | inchangé | `**Révisé le AAAA-MM-JJ** : <ce qui a changé et pourquoi>` | `verif`, et `placer` si la gravité change |
| Rouvert | `Ouvert` | `**Rouvert le AAAA-MM-JJ** : <raison>` | `placer <ID> <sous-section>` |

`Ignoré` n'est posé que sur décision de l'utilisateur. Un point `Ignoré` n'est plus re-signalé, sauf si le contexte qui justifiait la décision a disparu.

## Point touché par une évolution du code

Reconnaître un point à sa **nature et sa localisation**, pas à son texte. Après une refonte, la nature prime. En cas de doute entre « même point » et « nouveau point », garder l'identifiant et l'expliquer dans `Révisé le …`.

- **Déplacé** (renommé, déplacé, refondu, problème identique) : même point, mettre à jour l'emplacement, `Révisé le … : déplacé de <ancien> vers <nouveau>`.
- **Partiellement résolu** : reste ouvert, réduire emplacement et constat à ce qui subsiste, `Révisé le …`.
- **Étendu** (même problème à d'autres endroits) : ajouter les emplacements, `Révisé le …`, pas de nouveau point.
- **Transformé** (problème d'origine disparu, problème de nature différente au même endroit) : fermer l'ancien comme résolu par une évolution, avec « remplacé par … ». Le nouveau problème reçoit un nouvel identifiant, qui renvoie à l'ancien (« fait suite à BACK-… »).
- **Gravité changée** : requalifier.

`git log --since=<date> -- <fichiers>` (ou sur le dossier parent si les fichiers ont disparu) aide à distinguer un problème qui n'a jamais existé d'un problème qu'une évolution a fait disparaître.

## Règles communes

- Ne modifier que les points concernés, sans régénérer le reste.
- Garder intacts l'identifiant et la date de découverte.
- « Historique des analyses » ne reçoit une ligne qu'à une analyse complète.
- Ne pas committer, sauf demande de l'utilisateur.
