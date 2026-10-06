# Conventions du rapport d'analyse front-end

Partagées par `analyse-frontend`, `correction-frontend` et `manuel-correction-frontend`.

## Fichiers

À la racine du front (dossier de `package.json`) :
- `rapport-analyse-frontend.md` : en-tête (projet, date, commit analysé), synthèse, points **ouverts** par sous-section, historique des analyses.
- `rapport-analyse-frontend-clos.md` : points corrigés ou ignorés, du plus récemment clos au plus ancien.

Le rapport est une liste de suivi dans la durée : un point garde son identifiant, sa date de découverte et ses lignes d'historique (`Correction`, `Justification`, `Révisé le …`, `Rouvert le …`, notes de l'utilisateur) pour toujours.

## Script

`node .claude/skills/analyse-frontend/scripts/rapport.mjs <commande>`, à lancer depuis la racine du front. Il évite de relire ou réécrire tout le rapport :

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

## Sections

**1. Analyse technique**
- **1.1 Linter** : résultat de `ng lint` sur le TypeScript, règles absentes ou désactivées utiles, `eslint-disable` injustifiés.
- **1.2 Structure du code** : découpage, lazy loading, séparation des responsabilités, code mort, dépendances inutiles.
- **1.3 Homogénéité** : nommage, fautes de frappe dans les identifiants, styles d'import, cohérence des patterns (signals ou RxJS, gestion d'erreur, désabonnement).
- **1.4 Qualité** : typage (`as unknown as`, `!`, `any`), tests, mutabilité, configuration de build et de déploiement.

**2. Analyse fonctionnelle**
- **2.1 Bugs potentiels** : comportements incorrects ou fragiles côté utilisateur (dates, pagination, navigation, erreurs, concurrence).
- **2.2 Analyse UX/UI** : parcours, retours visuels, cohérence, responsive.
- **2.3 Linter (templates et accessibilité)** : règles de templates et d'accessibilité, et manques non détectés (boutons icône sans `ariaLabel`, `lang`, labels).
- **2.4 Wording** : fautes, mélange de langues, termes incohérents, titres, messages d'erreur.

Un point va dans une seule sous-section. Une sous-section sans point ouvert contient « Aucun point ouvert. » (le script s'en charge).

## Identifiants

`FRONT-AAAAMMJJ-NN` : date de l'analyse qui a découvert le point, puis numéro d'ordre sur deux chiffres à partir de `01` (reprendre après le plus grand `NN` existant pour cette date, ouverts et clos compris). Un identifiant est définitif : jamais renuméroté, réutilisé ni modifié.

## Gravité

| Niveau | Quand l'utiliser |
|---|---|
| Critique | Perte de données, faille exploitable, fonctionnalité principale cassée |
| Majeur | Bug probable, typage qui masque un vrai problème, accessibilité bloquante, action destructrice sans garde-fou |
| Mineur | Incohérence, dette technique, UX perfectible, wording |
| Info | Remarque ou suggestion sans défaut avéré |

Ordre dans une sous-section : gravité (Critique à Info), puis date de découverte croissante, puis identifiant.

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

Titre rédigé comme un constat, pas comme une action. Emplacement en `fichier:ligne`. Recommandation concrète, avec extrait de code si utile. Références au code entre backticks. Aucun emoji, gravité en toutes lettres.

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
- **Transformé** (problème d'origine disparu, problème de nature différente au même endroit) : fermer l'ancien comme résolu par une évolution, avec « remplacé par … ». Le nouveau problème reçoit un nouvel identifiant, qui renvoie à l'ancien (« fait suite à FRONT-… »).
- **Gravité changée** : requalifier.

`git log --since=<date> -- <fichiers>` (ou sur le dossier parent si les fichiers ont disparu) aide à distinguer un problème qui n'a jamais existé d'un problème qu'une évolution a fait disparaître.

## Règles communes

- Ne modifier que les points concernés, sans régénérer le reste.
- Garder intacts l'identifiant et la date de découverte.
- « Historique des analyses » ne reçoit une ligne qu'à une analyse complète.
- Ne pas committer, sauf demande de l'utilisateur.
