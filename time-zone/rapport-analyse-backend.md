# Rapport d'analyse back-end

> Projet : time-zone · Dernière analyse : 2026-10-07 · Commit analysé : 0767ab0

## Synthèse

> Points clos : voir `rapport-analyse-backend-clos.md`.

| Section | Critique | Majeur | Mineur | Info | Total ouverts |
|---|---|---|---|---|---|
| 1. Analyse technique | 0 | 0 | 3 | 4 | 7 |
| 2. Analyse fonctionnelle | 0 | 1 | 6 | 3 | 10 |
| **Total** | **0** | **1** | **9** | **7** | **17** |

**Outils** : compilation OK, 0 avertissement · tests 70/70 passés · paquet OK (`target/time-zone.jar` construit, non démarré)

**Depuis la dernière analyse** : 3 nouveaux, 1 corrigé, 0 rouvert. Évolution analysée : remplacement de `Timezone` par `Place` (décalage fixe ou zone IANA), requêtes polymorphes, stratégies `PlaceHandler`, suppression de l'enum `OffsetUTC`.

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
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/metier/place/service/PlaceService.java:10` ; `src/main/java/tahiti/numerique/time_zone/metier/place/service/handler/PlaceHandler.java:3` ; `src/main/java/tahiti/numerique/time_zone/metier/place/service/handler/PlaceHandlerRegistry.java:6` ; `src/main/java/tahiti/numerique/time_zone/metier/place/service/handler/ZoneOffsetFixedPlaceHandler.java:6` ; `src/main/java/tahiti/numerique/time_zone/metier/place/service/handler/ZoneIdPlaceHandler.java:6`
- **Constat** : `PlaceService` importe `controller.PlaceRequest` et `controller.CalculateDateRequest` et s'en sert pour la validation (`PlaceRequest.Fields.label`, `CalculateDateRequest.Fields.placeId`). Les stratégies sont typées sur les requêtes du controller (`PlaceHandler<R extends PlaceRequest, …>`), et `PlaceHandlerRegistry` s'appuie sur la hiérarchie `sealed` de `PlaceRequest` pour sa vérification au démarrage. La dépendance va du service vers le controller, à l'inverse du découpage en couches, et les noms des champs JSON servent de noms de champs dans les messages métier.
- **Impact** : renommer un champ de l'API change le service, les stratégies et les messages d'erreur ; le service ne peut pas être réutilisé sans la couche web.
- **Recommandation** : déplacer les requêtes (`PlaceRequest` et ses sous-classes, `CalculateDateRequest`) dans un paquet neutre partagé par le controller et le service (`metier.place.dto`), ce qui ne change ni le JSON ni les stratégies ; ou faire mapper la requête en objet métier par le controller avant l'appel au service. Garder les messages de validation indépendants des noms techniques (voir BACK-20261007-08).
- **Révisé le 2026-10-07** : déplacé de `metier/timezone/service/TimezoneService.java` vers `metier/place/service/PlaceService.java` ; étendu aux stratégies `PlaceHandler`, typées sur les requêtes du controller.

### 1.3 Homogénéité

#### BACK-20261007-12 · Info · Styles de DTO hétérogènes (record et classes Lombok mutables)
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/core/controller/PageResponse.java:11` ; `src/main/java/tahiti/numerique/time_zone/core/controller/ErrorMessageResponse.java:7` ; `src/main/java/tahiti/numerique/time_zone/metier/place/controller/PlaceResponse.java:9` ; `src/main/java/tahiti/numerique/time_zone/metier/place/controller/CalculateDateResponse.java:13`
- **Constat** : `PageResponse` est un `record` immuable, les autres réponses sont des classes Lombok `@Getter @Setter` mutables, avec ou sans `@NoArgsConstructor`.
- **Impact** : aucun défaut, mais deux conventions pour le même rôle.
- **Recommandation** : choisir une convention (les `record` sont pris en charge par Jackson et MapStruct 1.6) et l'appliquer aux nouveaux DTO, puis aux existants à l'occasion. Les réponses polymorphes (`PlaceResponse` abstraite et ses sous-classes) restent plus simples en classes, ce qui peut justifier de garder cette convention.
- **Révisé le 2026-10-07** : déplacé de `TimezoneResponse` vers `PlaceResponse` et ses sous-classes `ZoneOffsetFixedPlaceResponse` et `ZoneIdPlaceResponse`.

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

