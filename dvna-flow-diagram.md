# DVNA Application Flow Diagram

## High-Level Architecture

```mermaid
flowchart TB
    Start([User Access]) --> Server[server.js<br/>Express Server Entry Point]
    
    Server --> Init{Initialize<br/>Application}
    
    Init --> MW[Middleware Setup]
    MW --> Static[Static Files<br/>/public]
    MW --> Session[Express Session]
    MW --> Passport[Passport Authentication]
    MW --> BodyParser[Body Parser]
    MW --> FileUpload[File Upload]
    MW --> Morgan[Morgan Logger]
    
    Init --> Routes{Route<br/>Configuration}
    
    Routes --> MainRoutes[Main Routes<br/>routes/main.js]
    Routes --> AppRoutes[App Routes<br/>routes/app.js]
    
    MainRoutes --> Auth{Authentication<br/>Required?}
    AppRoutes --> AuthCheck[authHandler.isAuthenticated]
    
    Auth -->|No| PublicPages[Public Pages]
    Auth -->|Yes| ProtectedPages[Protected Pages]
    
    PublicPages --> Login[/login<br/>Login Page]
    PublicPages --> Register[/register<br/>Registration Page]
    PublicPages --> ForgotPW[/forgotpw<br/>Forgot Password]
    
    ProtectedPages --> Learn[/learn<br/>Vulnerability List]
    ProtectedPages --> VulnPage[/learn/vulnerability/:vuln<br/>Vulnerability Details]
    
    AuthCheck --> AppFeatures{Application<br/>Features}
    
    AppFeatures --> UserSearch[/app/usersearch<br/>SQL Injection Demo]
    AppFeatures --> Ping[/app/ping<br/>Command Injection Demo]
    AppFeatures --> Products[/app/products<br/>Product Management]
    AppFeatures --> BulkProducts[/app/bulkproducts<br/>Deserialization Demo]
    AppFeatures --> Calc[/app/calc<br/>Code Injection Demo]
    AppFeatures --> Admin[/app/admin<br/>Admin Panel]
    AppFeatures --> UserEdit[/app/useredit<br/>XSS Demo]
    AppFeatures --> ModifyProduct[/app/modifyproduct<br/>Access Control Demo]
    
    Login --> PassportAuth[Passport Local Strategy]
    Register --> PassportAuth
    
    PassportAuth --> DB[(MySQL Database)]
    UserSearch --> DB
    Products --> DB
    UserEdit --> DB
    ModifyProduct --> DB
    Admin --> DB
    
    DB --> Models[Sequelize Models]
    Models --> UserModel[User Model]
    Models --> ProductModel[Product Model]
    
    style Server fill:#ff6b6b
    style DB fill:#4ecdc4
    style Auth fill:#ffe66d
    style AuthCheck fill:#ffe66d
    style AppFeatures fill:#a8dadc
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant S as Server
    participant P as Passport
    participant AH as authHandler
    participant DB as Database
    
    U->>S: GET /login
    S->>AH: isNotAuthenticated
    AH->>S: Allow access
    S->>U: Render login page
    
    U->>S: POST /login (credentials)
    S->>P: passport.authenticate('login')
    P->>DB: Query user by login
    DB->>P: Return user data
    P->>P: Compare passwords (bcrypt)
    
    alt Authentication Success
        P->>S: Success
        S->>S: Create session
        S->>U: Redirect to /learn
    else Authentication Failed
        P->>S: Failure
        S->>U: Redirect to /login with error
    end
```

## Application Request Flow

```mermaid
flowchart LR
    Request([HTTP Request]) --> Router{Router}
    
    Router -->|/| MainRouter[main.js]
    Router -->|/app/*| AppRouter[app.js]
    
    MainRouter --> AuthMiddleware{isAuthenticated?}
    AppRouter --> AuthMiddleware2{isAuthenticated?}
    
    AuthMiddleware -->|No| RedirectLogin[Redirect to /login]
    AuthMiddleware -->|Yes| MainHandler[Route Handler]
    
    AuthMiddleware2 -->|No| RedirectLogin2[Redirect to /login]
    AuthMiddleware2 -->|Yes| AppHandler[appHandler<br/>Controller]
    
    MainHandler --> ViewRender[Render View<br/>EJS Templates]
    AppHandler --> BusinessLogic{Business Logic}
    
    BusinessLogic --> DBQuery[Database Query<br/>Sequelize]
    BusinessLogic --> Exec[System Commands<br/>child_process.exec]
    BusinessLogic --> XMLParse[XML Parsing<br/>libxmljs]
    BusinessLogic --> Deserialize[Deserialization<br/>node-serialize]
    BusinessLogic --> Math[Math Eval<br/>mathjs]
    
    DBQuery --> Response[Generate Response]
    Exec --> Response
    XMLParse --> Response
    Deserialize --> Response
    Math --> Response
    
    Response --> ViewRender
    ViewRender --> SendResponse([HTTP Response])
    
    style AuthMiddleware fill:#ffe66d
    style AuthMiddleware2 fill:#ffe66d
    style BusinessLogic fill:#a8dadc
    style DBQuery fill:#4ecdc4
```

## OWASP Top 10 Vulnerability Demonstrations

