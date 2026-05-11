# Build stage
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app
COPY pom.xml .
COPY mvnw .
COPY mvnw.cmd .
COPY .mvn .mvn
COPY src ./src
RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/target/studentworkspace-0.0.1-SNAPSHOT.jar .
EXPOSE 8082
CMD ["java", "-jar", "studentworkspace-0.0.1-SNAPSHOT.jar"]