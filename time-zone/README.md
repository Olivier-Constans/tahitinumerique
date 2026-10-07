# Time Zone – Back-end

API REST Spring Boot du projet Timezone de Tahiti Numérique. Elle gère une liste de lieux et calcule, pour une date saisie dans l'un d'eux, la date correspondante dans tous les autres. Un lieu a un libellé et l'un de ces deux types :
- **décalage UTC fixe** (`ZONE_OFFSET_FIXED`) : `-10:00`, sans changement d'heure ;
- **zone IANA** (`ZONE_ID`) : `Europe/Paris`, dont le décalage suit l'heure d'été et d'hiver.

Elle est consommée par le front Angular (dossier `../time-zone-frontend`).

**Stack** : Java 25, Spring Boot 4.1 (Web MVC, Data JPA), H2 en mémoire, Lombok, MapStruct 1.6, JUnit 5 + Mockito + MockMvc.

## Prérequis

- JDK 25
- Maven n'est pas nécessaire : le wrapper `./mvnw` télécharge Maven 3.9.16.

## Démarrage en local

```bash
./mvnw spring-boot:run
```

L'API écoute sur le port **7373**, sous le contexte `/api` : http://localhost:7373/api/places

La base H2 est **en mémoire** : le schéma est créé au démarrage par Hibernate, et les données sont perdues à chaque arrêt. Aucun jeu de données n'est chargé : la liste est vide au premier lancement.

## Commandes

| Commande | Rôle |
|---|---|
| `./mvnw spring-boot:run` | Lance l'API sur le port 7373 |
| `./mvnw test` | Tests unitaires et tests d'API |
| `./mvnw package` | Construit `target/time-zone.jar` (jar en couches), après les tests. `-DskipTests` pour les sauter |
| `java -jar target/time-zone.jar` | Lance le jar construit |

## API

Toutes les routes sont préfixées par `/api`.

| Verbe | Route | Rôle | Succès |
|---|---|---|---|
| `GET` | `/places` | Liste paginée des lieux, tous types confondus | 200 |
| `GET` | `/places/{id}` | Un lieu | 200 |
| `POST` | `/places` | Création | 201, avec l'en-tête `Location` |
| `PUT` | `/places/{id}` | Modification, y compris du type | 200 |
| `DELETE` | `/places/{id}` | Suppression | 204 |
| `GET` | `/places/zone-ids` | Zones IANA acceptées, triées | 200 |
| `GET` | `/places/zone-offsets` | Décalages acceptés, triés de `-12:00` à `+14:00` | 200 |
| `POST` | `/places/calculate-date` | Calcul de la date dans les autres lieux | 200 |

### Lieu

Requête (`POST` et `PUT`), selon le type :

```json
{ "type": "ZONE_OFFSET_FIXED", "label": "Tahiti", "zoneOffset": "-10:00" }
{ "type": "ZONE_ID", "label": "Paris", "zoneId": "Europe/Paris" }
```

- `type` : obligatoire, `ZONE_OFFSET_FIXED` ou `ZONE_ID`. Jackson s'en sert pour instancier la requête correspondante (`ZoneOffsetFixedPlaceRequest` ou `ZoneIdPlaceRequest`, sous-classes de `PlaceRequest`). Un type absent ou inconnu est refusé avant le service, avec le même format de message que les autres champs.
- `label` : obligatoire, non vide, 100 caractères au plus.
- `zoneOffset` (type `ZONE_OFFSET_FIXED`) : obligatoire, au format ISO-8601 de `java.time.ZoneOffset` (`"-10:00"`, `"+05:45"`, `"Z"` ou `"+00:00"` pour UTC), et parmi les décalages renvoyés par `GET /places/zone-offsets`. Cette liste n'est pas écrite en dur : ce sont les décalages en vigueur dans au moins une zone IANA de la JVM, au démarrage ou dans l'année qui suit, heure d'été comprise.
- `zoneId` (type `ZONE_ID`) : obligatoire, parmi les zones renvoyées par `GET /places/zone-ids` (zones connues de la JVM).

Un `PUT` peut changer le type d'un lieu : l'id et la date de création sont conservés, le champ propre à l'ancien type est effacé.

Réponse :

```json
{
  "id": 1,
  "type": "ZONE_OFFSET_FIXED",
  "label": "Tahiti",
  "zoneOffset": "-10:00",
  "audit": { "createDate": "2026-10-07T08:00:00Z", "updateDate": "2026-10-07T08:00:00Z" }
}
```

Un lieu `ZONE_ID` porte `zoneId` à la place de `zoneOffset`. `zoneOffset` est renvoyé au format ISO-8601, `Z` pour UTC. Les dates d'audit sont des `Instant` en UTC, renseignées par `AuditListener` à la création et à chaque modification.

