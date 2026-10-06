# Rapport d'analyse front-end

> Projet : time-zone-frontend · Dernière analyse : 2026-10-07

## Synthèse

| Section | Critique | Majeur | Mineur | Info | Total ouverts |
|---|---|---|---|---|---|
| 1. Analyse technique | 0 | 0 | 3 | 4 | 7 |
| 2. Analyse fonctionnelle | 0 | 2 | 8 | 0 | 10 |
| **Total** | **0** | **2** | **11** | **4** | **17** |

**Outils** : lint OK (0 erreur) · tests 39/39 passés (8 fichiers) · build OK avec 1 avertissement (budget initial dépassé : 955,68 kB pour 500 kB)

**Depuis la dernière analyse** : 2 nouveaux (FRONT-20261007-01, -02), 2 corrigés par une évolution (FRONT-20261006-07, -08, résolus par l'introduction de Zod dans le commit `d115c04`), 0 rouvert. Les points FRONT-20261006-02 et FRONT-20261006-05, corrigés après la précédente analyse, sont confirmés absents du code.

## 1. Analyse technique

### 1.1 Linter

#### FRONT-20261006-01 · Info · Configuration ESLint sans règles basées sur les types
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `eslint.config.js:11-14`
- **Constat** : la configuration étend `tseslint.configs.recommended` et `stylistic`, qui n'analysent pas les types. Les assertions non nulles (`!`) passent donc sans alerte (`home.component.ts:124-125`, `timezone-edit.component.ts:72-73`). `ng lint` ne remonte aucune erreur.
- **Impact** : aucun défaut actuel, mais le linter ne détecterait pas le retour de contournements de typage comme ceux de FRONT-20261006-07 et FRONT-20261006-08 (aujourd'hui clos).
- **Révisé le** 2026-10-07 : les doubles casts `as unknown as` ont disparu avec l'introduction de Zod (commit `d115c04`). Il reste les assertions non nulles sur les valeurs de formulaire.
- **Recommandation** : passer à `tseslint.configs.recommendedTypeChecked` (avec `parserOptions.projectService: true`), ou au minimum activer `@typescript-eslint/no-non-null-assertion` en `warn`.

### 1.2 Structure du code

#### FRONT-20261006-03 · Mineur · Utilitaires de date rangés dans `service/` et appelés par un modèle
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/shared/service/date.function.ts`, `src/app/shared/model/audit.model.ts:2,4`, `src/app/shared/model/calculateDate.model.ts:3`
- **Constat** : `date.function.ts` contient des fonctions pures, pas un service injectable, mais il est rangé dans `service/`. De plus, `audit.model.ts` importe ce fichier pour son schéma `isoDate` : le modèle dépend de la couche service. Ce schéma générique `isoDate` est en outre déclaré dans `audit.model.ts` et réimporté par `calculateDate.model.ts`, alors qu'il ne concerne pas l'audit.
- **Impact** : la hiérarchie des dépendances est floue (modèle → service), et un utilitaire est difficile à trouver.
- **Recommandation** : déplacer `date.function.ts` vers `shared/util/date.util.ts`, et sortir `isoDate` dans un fichier de schémas communs (par exemple `shared/model/common.schema.ts`).
- **Révisé le** 2026-10-07 : `auditResponseTransform` a disparu avec l'introduction de Zod (commit `d115c04`) ; la conversion passe désormais par le schéma `isoDate`, qui hérite de la même dépendance vers `service/`. Constat et recommandation ajustés.

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

#### FRONT-20261007-02 · Info · Type `Page` déclaré à la main à côté du schéma `pageOf`
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/shared/model/page.model.ts:3-19`, `src/app/shared/service/timezone.service.ts:17`
- **Constat** : depuis l'introduction de Zod, les types de réponse sont dérivés des schémas (`z.infer`), sauf `Page<T>`, qui reste une interface écrite à la main et dupliquée par la fonction `pageOf`. Rien ne relie les deux : `getAllTimezones` annonce `Page<TimezoneResponse>` et la compilation passe uniquement parce que les deux structures coïncident.
- **Impact** : aucun défaut actuel, mais un champ ajouté ou renommé dans `pageOf` sans toucher l'interface (ou l'inverse) ne serait pas détecté.
- **Recommandation** : dériver le type du schéma, par exemple `export type Page<T> = { content: T[] } & Omit<z.infer<ReturnType<typeof pageOf>>, 'content'>`, ou typer le retour de `pageOf` avec `z.ZodMiniType<Page<z.output<T>>>` pour que le compilateur vérifie la correspondance.

### 1.4 Qualité

#### FRONT-20261006-09 · Mineur · Budget du bundle initial dépassé (PrimeFlex chargé en entier)
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `angular.json:31-35` (styles), `angular.json:41-45` (budgets)
- **Constat** : `ng build` affiche « bundle initial exceeded maximum budget » : 955,68 kB bruts pour 500 kB autorisés (939,66 kB à l'analyse précédente, l'ajout de Zod pèse environ 16 kB). La feuille `styles` pèse à elle seule 359 kB, car `primeflex.css` est importé en entier (446 kB) alors que l'application n'utilise qu'une vingtaine de classes (`flex`, `gap-2`, `m-2`, `p-2`, `w-full`, `text-center`…). Le transfert compressé reste raisonnable (156 kB).
- **Impact** : un avertissement permanent au build, qui finira par masquer un vrai dépassement. Le CSS chargé est surtout inutile.
- **Recommandation** : remplacer PrimeFlex par quelques classes utilitaires maison ou par Tailwind (avec purge, et qui est la recommandation actuelle de PrimeNG). À défaut, ajuster le budget en connaissance de cause.

#### FRONT-20261006-10 · Info · Couverture de tests incomplète
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/view/not-found/`, `src/app/view/administration/timezone/`
- **Constat** : 39 tests passent. `TimezoneEditComponent` et `TimezoneComponent` ne sont testés qu'à travers `timezone.routes.spec.ts`, ce qui est un bon choix. `NotFoundComponent` n'a aucun test et il n'y a pas de test e2e.
- **Impact** : faible pour l'instant. Le parcours complet (création puis calcul) n'est vérifié nulle part de bout en bout.
- **Recommandation** : ajouter un scénario Playwright couvrant la création de deux fuseaux, puis le calcul sur la page d'accueil.

## 2. Analyse fonctionnelle

### 2.1 Bugs potentiels

#### FRONT-20261006-12 · Mineur · Heures décalées pendant le passage à l'heure d'été du navigateur
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/shared/service/date.function.ts:1-15`, `src/app/shared/model/calculateDate.model.ts:6`, `src/app/view/home/home.component.ts:124`
- **Constat** : l'heure saisie et l'heure affichée passent par un `Date` exprimé dans le fuseau du *navigateur*. Si cette heure n'existe pas localement (changement d'heure), JavaScript la décale. Vérifié avec `TZ=Europe/Paris` : 2026-03-29 02:30 saisi devient `2026-03-29T03:30:00.000Z` à l'envoi. De même, un résultat `LocalDateTime` à 02:30 ce jour-là s'affiche 03:30.
- **Impact** : un calcul faux d'une heure, une heure par an, uniquement pour les utilisateurs dont le navigateur est dans un fuseau à heure d'été. Tahiti n'est pas concerné.
- **Recommandation** : ne pas passer par l'heure locale. Formater la saisie avec `formatDate(value, "yyyy-MM-dd'T'HH:mm:ss", 'fr')` et envoyer la chaîne obtenue. Afficher le résultat directement depuis la chaîne `LocalDateTime` reçue, ou avec `date:'…':'UTC'` après l'avoir parsée comme UTC.

