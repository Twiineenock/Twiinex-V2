# 🚀 Twiinex V2 Backend (Spring Boot)

This is the core backend for **Twiinex V2**, built with Spring Boot 3.4 and Java 21. It leverages **Hiero Enterprise Java** to interface with the Hedera network for decentralized escrow management.

## 🛠️ Tech Stack

- **Framework**: Spring Boot 3.4
- **Blockchain SDK**: Hiero Enterprise Java (Hedera Token Service & Consensus Service)
- **Database**: Supabase (via Postgrest/REST)
- **Security**: Spring Security + JWT
- **Payments**: Flutterwave SDK

## 📋 Features

- **Decentralized Escrow**: Automated minting and burning of HTS tokens for transaction security.
- **Audit Logging**: Real-time event logging to Hedera Consensus Service (HCS).
- **Payment Verification**: Webhook and manual verification of Flutterwave payments.
- **Enterprise Ready**: Designed using the Hiero Enterprise framework for robust Hedera interactions.

## 🚀 Getting Started

### 1. Prerequisites
- **JDK 21** or higher.
- **Maven 3.9+**.
- A local installation of the **Hiero Enterprise Java** library in your Maven repository (run `mvn install` in the `hiero-enterprise-java` directory first).

### 2. Configuration
Create or update `src/main/resources/application.properties`:

```properties
# Hedera Configuration
spring.hiero.accountId=0.0.XXXX
spring.hiero.privateKey=302e0201...
spring.hiero.topicId=0.0.YYYY
spring.hiero.tokenId=0.0.ZZZZ

# Flutterwave
flw.secretKey=FLWSECK_TEST-...

# Supabase
supabase.url=https://your-project.supabase.co
supabase.key=your-anon-key
```

### 3. Running the Server
```bash
./mvnw spring-boot:run
```

The server will start on `http://localhost:8080`.

## 🛣️ API Endpoints (Brief)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | `POST` | Authenticate and get JWT |
| `/api/escrow/init` | `POST` | Initialize a new escrow transaction |
| `/api/escrow/verify` | `POST` | Verify payment and mint tokens |
| `/api/transactions` | `GET` | Retrieve user transaction history |

## 🛡️ Security
The API is secured with JWT. Ensure you include the `Authorization: Bearer <token>` header for all protected routes.

---
Built with ☕ and ⚡ by the Twiinex Team.
