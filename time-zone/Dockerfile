#---------------------------
# Etape de build
FROM maven:3.9.7 AS builder

WORKDIR /app

COPY pom.xml .

RUN --mount=type=cache,target=/root/.m2/repository mvn --batch-mode dependency:go-offline

COPY src src
RUN --mount=type=cache,target=/root/.m2/repository mvn --batch-mode -DskipTests clean package


#---------------------------
# Etape de lancement
FROM eclipse-temurin:21-jdk

RUN groupadd -g 1001 nonroot && \
    adduser --uid 1001 --gid 1001 nonroot


USER nonroot

WORKDIR /app

COPY --from=builder /app/target/time-zone.jar .

EXPOSE 8080

# MaxRAMPercentage : permet à la JVM d'utiliser un pourcentage de la mémoire totale du conteneur
# ExitOnOutOfMemoryError : permet de stopper le conteneur si une erreur de type OutOfMemoryError est détectée
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=80", "-XX:+ExitOnOutOfMemoryError", "-jar", "time-zone.jar"]