```mermaid
mindmap
  root((DVNA<br/>Vulnerabilities))
    A1 Injection
      SQL Injection
        /app/usersearch
        Concatenated SQL query
      Command Injection
        /app/ping
        exec with user input
      Code Injection
        /app/calc
        mathjs eval
    A2 Broken Authentication
      Weak password reset
        /forgotpw
        MD5 token predictable
      Session management
    A3 Sensitive Data Exposure
      Password storage
        Weak hashing
      Database credentials
        Environment variables
    A4 XML External Entities
      XXE Attack
        /app/bulkproducts
        libxmljs parsing
    A5 Broken Access Control
      IDOR
        /app/modifyproduct
        Direct object reference
      Missing function level access
        /app/admin
        Role check bypass
    A6 Security Misconfiguration
      Default credentials
      Error messages
      Debug mode
    A7 Cross-Site Scripting
      Stored XSS
        /app/useredit
        Unescaped output
      Reflected XSS
    A8 Insecure Deserialization
      Node Serialize
        /app/bulkproductslegacy
        RCE via deserialization
    A9 Known Vulnerabilities
      Outdated packages
        mathjs 3.10.1
        ejs 2.5.7
        node-serialize
    A10 Insufficient Logging
      Missing audit logs
      No monitoring
    A8 2013 CSRF
      Missing CSRF tokens
      /app/redirect
    A10 2013 Redirects
      Unvalidated redirects
        /app/redirect
```

## Database Schema

```mermaid
erDiagram
    Users ||--o{ Products : manages
    
    Users {
        int id PK
        string login
        string password
        string name
        string email
        string role
        createdAt timestamp
        updatedAt timestamp
    }
    
    Products {
        int id PK
        string name
        string code
        int quantity
        int tags
        createdAt timestamp
        updatedAt timestamp
    }
```

## Application Startup Sequence

```mermaid
sequenceDiagram
    participant Docker
    participant Script as entrypoint.sh
    participant Server as server.js
    participant DB as MySQL Database
    participant Config as Configuration
    participant Routes as Routes
    
    Docker->>Script: Start container
    Script->>Script: wait-for-it.sh<br/>Wait for MySQL
    Script->>DB: Check connection
    DB->>Script: Ready
    
    Script->>Server: node server.js
    Server->>Config: Load config/server.js
    Server->>Config: Load config/db.js
    Config->>DB: Initialize Sequelize
    DB->>Config: Connection established
    
    Server->>Server: Initialize Express
    Server->>Server: Setup middleware
    Server->>Server: Configure Passport
    Server->>Routes: Load main.js routes
    Server->>Routes: Load app.js routes
    
    Server->>Server: Start listening on port 9090
    Server->>Docker: Application ready
```

## Key Components Overview

```mermaid
graph TB
    subgraph "Entry Point"
        S[server.js]
    end
    
    subgraph "Configuration"
        C1[config/server.js]
        C2[config/db.js]
        C3[config/vulns.js]
    end
    
    subgraph "Core Logic"
        P[core/passport.js]
        AH[core/authHandler.js]
        APP[core/appHandler.js]
    end
    
    subgraph "Routes"
        MR[routes/main.js]
        AR[routes/app.js]
    end
    
    subgraph "Models"
        M1[models/user.js]
        M2[models/product.js]
        MI[models/index.js]
    end
    
    subgraph "Views"
        V1[views/login.ejs]
        V2[views/learn.ejs]
        V3[views/app/*.ejs]
        V4[views/vulnerabilities/*]
    end
    
    subgraph "Database"
        DB[(MySQL)]
    end
    
    S --> C1
    S --> C2
    S --> P
    S --> MR
    S --> AR
    
    MR --> AH
    AR --> AH
    AR --> APP
    
    AH --> MI
    APP --> MI
    P --> MI
    
    MI --> M1
    MI --> M2
    MI --> DB
    
    MR --> V1
    MR --> V2
    AR --> V3
    
    style S fill:#ff6b6b
    style DB fill:#4ecdc4
    style P fill:#ffe66d
    style AH fill:#ffe66d
    style APP fill:#95e1d3
```

---

## Summary

**DVNA** is a deliberately vulnerable Node.js application that demonstrates OWASP Top 10 vulnerabilities:

### Technology Stack
- **Framework**: Express.js
- **Authentication**: Passport.js with local strategy
- **Database**: MySQL with Sequelize ORM
- **Template Engine**: EJS
- **Session Management**: express-session

### Main Components
1. **server.js**: Application entry point, middleware configuration
2. **routes/main.js**: Authentication routes (login, register, password reset, learning portal)
3. **routes/app.js**: Application feature routes (user search, ping, products, admin)
4. **core/authHandler.js**: Authentication middleware and password management
5. **core/appHandler.js**: Vulnerable business logic implementations
6. **core/passport.js**: Passport strategies for login/signup
7. **models/**: Sequelize models for Users and Products

### Security Vulnerabilities Demonstrated
- SQL Injection (raw query concatenation)
- Command Injection (exec with user input)
- XXE (XML External Entity attacks)
- XSS (unescaped output)
- Insecure Deserialization (node-serialize)
- Broken Access Control (IDOR, missing authorization)
- Weak Authentication (predictable password reset tokens)
- Security Misconfiguration (debug mode, error disclosure)
- Using vulnerable components (outdated packages)
- Insufficient logging and monitoring

### User Journey
1. User accesses application → redirected to login
2. Registers/logs in → authenticated via Passport
3. Accesses /learn → views vulnerability list
4. Explores vulnerable features under /app/* routes
5. Each feature demonstrates specific OWASP Top 10 vulnerability
