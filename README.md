# Timezone Tahiti Numérique

## Lancement de l'application avec Docker

Lance le back sur le port 7373 et lance un ngnx avec la distribution angular sur le port 8080. http://localhost:8080
```
> docker-compose up
```

## Répertoire

- Le répertoire "time-zone" contient l'application Back en Spring Boot
- Le répertoire "time-zone-frontend" contient l'application Front-End en Angular

# Amélioration possible du projet

Voici plusieurs possibilités d'amélioration:
- Utilisation de flyway
- Génération de la doc OpeanApi
- Amélioration des tests unitaires
- Ajout de test d'intégrations avec Cucumber/Gherkins
- Ajout des tests sur l'application Back
- Améliorer le design de l'application
- Ajouter des fonctionnalités:
  - Création d'un objet "zoneOffsetFixed" à partir d'un point sur un carte géolocalisé
  - Création d'un objet "zoneOffsetFixed" à partir d'un recherche de lieux (api OpenStreetMap / Google Map ) 

