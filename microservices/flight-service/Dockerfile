# Multi-stage build for Flight Service
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app

# Copy parent pom and all modules for dependency resolution
COPY pom.xml .
COPY common/pom.xml common/
COPY flight-service/pom.xml flight-service/
COPY chat-service/pom.xml chat-service/
COPY event-producer-service/pom.xml event-producer-service/
COPY notification-service/pom.xml notification-service/

# Download dependencies
RUN mvn dependency:go-offline -B -pl common,flight-service -am

# Copy source code
COPY common/src common/src
COPY flight-service/src flight-service/src

# Build
RUN mvn clean package -DskipTests -B -pl common,flight-service -am

# Runtime stage
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
RUN groupadd -r spring && useradd -r -g spring spring
COPY --from=builder /app/flight-service/target/*.jar app.jar
RUN chown -R spring:spring /app
USER spring
EXPOSE 8081
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8081/actuator/health || exit 1
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
