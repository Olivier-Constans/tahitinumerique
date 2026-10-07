# Rapport d'analyse back-end

> Projet : time-zone · Dernière analyse : 2026-10-07 · Commit analysé : 97ad319

## Synthèse

> Points clos : voir `rapport-analyse-backend-clos.md`.

| Section | Critique | Majeur | Mineur | Info | Total ouverts |
|---|---|---|---|---|---|
| 1. Analyse technique | 0 | 0 | 3 | 3 | 6 |
| 2. Analyse fonctionnelle | 0 | 1 | 5 | 3 | 9 |
| **Total** | **0** | **1** | **8** | **6** | **15** |

**Outils** : compilation OK, 0 avertissement · tests 41/41 passés · paquet OK (jar démarré et `GET /api/timezones` répond 200)

**Depuis la dernière analyse** : 15 nouveaux, 0 corrigé, 0 rouvert (première analyse).

## 1. Analyse technique

### 1.1 Compilation et analyse statique

#### BACK-20261007-10 · Mineur · Aucun outil de formatage et indentation mixte tabulations/espaces
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `pom.xml:59` ; `src/main/java/tahiti/numerique/time_zone/persistence/audit/AuditListener.java:12` ; `src/main/java/tahiti/numerique/time_zone/persistence/audit/Audit.java:12` ; `src/main/java/tahiti/numerique/time_zone/persistence/audit/Auditable.java:4` ; `src/main/java/tahiti/numerique/time_zone/TimeZoneApplication.java:12` ; `src/test/java/tahiti/numerique/time_zone/TimeZoneApplicationTests.java:9`
- **Constat** : le build ne déclare ni formateur (Spotless, `.editorconfig`) ni analyse statique (Checkstyle, SpotBugs, PMD). Cinq fichiers sont indentés à la tabulation alors que le reste du projet utilise quatre espaces, et `AuditListener` mélange les deux dans la même classe. Le front, lui, dispose de Prettier depuis le commit 127d108.
- **Impact** : diffs bruités, style qui dérive au fil des contributions, aucune détection automatique des erreurs courantes.
- **Recommandation** : ajouter `spotless-maven-plugin` (google-java-format ou palantir, ou Eclipse avec un fichier de config) avec `spotless:check` lié à la phase `verify`, plus un `.editorconfig` partagé avec le front ; reformater une fois le projet dans un commit dédié.

### 1.2 Architecture et structure

#### BACK-20261007-11 · Mineur · Le service dépend des DTO de la couche controller
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/metier/timezone/service/TimezoneService.java:10`
- **Constat** : `TimezoneService` importe `controller.TimezoneRequest` et `controller.CalculateDateRequest` et s'en sert pour la validation (`TimezoneRequest.Fields.label`, etc.). La dépendance va du service vers le controller, à l'inverse du découpage en couches, et les noms des champs JSON servent de noms de champs dans les messages métier.
- **Impact** : renommer un champ de l'API change le service et les messages d'erreur ; le service ne peut pas être réutilisé sans la couche web.
- **Recommandation** : soit déplacer les objets de requête dans un paquet neutre (`metier.timezone.model` ou `service.command`), soit faire mapper la requête en objet métier par le controller avant l'appel au service. Garder les messages de validation indépendants des noms techniques (voir BACK-20261007-08).

### 1.3 Homogénéité

#### BACK-20261007-12 · Info · Styles de DTO hétérogènes (record et classes Lombok mutables)
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/core/controller/PageResponse.java:11` ; `src/main/java/tahiti/numerique/time_zone/core/controller/ErrorMessageResponse.java:7` ; `src/main/java/tahiti/numerique/time_zone/metier/timezone/controller/TimezoneResponse.java:8` ; `src/main/java/tahiti/numerique/time_zone/metier/timezone/controller/CalculateDateResponse.java:10`
- **Constat** : `PageResponse` est un `record` immuable, les autres réponses sont des classes Lombok `@Getter @Setter` mutables, avec ou sans `@NoArgsConstructor`.
- **Impact** : aucun défaut, mais deux conventions pour le même rôle.
- **Recommandation** : choisir une convention (les `record` sont pris en charge par Jackson et MapStruct 1.6) et l'appliquer aux nouveaux DTO, puis aux existants à l'occasion.