#### FRONT-20261007-01 · Mineur · Échecs de validation Zod silencieux, y compris après une écriture réussie
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/shared/service/timezone.service.ts:22,27,32,37,46`, `src/app/shared/interceptor/http-error.interceptor.ts:8-20`, `src/app/view/administration/timezone/timezone-edit/timezone-edit.component.ts:80-85`, `src/app/view/administration/timezone/timezone.routes.ts:10-12`, `src/app/view/home/home.component.ts:68-70`
- **Constat** : le `parse` Zod est appliqué dans le service, après la chaîne HTTP. Une réponse non conforme lève une `$ZodError` que l'intercepteur ne voit pas (il ne traite que les `HttpErrorResponse` de la requête). Chaque appelant l'absorbe ensuite sans message : le formulaire de fuseau reste affiché sans retour (`catchError(() => EMPTY)`), le resolver redirige vers la page « Page introuvable », et le calcul n'affiche simplement aucun résultat. Aucune trace n'est laissée en console. Les contrats du back sont aujourd'hui conformes (enum `OffsetUTC`, `Instant` et `LocalDateTime` en ISO), le cas se produit donc en cas de dérive de contrat, par exemple un décalage ajouté côté back.
- **Impact** : sur une création ou une modification, le serveur a bien enregistré la donnée mais l'utilisateur reste sur le formulaire sans explication et risque de soumettre de nouveau, ce qui crée un doublon. Une erreur de contrat est par ailleurs difficile à diagnostiquer.
- **Recommandation** : traiter l'erreur de validation à un seul endroit, par exemple un opérateur commun dans le service qui journalise la `$ZodError` (`console.error`) et affiche un toast « Réponse inattendue du serveur. » via `MessageService` avant de la propager. Distinguer dans le resolver un 404 réel (`HttpErrorResponse` de statut 404) des autres erreurs.

### 2.2 Analyse UX/UI

#### FRONT-20261006-13 · Majeur · Suppression d'un fuseau sans confirmation
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/view/administration/administration.component.html:27`, `src/app/view/administration/administration.component.ts:52`
- **Constat** : un seul clic sur la corbeille supprime le fuseau immédiatement. Aucune confirmation ni annulation n'est proposée.
- **Impact** : une suppression accidentelle est irréversible. Le bouton est en plus placé juste à côté de « Voir ».
- **Recommandation** : utiliser `ConfirmationService` et `<p-confirmDialog />` de PrimeNG (« Supprimer le fuseau "Tahiti" ? »), puis afficher un toast de succès.

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

