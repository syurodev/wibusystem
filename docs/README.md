# 📚 WIBUSYSTEM - Tài liệu Kỹ thuật

Chào mừng đến với tài liệu kỹ thuật của **WIBUSYSTEM** - một hệ thống microservice được xây dựng với ElysiaJS, TurboRepo và NextJS.

## 🗂️ Cấu trúc Tài liệu

### 📋 [Architecture](./architecture/)

- **[System Overview](./architecture/01-system-overview.md)** - Tổng quan kiến trúc hệ thống
- **[Monorepo Strategy](./architecture/02-monorepo-strategy.md)** - Chiến lược monorepo với TurboRepo
- **[Microservices Design](./architecture/03-microservices-design.md)** - Thiết kế microservices
- **[Database Architecture](./architecture/04-database-architecture.md)** - Kiến trúc database

### 📦 [Packages](./packages/)

- **[Eden Client](./packages/01-eden-client.md)** - Client library với end-to-end type safety
- **[Shared Types](./packages/02-shared-types.md)** - Shared TypeScript types
- **[Shared Schemas](./packages/03-shared-schemas.md)** - Shared validation schemas
- **[Auth Middleware](./packages/04-auth-middleware.md)** - Authentication middleware

### 🚪 [API Gateway](./gateway/)

- **[Gateway Setup](./gateway/01-gateway-setup.md)** - API Gateway configuration
- **[Authentication](./gateway/02-authentication.md)** - Token validation và auth flow
- **[Rate Limiting](./gateway/03-rate-limiting.md)** - Rate limiting strategy
- **[Service Proxy](./gateway/04-service-proxy.md)** - Service proxying patterns

### 🔐 [Services](./services/)

- **[Auth Service](./services/01-auth-service.md)** - Authentication service
- **[User Service](./services/02-user-service.md)** - User management service
- **[Translation Service](./services/03-translation-service.md)** - Translation service

### 🌐 [Frontend](./frontend/)

- **[NextJS Integration](./frontend/01-nextjs-integration.md)** - NextJS với Eden client
- **[Authentication Flow](./frontend/02-authentication-flow.md)** - Frontend auth implementation
- **[State Management](./frontend/03-state-management.md)** - State management patterns

### 🧪 [Testing](./testing/)

- **[Testing Strategy](./testing/01-testing-strategy.md)** - Chiến lược testing tổng thể
- **[Unit Testing](./testing/02-unit-testing.md)** - Unit testing với Bun
- **[Integration Testing](./testing/03-integration-testing.md)** - Integration testing
- **[E2E Testing](./testing/04-e2e-testing.md)** - End-to-end testing

### 🚀 [Deployment](./deployment/)

- **[Docker Setup](./deployment/01-docker-setup.md)** - Container configuration
- **[CI/CD Pipeline](./deployment/02-cicd-pipeline.md)** - Continuous integration/deployment
- **[Production Setup](./deployment/03-production-setup.md)** - Production environment
- **[Monitoring](./deployment/04-monitoring.md)** - Monitoring và logging

### 📖 [API Reference](./api/)

- **[Authentication API](./api/01-auth-api.md)** - Auth service API reference
- **[User API](./api/02-user-api.md)** - User service API reference
- **[Translation API](./api/03-translation-api.md)** - Translation service API reference

### 🔧 [Development](./development/)

- **[Setup Guide](./development/01-setup-guide.md)** - Development environment setup
- **[Code Standards](./development/02-code-standards.md)** - Coding standards và best practices
- **[Contributing](./development/03-contributing.md)** - Contribution guidelines
- **[Troubleshooting](./development/04-troubleshooting.md)** - Common issues và solutions

## 🎯 Mục tiêu Dự án

**WIBUSYSTEM** được thiết kế để:

- ✅ Cung cấp **end-to-end type safety** với ElysiaJS và Eden
- ✅ Kiến trúc **microservices** scalable và maintainable
- ✅ **Monorepo** organization với shared packages
- ✅ **Authentication/Authorization** tập trung tại API Gateway
- ✅ **Modern developer experience** với hot reload và type checking

## 🛠️ Tech Stack

- **Runtime**: Bun
- **Backend Framework**: ElysiaJS
- **Frontend Framework**: NextJS 14
- **Database**: PostgreSQL với Drizzle ORM
- **Build Tool**: TurboRepo
- **Language**: TypeScript
- **Authentication**: JWT với refresh tokens
- **Caching**: Redis
- **Testing**: Bun test
- **Container**: Docker

## 🚀 Quick Start

```bash
# Clone repository
git clone <repository-url>
cd WIBUSYSTEM

# Install dependencies
bun install

# Setup environment variables
cp apps/auth-service/.env-example apps/auth-service/.env
cp apps/api-gateway/.env-example apps/api-gateway/.env

# Start development
bun dev
```

---

**Cập nhật lần cuối**: `{new Date().toLocaleDateString('vi-VN')}`  
**Version**: `1.0.0`  
**Tác giả**: WIBUSYSTEM Team
