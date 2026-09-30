#---------------------------
# Etape de build
FROM maven:3.9.16-eclipse-temurin-25 AS builder

WORKDIR /app

COPY pom.xml .

RUN --mount=type=cache,target=/root/.m2/repository mvn --batch-mode dependency:go-offline

COPY src src
RUN --mount=type=cache,target=/root/.m2/repository mvn --batch-mode -DskipTests clean package

# Extraction des couches du jar : les dépendances (qui changent peu) sont séparées du code applicatif
# afin de profiter du cache Docker. Source :
# https://docs.spring.io/spring-boot/reference/packaging/container-images/dockerfiles.html
RUN java -Djarmode=tools -jar target/time-zone.jar extract --layers --launcher --destination extracted


#---------------------------
# Etape de lancement
FROM eclipse-temurin:25-jre

RUN groupadd -g 1001 nonroot && \
    adduser --uid 1001 --gid 1001 nonroot


USER nonroot

WORKDIR /app

COPY --from=builder /app/extracted/dependencies/ ./
COPY --from=builder /app/extracted/spring-boot-loader/ ./
COPY --from=builder /app/extracted/snapshot-dependencies/ ./
COPY --from=builder /app/extracted/application/ ./

EXPOSE 7373

# MaxRAMPercentage : permet à la JVM d'utiliser un pourcentage de la mémoire totale du conteneur
# ExitOnOutOfMemoryError : permet de stopper le conteneur si une erreur de type OutOfMemoryError est détectée
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=80", "-XX:+ExitOnOutOfMemoryError", "org.springframework.boot.loader.launch.JarLauncher"]