#### BACK-20261007-13 · Info · `BusinessException` et `NotFoundException` dupliquent le même code
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/core/exception/BusinessException.java:6` ; `src/main/java/tahiti/numerique/time_zone/core/exception/NotFoundException.java:8`
- **Constat** : les deux classes ont le même champ `messageExceptionInfo`, le même constructeur `(String code, Object[] args)` et implémentent la même interface ; seule la traduction en statut HTTP les distingue dans `RestExceptionHandler`, qui répète aussi deux handlers identiques au statut près.
- **Impact** : toute évolution (ajout d'un champ, d'un code) est à faire en double.
- **Recommandation** : une classe abstraite `MessageException extends RuntimeException` portant `messageExceptionInfo` et `generateMessage`, dont héritent les deux exceptions ; un seul handler qui lit le statut (par exemple via `@ResponseStatus` ou une méthode `getStatus()`).

#### BACK-20261007-14 · Info · Clés de `messages.properties` nommées de façon hétérogène
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/resources/messages.properties:4` ; `src/main/java/tahiti/numerique/time_zone/core/validator/MessageCode.java:8`
- **Constat** : les clés mélangent camelCase (`generic.form.maxLength`, `generic.notFound`) et kebab-case (`generic.form.reference.not-exist`), et la ligne 5 (`generic.notFound=`) n'a pas d'espace avant le `=` contrairement aux autres. `MessageCode` déclare ses constantes en `public final static` au lieu de l'ordre usuel `public static final`.
- **Impact** : cosmétique.
- **Recommandation** : uniformiser en camelCase (`generic.form.referenceNotExist`) en mettant à jour `MessageCode` dans le même commit.

### 1.4 Qualité

#### BACK-20261007-15 · Mineur · Pas de test d'API de bout en bout pour le CRUD, le calcul et l'audit
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/test/java/tahiti/numerique/time_zone/metier/timezone/controller/TimezoneApiTest.java:18` ; `src/test/java/tahiti/numerique/time_zone/metier/timezone/service/TimezoneServiceTest.java:45`
- **Constat** : `TimezoneApiTest`, seul test sur la pile complète (H2), ne couvre que le tri. Rien ne vérifie de bout en bout la création puis la lecture, le calcul `POST /timezones/calculate-date` avec le format de date réellement envoyé par le front (`...T10:00:00.000Z`, voir BACK-20261007-06), ni `AuditListener` (injection du `Clock` par constructeur dans un listener JPA, mise à jour de `updateDate` au `@PreUpdate`). `TimezoneServiceTest` appelle `MockitoAnnotations.openMocks(this)` sans fermer le `AutoCloseable` retourné.
- **Impact** : une régression de sérialisation des dates, de l'audit ou de la configuration JPA passerait les tests unitaires (tout est mocké).
- **Recommandation** : ajouter dans `TimezoneApiTest` un scénario création, lecture, modification (vérifier que `updateDate` change et pas `createDate`), calcul avec une date suffixée `Z`, suppression ; remplacer `openMocks` par `@ExtendWith(MockitoExtension.class)`.

## 2. Analyse fonctionnelle

### 2.1 Bugs potentiels

#### BACK-20261007-03 · Mineur · Ordre non déterministe de la liste paginée et des résultats du calcul
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/metier/timezone/controller/TimezoneController.java:25` ; `src/main/java/tahiti/numerique/time_zone/persistence/timezone/TimezoneRepository.java:9`
- **Constat** : `@PageableDefault` ne fixe aucun tri et le front n'envoie pas de paramètre `sort` (`time-zone-frontend/src/app/shared/service/timezone.service.ts:19`). `findAllByIdNot` n'est pas trié non plus. Sans `ORDER BY`, l'ordre des lignes n'est pas garanti par SQL ; H2 renvoie en pratique l'ordre de la clé primaire, mais ce n'est qu'un effet de l'implémentation.
- **Impact** : avec une autre base ou un plan d'exécution différent, le chargement page par page de la liste déroulante (défilement infini de l'accueil) peut répéter ou sauter des fuseaux, et les résultats du calcul s'affichent dans un ordre arbitraire.
- **Recommandation** : `@PageableDefault(sort = "label")` (ou `sort = "id"`), avec un critère secondaire `id` pour départager les libellés égaux ; `List<Timezone> findAllByIdNotOrderByLabelAscIdAsc(Long id)` pour le calcul.