#### FRONT-20261006-17 · Majeur · Boutons réduits à une icône sans libellé accessible
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/shared/component/header/header.component.html:13`, `src/app/view/administration/administration.component.html:7,25,26,27`
- **Constat** : les boutons `pi-cog`, `pi-plus`, `pi-pencil`, `pi-eye` et `pi-trash` n'ont ni `ariaLabel` ni texte. La règle `templateAccessibility` ne contrôle pas les composants PrimeNG, ce qui explique que `ng lint` ne les signale pas.
- **Impact** : un lecteur d'écran annonce seulement « bouton », ce qui rend l'administration inutilisable sans la vue. L'absence d'infobulle gêne aussi les utilisateurs voyants.
- **Recommandation** : ajouter par exemple `ariaLabel="Supprimer {{result.label}}"` et `pTooltip`, et faire de même pour « Administration », « Ajouter », « Modifier » et « Voir ».

#### FRONT-20261006-18 · Mineur · Langue du document déclarée en anglais
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/index.html:2`
- **Constat** : `<html lang="en">` alors que l'interface est principalement en français.
- **Impact** : les lecteurs d'écran prononcent le texte avec une phonétique anglaise, et la traduction automatique du navigateur se déclenche à tort.
- **Recommandation** : `<html lang="fr">`, et enregistrer la locale `fr` (`registerLocaleData(localeFr)` et `LOCALE_ID`) pour les pipes de date.

### 2.4 Wording

