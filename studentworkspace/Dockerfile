# Build stage
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/target/studentworkspace-0.0.1-SNAPSHOT.jar .
EXPOSE 8082
ENV PORT=8082
CMD ["java", "-jar", "studentworkspace-0.0.1-SNAPSHOT.jar"]