#### BACK-20261007-15 · Mineur · Tests d'API sans vérification de l'audit ni du format de date envoyé par le front
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/test/java/tahiti/numerique/time_zone/metier/place/controller/PlaceApiTest.java:39` ; `src/test/java/tahiti/numerique/time_zone/metier/place/controller/PlaceApiTest.java:90` ; `src/test/java/tahiti/numerique/time_zone/metier/place/service/PlaceServiceTest.java:53`
- **Constat** : `PlaceApiTest` couvre maintenant sur la pile complète la création, la lecture, la modification avec changement de type (aller et retour), la suppression et le calcul entre un décalage fixe et une zone IANA. Il reste non couvert : la mise à jour de `updateDate` au `@PreUpdate` (seule la conservation de `createDate` est vérifiée), le calcul avec une date suffixée `Z` telle que l'envoie le front (voir BACK-20261007-06). `PlaceServiceTest` appelle toujours `MockitoAnnotations.openMocks(this)` sans fermer le `AutoCloseable` retourné.
- **Impact** : une régression de l'audit (`Clock` injecté dans le listener JPA) ou de la désérialisation de la date du front passerait les tests.
- **Recommandation** : dans `testCrudAndTypeChange`, vérifier que `audit.updateDate` est postérieure à sa valeur initiale après le `PUT` ; dans `testCalculateDateBetweenImplementations`, envoyer `"2026-07-01T12:00:00.000Z"` ; remplacer `openMocks` par `@ExtendWith(MockitoExtension.class)`.
- **Révisé le 2026-10-07** : partiellement résolu par l'évolution vers `Place` : `PlaceApiTest` couvre le CRUD, le changement de type et le calcul. Titre, emplacement et constat réduits à ce qui subsiste.

#### BACK-20261007-18 · Info · Liste des décalages acceptés calculée au chargement de la classe, hors du `Clock`
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/metier/place/service/handler/ZoneOffsetFixedPlaceHandler.java:28`
- **Constat** : `ZONE_OFFSETS` est une constante statique calculée avec `Instant.now()` au chargement de la classe : les décalages en vigueur dans au moins une zone IANA, à cet instant et dans l'année qui suit. Le bean `Clock` de l'application, qui sert à l'audit, n'est pas utilisé, et la liste ne change plus jusqu'au redémarrage.
- **Impact** : la liste n'est pas reproductible en test (elle dépend de la date d'exécution et de la base IANA de la JVM) ; sur une instance qui tourne longtemps, un décalage abandonné reste accepté et un nouveau décalage est refusé jusqu'au redémarrage. Faible enjeu : les changements de décalage sont rares.
- **Recommandation** : calculer la liste dans le bean à partir du `Clock` injecté (à l'initialisation, ou avec un cache rafraîchi chaque jour), et garder `realZoneOffsets(Instant)` pour les tests.

## 2. Analyse fonctionnelle

### 2.1 Bugs potentiels

#### BACK-20261007-03 · Mineur · Ordre non déterministe de la liste paginée et des résultats du calcul
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/metier/place/controller/PlaceController.java:28` ; `src/main/java/tahiti/numerique/time_zone/persistence/place/PlaceRepository.java:14`
- **Constat** : `@PageableDefault` ne fixe aucun tri et le front n'envoie pas de paramètre `sort` (`time-zone-frontend/src/app/shared/service/place.service.ts:18`). `findAllByIdNot` n'est pas trié non plus. Sans `ORDER BY`, l'ordre des lignes n'est pas garanti par SQL ; H2 renvoie en pratique l'ordre de la clé primaire, mais ce n'est qu'un effet de l'implémentation.
- **Impact** : avec une autre base ou un plan d'exécution différent, le chargement page par page de la liste déroulante (défilement infini de l'accueil) peut répéter ou sauter des lieux, et les résultats du calcul s'affichent dans un ordre arbitraire.
- **Recommandation** : `@PageableDefault(sort = "label")` (ou `sort = "id"`), avec un critère secondaire `id` pour départager les libellés égaux ; `List<Place> findAllByIdNotOrderByLabelAscIdAsc(Long id)` pour le calcul.
- **Révisé le 2026-10-07** : déplacé de `TimezoneController` et `TimezoneRepository` vers `PlaceController` et `PlaceRepository`, problème identique.

#### BACK-20261007-04 · Mineur · Libellé enregistré sans normalisation et doublons acceptés
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/metier/place/service/PlaceService.java:66`
- **Constat** : vérifié par un test sur la pile complète : `POST /places` avec `"label":"  Paris  "` renvoie 201 et enregistre `"  Paris  "` avec ses espaces. Aucun contrôle d'unicité. La longueur maximale est aussi contrôlée sur la valeur non nettoyée. Le front nettoie la saisie avant l'envoi, mais l'API ne le garantit pas.
- **Impact** : deux entrées visuellement identiques dans la liste et dans les résultats du calcul, impossibles à distinguer pour l'utilisateur ; tri alphabétique faussé par les espaces initiaux.
- **Recommandation** : appliquer `strip()` au libellé avant validation et enregistrement ; si l'unicité est souhaitée, contrainte `@Column(unique = true)` doublée d'un contrôle `existsByLabelIgnoreCaseAndIdNot` qui renvoie un message `generic.form.alreadyExists` (400 ou 409).
- **Révisé le 2026-10-07** : déplacé de `TimezoneService.save` vers `PlaceService.validate`, problème identique, revérifié sur `POST /places`.

#### BACK-20261007-16 · Mineur · Heure inexistante ou ambiguë au changement d'heure résolue sans avertissement
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/metier/place/service/PlaceService.java:97`
- **Constat** : la date saisie est convertie par `form.getDate().atZone(placeForm.toZoneId())`. Pour un lieu `ZONE_ID`, `atZone` décale silencieusement une heure qui n'existe pas (passage à l'heure d'été) et choisit le décalage le plus ancien pour une heure qui existe deux fois (retour à l'heure d'hiver). Vérifié sur la pile complète : à Paris, `2026-03-29T02:30` et `2026-03-29T03:30` donnent le même résultat à Tahiti (`2026-03-28T15:30`), sans aucun signal.
- **Impact** : l'utilisateur obtient le résultat d'une autre heure que celle saisie, ou d'une seule des deux heures possibles, sans le savoir. Limité aux heures de changement d'heure des lieux en zone IANA.
- **Recommandation** : détecter le cas avec `zoneId.getRules().getValidOffsets(localDateTime)` (liste vide : heure inexistante, deux éléments : heure ambiguë) et soit refuser la saisie par un message dédié (« Cette heure n'existe pas à Paris le 29/03/2026 »), soit renvoyer dans la réponse l'heure effectivement retenue pour que le front l'affiche.

#### BACK-20261007-05 · Info · Pas de verrouillage optimiste sur `Place`
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/persistence/place/Place.java:36`
- **Constat** : l'entité n'a pas de champ `@Version` et `PUT /places/{id}` écrase la ligne sans vérifier qu'elle n'a pas changé depuis sa lecture par le client. Le changement de type passe en plus par une requête SQL native (`PlaceRepository.changeType`) qui ne vérifierait pas de version.
- **Impact** : deux modifications concurrentes d'un même lieu : la dernière gagne silencieusement. Faible enjeu pour une application mono-utilisateur.
- **Recommandation** : si l'application devient multi-utilisateur, ajouter `@Version private Long version;`, l'exposer dans `PlaceResponse`, le renvoyer dans `PlaceRequest`, l'inclure dans la clause `where` de `changeType`, et traduire `ObjectOptimisticLockingFailureException` en 409.
- **Révisé le 2026-10-07** : déplacé de l'entité `Timezone` vers `Place` ; la requête native de changement de type est concernée elle aussi.

#### BACK-20261007-17 · Info · Dates d'audit renvoyées à la création plus précises que les valeurs enregistrées
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/persistence/audit/AuditListener.java:24`
- **Constat** : `Instant.now(clock)` a une précision à la nanoseconde, alors que la colonne H2 la tronque à la microseconde. Vérifié sur la pile complète : `POST /places` renvoie `createDate` `…46.747669055Z`, et le `PUT` suivant renvoie pour le même lieu `…46.747669Z`. La réponse à la création reflète l'objet en mémoire, pas la valeur stockée.
- **Impact** : un client qui compare les dates d'audit entre deux réponses (détection de modification, cache) voit une `createDate` qui change alors que rien n'a été modifié. Sans conséquence pour le front actuel, qui affiche les dates à la minute.
- **Recommandation** : tronquer dans `AuditListener` : `Instant.now(clock).truncatedTo(ChronoUnit.MICROS)`, ou fixer explicitement la précision de la colonne et tronquer en conséquence.

### 2.2 Contrat d'API

#### BACK-20261007-06 · Mineur · Date du calcul transmise comme un instant UTC mais lue comme une heure locale
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/metier/place/controller/CalculateDateRequest.java:16` ; `src/main/java/tahiti/numerique/time_zone/metier/place/controller/CalculateDateResponse.java:21`
- **Constat** : le champ `date` est un `LocalDateTime` (heure murale du lieu choisi). Le front (`transformToUTCDate`, `time-zone-frontend/src/app/view/home/home.component.ts:95`) recopie l'heure saisie dans un `Date` UTC et l'envoie sérialisé `"2026-10-07T10:00:00.000Z"`. Vérifié par un test : Jackson accepte le suffixe `Z` et l'ignore (calcul correct, Tahiti 10:00 donne Paris 22:00), mais rejette `"2026-10-07T10:00:00+05:00"` avec un 400. En réponse, les dates sont renvoyées sans décalage (`"2026-10-07T22:00:00"`) et le front les relit comme heure locale du navigateur.
- **Impact** : le contrat fonctionne par un double détournement implicite : un `Z` qui ne signifie pas UTC, toléré par une permissivité de Jackson. Un autre client de l'API (ou un changement de configuration Jackson) peut mal interpréter la date ; rien ne documente le format attendu.
- **Recommandation** : documenter que `date` est une heure locale sans décalage et faire envoyer par le front `"yyyy-MM-ddTHH:mm:ss"` sans `Z` (formatage local plutôt que `toISOString`) ; côté back, éventuellement `@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm[:ss]")` pour rendre le format explicite. Ajouter le test d'API correspondant (BACK-20261007-15).
- **Révisé le 2026-10-07** : déplacé de `metier/timezone/controller` vers `metier/place/controller` (le champ `timezoneId` est devenu `placeId`), problème identique.

### 2.3 Sécurité et robustesse

#### BACK-20261007-01 · Majeur · Un paramètre de tri contenant un caractère non alphanumérique provoque une erreur 500
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/core/exception/RestExceptionHandler.java:53`
- **Constat** : seule `PropertyReferenceException` est traduite en 400. Vérifié par un test sur la pile complète : `GET /places?sort=foo` renvoie bien 400, mais `sort=foo bar` et `sort=label;x` renvoient 500 (« Une erreur inattendue s'est produite. ») : Hibernate lève `InvalidDataAccessApiUsageException` (« Sort expression ... must only contain property references »), qui tombe dans le handler générique, avec une trace complète journalisée en `ERROR`. Avec un retour à la ligne (`foo%0AX`), la valeur injectée apparaît telle quelle sur une nouvelle ligne du journal.
- **Impact** : erreur serveur sur une simple entrée utilisateur, journaux d'erreur pollués à volonté par n'importe quel appelant, et possibilité de forger de fausses lignes de journal.
- **Recommandation** : valider les propriétés de tri avant la requête, par exemple une liste blanche dans le controller :
  ```java
  private static final Set<String> SORTABLE = Set.of(Place.Fields.id, Place.Fields.label);
  // pour chaque order de pageable.getSort() : ObjectValidator.valid(SORTABLE.contains(order.getProperty()), "sort");
  ```
  ou, à défaut, traduire aussi `InvalidDataAccessApiUsageException` en 400 dans `RestExceptionHandler`. Ajouter les cas `foo bar` et `foo%0AX` à `PlaceApiTest`.
- **Révisé le 2026-10-07** : revérifié sur `GET /places` après le passage à `Place` ; ligne du handler mise à jour, liste blanche adaptée aux champs de `Place`.

#### BACK-20261007-02 · Mineur · Journaux alimentés par des valeurs brutes de la requête
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/core/exception/RestExceptionHandler.java:55` ; `src/main/java/tahiti/numerique/time_zone/core/exception/RestExceptionHandler.java:79` ; `src/main/java/tahiti/numerique/time_zone/core/exception/RestExceptionHandler.java:100` ; `src/main/java/tahiti/numerique/time_zone/core/exception/RestExceptionHandler.java:103`
- **Constat** : les avertissements écrivent `ex.getMessage()`, qui reprend la valeur envoyée par le client (chaîne de date invalide dans l'erreur de parsing JSON, valeur du champ `type` inconnue, nom de propriété de tri, URL). La configuration Logback par défaut ne neutralise pas les retours à la ligne.
- **Impact** : un client peut insérer des retours à la ligne et de fausses entrées dans les journaux (le cas 500 est traité par BACK-20261007-01), et des valeurs arbitrairement longues.
- **Recommandation** : journaliser le type d'exception et une valeur nettoyée (`message.replaceAll("[\\r\\n]", "_")`, tronquée), ou configurer un encodeur qui échappe les caractères de contrôle (`%replace(%msg){'[\r\n]','_'}` dans le motif Logback).
- **Révisé le 2026-10-07** : étendu au nouveau handler des types inconnus (`handleHttpMessageNotReadable`, ligne 79) ; lignes mises à jour.

### 2.4 Messages et wording

#### BACK-20261007-08 · Mineur · Messages d'erreur affichés à l'utilisateur avec des identifiants techniques en anglais
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/metier/place/service/PlaceService.java:37` ; `src/main/java/tahiti/numerique/time_zone/metier/place/service/PlaceService.java:66` ; `src/main/java/tahiti/numerique/time_zone/metier/place/service/PlaceService.java:95` ; `src/main/java/tahiti/numerique/time_zone/metier/place/service/handler/ZoneOffsetFixedPlaceHandler.java:64` ; `src/main/java/tahiti/numerique/time_zone/metier/place/service/handler/ZoneIdPlaceHandler.java:39` ; `src/main/java/tahiti/numerique/time_zone/core/exception/RestExceptionHandler.java:81` ; `src/main/resources/messages.properties:4`
- **Constat** : vérifié sur la pile complète, l'API renvoie « L'objet place d'id '999' n'a pas été trouvé. », « Le champ 'zoneOffset' est obligatoire. », « La valeur du champ 'zoneId' est invalide. », « Le champ 'type' est obligatoire. », « La référence de l'objet 'placeId' n'a pas été trouvée. ». Le front affiche ces messages tels quels dans un toast (`time-zone-frontend/src/app/shared/interceptor/http-error.interceptor.ts:28`).
- **Impact** : l'utilisateur voit des noms de champs Java et un mélange de français et d'anglais (« place », « zoneOffset », « zoneId », « placeId ») au lieu de « lieu », « décalage UTC », « zone IANA ».
- **Recommandation** : passer des libellés métier aux messages, par exemple via des clés `field.place.label = nom`, `field.place.zoneOffset = décalage UTC`, `field.place.zoneId = zone IANA`, `entity.place = Le lieu` résolues par le `MessageSource`, ou des messages dédiés (`place.notFound = Le lieu n''existe pas ou a été supprimé.`).
- **Révisé le 2026-10-07** : déplacé vers `PlaceService` et les stratégies `PlaceHandler`, et étendu au champ `type` des requêtes polymorphes ; messages revérifiés sur `/places`.

#### BACK-20261007-09 · Info · Message générique pour les erreurs de format, de méthode et de type de contenu
- **Statut** : Ouvert
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/core/exception/RestExceptionHandler.java:93`
- **Constat** : une date au mauvais format, un `placeId` non numérique, une méthode non supportée (405) ou un `Content-Type` non JSON (415) renvoient tous « La requête est invalide. ». Seul le champ `type` d'une requête polymorphe, absent ou inconnu, reçoit maintenant un message précis (`handleHttpMessageNotReadable`).
- **Impact** : un appelant de l'API ne sait pas quel champ corriger ; le front contrôle ses saisies, donc l'utilisateur final est peu exposé.
- **Recommandation** : étendre `handleHttpMessageNotReadable` aux autres `MismatchedInputException` : extraire le chemin du champ (`getPath()`) et renvoyer `generic.form.invalid` avec ce champ ; garder le message générique pour les autres cas.
- **Révisé le 2026-10-07** : partiellement résolu par l'évolution vers les requêtes polymorphes (message précis pour `type`) ; titre et constat réduits à ce qui subsiste.

## Historique des analyses

| Date | Nouveaux | Corrigés | Rouverts | Ouverts au total | Compilation | Tests |
|---|---|---|---|---|---|---|
| 2026-10-07 | 3 | 1 | 0 | 17 | OK, 0 avertissement | 70/70 |
| 2026-10-07 | 15 | 0 | 0 | 15 | OK, 0 avertissement | 41/41 |