#### BACK-20261007-04 · Mineur · Libellé enregistré sans normalisation et doublons acceptés
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/metier/timezone/service/TimezoneService.java:47`
- **Constat** : vérifié par un test sur la pile complète : `POST /timezones` avec `"label":"  Tahiti  "` renvoie 201 et enregistre `"  Tahiti  "` avec ses espaces, alors qu'un fuseau `Tahiti` existe déjà. La longueur maximale est aussi contrôlée sur la valeur non nettoyée.
- **Impact** : deux entrées visuellement identiques dans la liste et dans les résultats du calcul, impossibles à distinguer pour l'utilisateur ; tri alphabétique faussé par les espaces initiaux.
- **Recommandation** : appliquer `strip()` au libellé avant validation et enregistrement ; si l'unicité est souhaitée, contrainte `@Column(unique = true)` doublée d'un contrôle `existsByLabelIgnoreCaseAndIdNot` qui renvoie un message `generic.form.alreadyExists` (400 ou 409).

#### BACK-20261007-05 · Info · Pas de verrouillage optimiste sur `Timezone`
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/persistence/timezone/Timezone.java:24`
- **Constat** : l'entité n'a pas de champ `@Version` et `PUT /timezones/{id}` écrase la ligne sans vérifier qu'elle n'a pas changé depuis sa lecture par le client.
- **Impact** : deux modifications concurrentes d'un même fuseau : la dernière gagne silencieusement. Faible enjeu pour une application mono-utilisateur.
- **Recommandation** : si l'application devient multi-utilisateur, ajouter `@Version private Long version;`, l'exposer dans `TimezoneResponse` et le renvoyer dans `TimezoneRequest`, et traduire `ObjectOptimisticLockingFailureException` en 409.

### 2.2 Contrat d'API

#### BACK-20261007-06 · Mineur · Date du calcul transmise comme un instant UTC mais lue comme une heure locale
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/metier/timezone/controller/CalculateDateRequest.java:16` ; `src/main/java/tahiti/numerique/time_zone/metier/timezone/controller/CalculateDateResponse.java:21`
- **Constat** : le champ `date` est un `LocalDateTime` (heure murale du fuseau choisi). Le front (`transformToUTCDate`, `time-zone-frontend/src/app/shared/util/date.util.ts:8`) recopie l'heure saisie dans un `Date` UTC et l'envoie sérialisé `"2026-10-07T10:00:00.000Z"`. Vérifié par un test : Jackson accepte le suffixe `Z` et l'ignore (calcul correct, Tahiti 10:00 donne Paris 22:00), mais rejette `"2026-10-07T10:00:00+05:00"` avec un 400. En réponse, les dates sont renvoyées sans décalage (`"2026-10-07T22:00:00"`) et le front les relit comme heure locale du navigateur.
- **Impact** : le contrat fonctionne par un double détournement implicite : un `Z` qui ne signifie pas UTC, toléré par une permissivité de Jackson. Un autre client de l'API (ou un changement de configuration Jackson) peut mal interpréter la date ; rien ne documente le format attendu.
- **Recommandation** : documenter que `date` est une heure locale sans décalage et faire envoyer par le front `"yyyy-MM-ddTHH:mm:ss"` sans `Z` (formatage local plutôt que `toISOString`) ; côté back, éventuellement `@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm[:ss]")` pour rendre le format explicite. Ajouter le test d'API correspondant (BACK-20261007-15).

#### BACK-20261007-07 · Info · Liste des décalages UTC dupliquée dans le front
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/persistence/OffsetUTC.java:11`
- **Constat** : aucune route n'expose les valeurs de `OffsetUTC` ; le front en recopie les 41 libellés (`time-zone-frontend/src/app/shared/model/offsetUTC.model.ts:4`). Les deux listes sont identiques aujourd'hui.
- **Impact** : ajouter un décalage côté back sans mettre à jour le front fait échouer la validation Zod des réponses (« Réponse inattendue du serveur ») pour tout fuseau utilisant ce décalage.
- **Recommandation** : exposer `GET /timezones/offsets` renvoyant la liste ordonnée des libellés et la consommer dans le formulaire, ou au minimum ajouter un test (back ou front) qui compare les deux listes.

### 2.3 Sécurité et robustesse

#### BACK-20261007-01 · Majeur · Un paramètre de tri contenant un caractère non alphanumérique provoque une erreur 500
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/core/exception/RestExceptionHandler.java:48`
- **Constat** : seule `PropertyReferenceException` est traduite en 400. Vérifié par un test sur la pile complète : `GET /timezones?sort=foo` renvoie bien 400, mais `sort=foo bar`, `sort=label;x`, `sort=lab(el)` ou `sort=foo%0AX` ne passent pas par cette exception : Hibernate lève `InvalidDataAccessApiUsageException` (« Sort expression ... must only contain property references »), qui tombe dans le handler générique et renvoie 500, avec une trace complète journalisée en `ERROR`. Avec un retour à la ligne, la valeur injectée apparaît telle quelle sur une nouvelle ligne du journal.
- **Impact** : erreur serveur sur une simple entrée utilisateur, journaux d'erreur pollués à volonté par n'importe quel appelant, et possibilité de forger de fausses lignes de journal.
- **Recommandation** : valider les propriétés de tri avant la requête, par exemple une liste blanche dans le controller :
  ```java
  private static final Set<String> SORTABLE = Set.of(Timezone.Fields.id, Timezone.Fields.label, Timezone.Fields.offsetUTC);
  // pour chaque order de pageable.getSort() : ObjectValidator.valid(SORTABLE.contains(order.getProperty()), "sort");
  ```
  ou, à défaut, traduire aussi `InvalidDataAccessApiUsageException` en 400 dans `RestExceptionHandler`. Ajouter les cas `foo bar` et `foo%0AX` à `TimezoneApiTest`.