#### FRONT-20261006-23 · Mineur · Typographie des libellés : deux-points sans espace et espace final
- **Statut** : Ouvert
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/view/home/home.component.html:44`, `src/app/view/administration/timezone/timezone.component.html:5`
- **Constat** : les résultats affichent `Tahiti: 06/10/2026 à 10:00`, avec un deux-points collé, à l'anglaise, alors que la page de consultation écrit correctement « Décalage UTC : ». Les formats de date `"dd/MM/yyyy 'à' HH:mm "` se terminent en outre par une espace superflue.
- **Impact** : typographie française incohérente d'une page à l'autre.
- **Recommandation** : écrire `{{data.timezone.label}} :` (idéalement avec une espace insécable `&nbsp;`) et retirer l'espace finale des formats de date.

## Points clos

#### FRONT-20261006-07 · Majeur · Typage incorrect de `OffsetUTC`
- **Statut** : Corrigé le 2026-10-07
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/shared/model/offsetUTC.model.ts:2`, `src/app/view/administration/timezone/timezone-edit/timezone-edit.component.ts:46`, `src/testing/timezone.fixture.ts:9`
- **Constat** : `OffsetUTC` est un enum numérique (valeurs 0 à 40). Pourtant, l'application manipule et envoie ses *noms* (`"UTC+01"`), comme le back qui attend un libellé (`OffsetUTC.getEnumForLabel`). Il faut `isNaN(Number(k))` pour extraire les options, et `as unknown as OffsetUTC` dans les tests.
- **Impact** : le type annoncé ne correspond pas à la valeur réelle. Une comparaison du type `offsetUTC === OffsetUTC["UTC+01"]` serait toujours fausse, sans erreur de compilation.
- **Recommandation** :
  ```ts
  export const OFFSETS_UTC = ['UTC', 'UTC+01', /* … */ 'UTC-12'] as const;
  export type OffsetUTC = typeof OFFSETS_UTC[number];
  ```
  Ensuite, `optionsOffsetUTC = [...OFFSETS_UTC]`, et les casts disparaissent des tests.
- **Correction** : résolu par une évolution, sans correction dédiée : le commit `d115c04` (ajout de Zod mini) remplace l'enum numérique par un schéma `z.enum([...])` de libellés et un type dérivé `z.infer` (`offsetUTC.model.ts:4-48`). Les options du select viennent de `OffsetUTC.options` (`timezone-edit.component.ts:46`) et le cast `as unknown as OffsetUTC` a disparu de `timezone.fixture.ts`. La liste correspond aux libellés de l'enum Java `OffsetUTC` du back (41 valeurs), et un test vérifie qu'un décalage inconnu est rejeté (`timezone.service.spec.ts:100-106`).

