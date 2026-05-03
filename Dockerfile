# Build stage
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy the entire repository (needed for submodules/libraries)
COPY . .

# 1. Build and install the Hiero Library first
RUN cd hiero-enterprise-java && mvn clean install -DskipTests

# 2. Build the Twiinex Server
RUN cd twiinex-v2-server && mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/twiinex-v2-server/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