### Liste paginée

`GET /places?page=0&size=10&sort=label,asc`

Les paramètres sont ceux de Spring Data (`page` commence à 0, 10 éléments par défaut). Un tri sur une propriété inconnue renvoie 400. La réponse est un `PageResponse`, au format stable, indépendant de la sérialisation de `PageImpl` :

```json
{ "content": [ … ], "totalElements": 12, "totalPages": 2, "number": 0, "size": 10 }
```

### Calcul de date

Requête :

```json
{ "placeId": 1, "date": "2026-10-07T12:00:00" }
```

La date, sans fuseau, est l'heure locale du lieu `placeId`. Pour une zone IANA, le décalage appliqué est celui en vigueur à cette date. La réponse donne la date équivalente dans chacun des **autres** lieux enregistrés :

```json
{
  "calculateDateItemList": [
    { "place": { "id": 2, "type": "ZONE_ID", "label": "Paris", "zoneId": "Europe/Paris", "audit": { … } }, "date": "2026-10-08T00:00:00" }
  ]
}
```

### Erreurs

Toutes les erreurs ont le même format, avec un message en français tiré de `src/main/resources/messages.properties` :

```json
{ "message": "Le champ 'label' est obligatoire." }
```

| Cas | Code |
|---|---|
| Validation métier (`BusinessException`) : champ manquant, invalide, trop long, référence inexistante | 400 |
| Lieu introuvable (`NotFoundException`) | 404 |
| Erreur Spring MVC : JSON illisible, paramètre mal typé, tri inconnu | 400 |
| Route inexistante | 404 |
| Erreur inattendue (détail dans les journaux uniquement) | 500 |

Ces cas sont traités par `RestExceptionHandler`, qui remplace aussi le format `ProblemDetail` de Spring.

## Docker

Le `Dockerfile` construit le jar avec Maven et Java 25, en extrait les couches (dépendances, chargeur, application) pour profiter du cache Docker, puis lance l'application sur une image JRE 25, avec un utilisateur non root, sur le port **7373**.

```bash
docker build -t time-zone .
docker run -p 7373:7373 time-zone
```

La JVM peut utiliser 80 % de la mémoire du conteneur, et le conteneur s'arrête en cas d'`OutOfMemoryError`.

Le `docker-compose.yml` à la racine du dépôt démarre le back et le front ensemble :

```bash
cd ..
docker-compose up    # front sur http://localhost:8080, API sur http://localhost:7373/api
```

## Structure du code

```
src/main/java/tahiti/numerique/time_zone/
├── TimeZoneApplication.java       # point d'entrée, bean Clock (UTC)
├── core/
│   ├── controller/                # PageResponse, ErrorMessageResponse
│   ├── exception/                 # BusinessException, NotFoundException, RestExceptionHandler
│   └── validator/                 # ObjectValidator, MessageCode (clés de messages.properties)
├── metier/
│   ├── place/
│   │   ├── controller/            # PlaceController, DTO Request/Response (une réponse par type de lieu)
│   │   ├── service/               # PlaceService (validation, CRUD, changement de type, calcul de date)
│   │   │   └── handler/           # PlaceHandler (une stratégie par type de lieu) et PlaceHandlerRegistry
│   │   └── mapper/                # mappers MapStruct entité <-> DTO
│   └── audit/                     # AuditResponse et son mapper
└── persistence/
    ├── place/                     # Place (abstraite, table unique), PlaceRepository
    │   ├── time_zone_fixed/       # ZoneOffsetFixedPlace : décalage fixe, et son convertisseur JPA
    │   └── zone_id/               # ZoneIdPlace : zone IANA, et son convertisseur JPA
    └── audit/                     # Audit (embarqué), Auditable, AuditListener
```

**Conventions :**
- Les controllers ne font que mapper : la validation et la logique sont dans les services.
- La validation passe par `ObjectValidator` (`required`, `notBlank`, `maxLength`, `valid`, `exist`), qui lève une `BusinessException` portant une clé de message et ses arguments. Le message n'est résolu qu'au moment de la réponse, par `RestExceptionHandler`.
- Toute nouvelle clé de message est déclarée dans `MessageCode` et dans `messages.properties`. `spring.messages.always-use-message-format=true` : les apostrophes s'y écrivent doublées (`''`).
- Un type de lieu se traite par une stratégie `PlaceHandler` (bean Spring), que `PlaceService` obtient de `PlaceHandlerRegistry` d'après la classe de la requête. Au démarrage, avant le lancement du serveur web, le registre construit son index et vérifie qu'il existe exactement une stratégie par sous-classe de `PlaceRequest` : sinon, l'application ne démarre pas.
- Les entités ne sortent pas de l'API : elles sont converties en DTO `…Response` par les mappers MapStruct.
- Une entité qui implémente `Auditable` et déclare `@EntityListeners(AuditListener.class)` reçoit ses dates de création et de modification. L'heure vient du bean `Clock`, que les tests peuvent remplacer.