#### BACK-20261007-02 · Mineur · Journaux alimentés par des valeurs brutes de la requête
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/core/exception/RestExceptionHandler.java:50` ; `src/main/java/tahiti/numerique/time_zone/core/exception/RestExceptionHandler.java:79`
- **Constat** : les avertissements écrivent `ex.getMessage()`, qui reprend la valeur envoyée par le client (chaîne de date invalide dans l'erreur de parsing JSON, nom de propriété de tri, URL). La configuration Logback par défaut ne neutralise pas les retours à la ligne.
- **Impact** : un client peut insérer des retours à la ligne et de fausses entrées dans les journaux (le cas 500 est traité par BACK-20261007-01), et des valeurs arbitrairement longues.
- **Recommandation** : journaliser le type d'exception et une valeur nettoyée (`message.replaceAll("[\\r\\n]", "_")`, tronquée), ou configurer un encodeur qui échappe les caractères de contrôle (`%replace(%msg){'[\r\n]','_'}` dans le motif Logback).

### 2.4 Messages et wording

#### BACK-20261007-08 · Mineur · Messages d'erreur affichés à l'utilisateur avec des identifiants techniques en anglais
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/metier/timezone/service/TimezoneService.java:34` ; `src/main/java/tahiti/numerique/time_zone/metier/timezone/service/TimezoneService.java:47` ; `src/main/java/tahiti/numerique/time_zone/metier/timezone/service/TimezoneService.java:69` ; `src/main/resources/messages.properties:4`
- **Constat** : vérifié sur la pile complète, l'API renvoie « L'objet timezone d'id '999' n'a pas été trouvé. », « Le champ 'offsetUTC' est obligatoire. », « La référence de l'objet 'timezoneId' n'a pas été trouvée. ». Le front affiche ces messages tels quels dans un toast (`time-zone-frontend/src/app/shared/interceptor/http-error.interceptor.ts:28`).
- **Impact** : l'utilisateur voit des noms de champs Java et un mélange de français et d'anglais (« timezone », « offsetUTC », « timezoneId ») au lieu de « fuseau horaire », « décalage UTC ».
- **Recommandation** : passer des libellés métier aux messages, par exemple via des clés `field.timezone.label = libellé`, `field.timezone.offsetUTC = décalage UTC`, `entity.timezone = Le fuseau horaire` résolues par le `MessageSource`, ou des messages dédiés (`timezone.notFound = Le fuseau horaire n''existe pas ou a été supprimé.`).

#### BACK-20261007-09 · Info · Message générique pour toutes les erreurs de format, de méthode et de type de contenu
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/core/exception/RestExceptionHandler.java:68`
- **Constat** : une date au mauvais format, un `timezoneId` non numérique, une méthode non supportée (405) ou un `Content-Type` non JSON (415) renvoient tous « La requête est invalide. ».
- **Impact** : un appelant de l'API ne sait pas quel champ corriger ; le front contrôle ses saisies, donc l'utilisateur final est peu exposé.
- **Recommandation** : pour `HttpMessageNotReadableException` dont la cause est une `MismatchedInputException`, extraire le chemin du champ (`getPath()`) et renvoyer `generic.form.invalid` avec ce champ ; garder le message générique pour les autres cas.

## Historique des analyses

| Date | Nouveaux | Corrigés | Rouverts | Ouverts au total | Compilation | Tests |
|---|---|---|---|---|---|---|
| 2026-10-07 | 15 | 0 | 0 | 15 | OK, 0 avertissement | 41/41 |