#### FRONT-20261006-08 · Mineur · Transformations de réponses par mutation et double cast
- **Statut** : Corrigé le 2026-10-07
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/app/shared/model/audit.model.ts:12-16`, `src/app/shared/service/timezone.service.ts:47-55`
- **Constat** : `auditResponseTransform` et `calculateDate` modifient directement l'objet reçu, et déclarent comme `Date` des champs qui arrivent en `string` (`as unknown as string`).
- **Impact** : le type est faux jusqu'à la transformation. Un appel qui oublie la transformation compile sans erreur et manipule des chaînes typées `Date`.
- **Recommandation** : typer la réponse brute (`interface AuditDto { createDate: string; … }`) et renvoyer un nouvel objet : `({...data, audit: {createDate: toDate(data.audit.createDate), …}})`.
- **Correction** : résolu par une évolution, sans correction dédiée : le commit `d115c04` (ajout de Zod mini) remplace `auditResponseTransform` et la transformation par mutation de `calculateDate` par des schémas Zod (`audit.model.ts`, `calculateDate.model.ts`, `timezone.model.ts`). Les réponses sont reçues en `unknown` puis validées et converties par `parse`, qui renvoie un nouvel objet ; les dates sont transformées par le schéma `isoDate`. Plus aucun `as unknown as` dans `src/`.

#### FRONT-20261006-02 · Mineur · Code mort et fichiers vides
- **Statut** : Corrigé le 2026-10-06
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `src/app/shared/service/date.function.ts:7`, `src/app/app.component.ts:14`, `src/app/app.component.scss`, `src/styles.scss`
- **Constat** : `toUTCDate` n'est utilisée que dans son test. `AppComponent.title` n'est lu nulle part. `app.component.scss` est vide et `styles.scss` ne contient que le commentaire généré par Angular CLI.
- **Impact** : du bruit à la lecture, et un test qui maintient une fonction inutilisée.
- **Recommandation** : supprimer `toUTCDate` et son test, ainsi que `title`. Supprimer `app.component.scss` et retirer `styleUrl` du composant.
- **Correction** : `toUTCDate` supprimée de `date.function.ts` avec son test dans `date.function.spec.ts` (`toDate` et `transformToUTCDate`, utilisée par `home.component.ts`, sont conservées). Propriété `title` et `styleUrl` retirés de `app.component.ts`, fichier `app.component.scss` supprimé. Commentaire généré retiré de `styles.scss`, conservé vide comme point d'entrée des styles globaux déclaré dans `angular.json`. Lint OK, tests 38/38 (un test supprimé), build OK (avertissement de budget préexistant, suivi par un autre point).

#### FRONT-20261006-05 · Mineur · Fautes de frappe dans les identifiants
- **Statut** : Corrigé le 2026-10-06
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `src/app/shared/model/calculateDate.model.ts:11`, `src/app/shared/service/timezone.service.ts:7,47`, `src/app/view/home/home.component.ts:13,66`
- **Constat** : `CaculateDateItemResponse`, `CaculateDateResponse`, `CaculateDateResquest`, `AutitableResponse`, `reponse`.
- **Impact** : les recherches dans le code échouent, et la relecture laisse une impression de négligence.
- **Recommandation** : renommer en `CalculateDateItemResponse`, `CalculateDateResponse`, `CalculateDateRequest`, `AuditableResponse` et `response` (renommage via l'IDE).
- **Rouvert le** 2026-10-06 : constat toujours présent dans le code. Le commit `06b3aa9` corrige `Caculate…`, `AutitableResponse` et `reponse`, mais `CaculateDateResquest` est devenu `CalculateDateResquest` : la faute « Resquest » subsiste (5 occurrences). Il reste à renommer en `CalculateDateRequest`, comme la classe du back (`CalculateDateRequest.java`).
- **Correction** : `CalculateDateResquest` renommé en `CalculateDateRequest`, comme la classe du back, dans `calculateDate.model.ts` (déclaration), `timezone.service.ts` (import et paramètre de `calculateDate`) et `home.component.ts` (import et `Subject`). Les autres fautes avaient été corrigées par le commit `06b3aa9`. Plus aucune occurrence de `Resquest`, `Caculate`, `Autitable` ni `reponse` dans `src/`. Interface de type uniquement, sans effet sur la requête envoyée. Aucun test ajouté, la compilation suffit à vérifier le renommage. Lint OK, tests 39/39.

#### FRONT-20261006-20 · Mineur · Terminologie « timezone » et « fuseau horaire » incohérente
- **Statut** : Corrigé le 2026-10-06
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `src/app/view/administration/administration.component.html:19`, `src/app/view/administration/timezone/timezone-edit/timezone-edit.component.html:5,10,15`
- **Constat** : « Pas de timezone configurée », « Modification de la timezone », « Création timezone » et le label de champ « Label » côtoient « Fuseau horaire » et « Ajouter un fuseau horaire ». Le champ intitulé « Fuseau horaire » sert en réalité à choisir un décalage UTC.
- **Impact** : le vocabulaire est incohérent, et il y a une ambiguïté entre le fuseau (l'entité) et le décalage (sa propriété).
- **Recommandation** : utiliser « fuseau horaire » partout. Renommer les champs « Nom » et « Décalage UTC », et le titre en « Nouveau fuseau horaire ».
- **Correction** : « fuseau horaire » est employé partout. Dans `administration.component.html`, « Aucun fuseau horaire configuré. ». Dans `timezone-edit.component.html`, les titres deviennent « Modification du fuseau horaire "…" » et « Nouveau fuseau horaire », et les champs « Nom » et « Décalage UTC ». Les textes attendus sont mis à jour dans `timezone.routes.spec.ts` et `administration.component.spec.ts`. Hors périmètre (back) : les messages de validation de `messages.properties` citent le nom technique du champ (`label`, `offsetUTC`). Lint OK, tests 39/39.

#### FRONT-20261006-19 · Mineur · Mélange d'anglais et de français dans l'interface
- **Statut** : Corrigé le 2026-10-06
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `src/index.html:5`, `src/app/shared/component/header/header.component.html:9`, `src/app/view/administration/administration.component.html:4`, `src/app/view/administration/timezone/timezone.component.html:6`
- **Constat** : « TimeZoneFrontend » (titre de l'onglet), « Timezone project », « Timezone configuration » et « Offset: » côtoient des textes en français.
- **Impact** : une interface qui paraît inachevée.
- **Recommandation** : « Fuseaux horaires » pour l'onglet et le header, « Configuration des fuseaux horaires », « Décalage UTC : ».
- **Correction** : textes traduits en français : titre de l'onglet et `h1` du header « Fuseaux horaires » (`index.html`, `header.component.html`), titre de l'administration « Configuration des fuseaux horaires » (`administration.component.html`) et « Décalage UTC : » sur la consultation (`timezone.component.html`). Les textes attendus sont mis à jour dans `app.component.spec.ts`, `header.component.spec.ts` et `timezone.routes.spec.ts`. Restent hors périmètre : « Label » et l'emploi de « timezone » (FRONT-20261006-20), et `lang="en"` (FRONT-20261006-18). Lint OK, tests 39/39.

#### FRONT-20261006-16 · Mineur · Le pipe `titlecase` modifie les libellés saisis
- **Statut** : Corrigé le 2026-10-06
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `src/app/view/home/home.component.html:44`
- **Constat** : les résultats affichent `data.timezone.label | titlecase`, alors que le libellé est affiché tel quel partout ailleurs (liste, consultation, select). « la Réunion » devient « La Réunion » et « USA – EST » devient « Usa – Est ».
- **Impact** : un même fuseau est présenté différemment d'une page à l'autre, et les sigles sont abîmés.
- **Recommandation** : retirer `titlecase` et afficher le libellé tel que l'administrateur l'a saisi.
- **Correction** : le pipe `titlecase` est retiré des résultats de l'accueil, et le libellé est affiché tel que saisi, comme sur les autres pages (`home.component.html`). L'import `TitleCasePipe` est supprimé de `home.component.ts`. Le test `home.component.spec.ts` attend désormais `tahiti: …` et `paris: …` pour des fuseaux saisis en minuscules : il garantit que le libellé n'est plus transformé. Lint OK, tests 39/39.

#### FRONT-20261006-11 · Info · README générique d'Angular CLI
- **Statut** : Corrigé le 2026-10-06
- **Découvert le** : 2026-10-06 · **Dernière vérification** : 2026-10-06
- **Emplacement** : `README.md`
- **Constat** : le README décrit `ng serve` et `ng generate`, mais ne dit rien du proxy `/api` vers `localhost:7373`, de l'image Docker, de la configuration nginx (`/etc/nginx/extra/*.conf`) ni du rôle de l'application.
- **Impact** : une prise en main plus lente pour un nouveau développeur ou un relecteur.
- **Recommandation** : ajouter une section « Démarrage » (back requis sur le port 7373, `npm start`) et une section « Docker » (build, montage de `api_redirection-local.conf`).
- **Correction** : `README.md` réécrit en français. Il décrit le rôle de l'application et la stack, les prérequis (back sur le port 7373), le démarrage avec `npm start` (en prévenant que `ng serve` seul n'active pas le proxy `/api`), les commandes, l'image Docker et la configuration nginx (montage obligatoire de `api_redirection-local.conf` dans `/etc/nginx/extra/`, `docker-compose.yml` à la racine), ainsi que la structure du code. La section Claude Code est conservée, et les sections génériques d'Angular CLI sont supprimées. Aucun code source n'a été modifié. La commande de test documentée a été vérifiée (39/39).

## Historique des analyses

| Date | Nouveaux | Corrigés | Rouverts | Ouverts au total | Lint | Tests |
|---|---|---|---|---|---|---|
| 2026-10-07 | 2 | 2 | 0 | 17 | OK | 39/39 |
| 2026-10-06 (2e analyse) | 3 | 4 | 1 | 19 | OK | 39/39 |
| 2026-10-06 | 20 | 0 | 0 | 20 | OK | 39/39 |