## Tests

Dans `src/test/java/` :
- `PlaceServiceTest`, `PlaceMapperTest`, `ObjectValidatorTest` : tests unitaires (Mockito) ;
- `PlaceControllerTest` : couche web seule, avec MockMvc et le service simulé ;
- `PlaceApiTest` : pile complète (service, repository, H2) avec MockMvc, dont le changement de type d'un lieu ;
- `TimeZoneApplicationTests` : chargement du contexte Spring.

## Claude Code

Le projet fournit trois skills [Claude Code](https://docs.claude.com/en/docs/claude-code) dans `.claude/skills/`, sur le même modèle que ceux du front. Ils servent à auditer le back et à suivre la correction des points relevés. Ils travaillent sur `rapport-analyse-backend.md` (points ouverts) et `rapport-analyse-backend-clos.md` (points clos), à la racine du back. Les conventions communes sont dans `.claude/skills/analyse-backend/conventions.md`, et le script `.claude/skills/analyse-backend/scripts/rapport.mjs` modifie un point (statut, clôture, réouverture, synthèse) sans relire tout le rapport.

### `/analyse-backend` : analyser le back

Ce skill compile le projet (avec les avertissements), lance les tests et, si besoin, construit le paquet, lit le code et la configuration, puis crée ou met à jour `rapport-analyse-backend.md`. Quand `../time-zone-frontend` est présent, il vérifie aussi que le front consomme le contrat d'API tel que le back l'expose. Par défaut, l'analyse est incrémentale : seuls les fichiers modifiés depuis le commit noté dans le rapport, et ceux cités par les points ouverts, sont relus. Une modification du `pom.xml`, de `application.properties` ou du `Dockerfile` déclenche une analyse complète. On peut aussi demander une « analyse complète ».

**Structure du rapport :**
- une synthèse : nombre de points ouverts par gravité, résultat de la compilation, des tests et du paquet ;
- *1. Analyse technique* : Compilation et analyse statique, Architecture et structure, Homogénéité, Qualité ;
- *2. Analyse fonctionnelle* : Bugs potentiels, Contrat d'API, Sécurité et robustesse, Messages et wording ;
- *Historique des analyses* : une ligne par exécution.

**Conventions :**
- **Identifiant** : `BACK-AAAAMMJJ-NN`. La date est celle de la découverte du point. L'identifiant est définitif : il n'est jamais renuméroté ni réutilisé.
- **Gravité** : Critique, Majeur, Mineur ou Info.
- **Statuts** : `Ouvert`, `Corrigé le …` ou `Ignoré le …`, avec si possible un motif (faux positif, choix technique ou hors périmètre).

Quand on relance l'analyse, un point toujours présent garde son identifiant, un point disparu du code passe en `Corrigé`, un point qui réapparaît est rouvert avec le même identifiant, et un point ignoré n'est pas re-signalé.

### `/correction-backend <identifiant>` : traiter un point du rapport

```
/correction-backend BACK-20261007-03
```

Ce skill traite un seul point : il vérifie dans le code que le constat tient toujours, puis propose une correction (appliquée après validation, suivie de la compilation et des tests), constate une résolution par une évolution du code, ou argumente un rejet. Le point est ensuite mis à jour et déplacé dans `rapport-analyse-backend-clos.md`. Aucune modification du code ni du rapport n'est faite sans validation, et rien n'est commité automatiquement.

### `/manuel-correction-backend <identifiant> <état>` : changer le statut à la main

```
/manuel-correction-backend BACK-20261007-03 Corrigé
/manuel-correction-backend BACK-20261007-10 Ignoré
/manuel-correction-backend BACK-20261007-03 Ouvert
```

Ce skill met à jour le statut d'un point (`Corrigé`, `Ignoré` avec sa justification, ou `Ouvert` pour une réouverture) sans lire ni modifier le code. Il ne se déclenche que sur appel explicite.

### Workflow conseillé

1. `/analyse-backend` pour produire ou rafraîchir le rapport.
2. `/correction-backend BACK-…` pour chaque point à traiter, en commençant par les plus graves, ou `/manuel-correction-backend BACK-… <état>` quand la décision est déjà prise.
3. `/analyse-backend` de nouveau pour confirmer les corrections et détecter les régressions.
