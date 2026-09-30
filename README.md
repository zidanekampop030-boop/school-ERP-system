# School ERP Microservices System (SEN4121 Exam Guide)

This is a complete, containerized, multi-service School ERP system built for the **SEN4121: Large System Environment** 6-week practical examination. It implements 5 microservices orchestrated by Docker Compose, linked database configurations (3NF + Indexes), asynchronous message queuing, security mitigations, and performance tests.

---

## Quick Start (Week 6 Integration)

To launch the entire ERP environment including all databases, message brokers, and service gateways, run a single command in the project root:

```bash
docker-compose up --build
```

### Port Allocations
Once running, you can access the microservices via the **API Gateway** on port **5000**, or hit the individual service ports directly:
- **API Gateway (Front Door)**: `http://localhost:5000`
- **Interactive Swagger Documentation**: `http://localhost:5000/docs`
- **Auth Microservice**: `http://localhost:5001`
- **Academic Microservice**: `http://localhost:5002`
- **Finance Microservice**: `http://localhost:5003`
- **HR Microservice**: `http://localhost:5004`
- **RabbitMQ Dashboard**: `http://localhost:15672` (Credentials: `guest` / `guest`)

---

## Step-by-Step Test Guide (For Examiner Demonstration)

Use this guide to walk the examiner through the requirements for each week.

### 🔑 Week 1: Authentication & RBAC Demo
First, register two users (an **Admin** and a **Student**) and get their JWT tokens.

1. **Register a Student Account**:
   ```bash
   curl -X POST http://localhost:5000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name": "Alice Green", "email": "alice@school.edu", "password": "securepassword", "role": "Student"}'
   ```

2. **Register an Admin Account**:
   ```bash
   curl -X POST http://localhost:5000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name": "Admin User", "email": "admin@school.edu", "password": "adminpassword", "role": "Admin"}'
   ```

3. **Log in as Student** (Copy the returned `token`):
   ```bash
   curl -X POST http://localhost:5000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "alice@school.edu", "password": "securepassword"}'
   ```

4. **Log in as Admin** (Copy the returned `token`):
   ```bash
   curl -X POST http://localhost:5000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@school.edu", "password": "adminpassword"}'
   ```

5. **Test Role-Based Access Control (Live Rule Change Demo)**:
   - Request the Admin-only page using the **Student's Token** (should fail with `403 Forbidden`):
     ```bash
     curl -X GET http://localhost:5000/api/v1/auth/admin-only \
       -H "Authorization: Bearer <STUDENT_TOKEN>"
     ```
   - Request the Admin-only page using the **Admin's Token** (should succeed with `200 OK`):
     ```bash
     curl -X GET http://localhost:5000/api/v1/auth/admin-only \
       -H "Authorization: Bearer <ADMIN_TOKEN>"
     ```

---

### 💾 Week 2: Database Management (Backup & Restore Demo)
*Note: Refer to [database_erd.md](docs/database_erd.md) for 3NF and Index details.*

1. **Run Backup Script**:
   Open a new terminal and run the backup command. This dumps all PostgreSQL databases to `docs/backups/`.
   - **On Linux/macOS**: `./docs/backup_restore.sh backup`
   - **On Windows**: `powershell -File ./docs/backup_restore.ps1 backup`

2. **Restore Database**:
   - Delete some data or test live restore:
   - **On Linux/macOS**: `./docs/backup_restore.sh restore`
   - **On Windows**: `powershell -File ./docs/backup_restore.ps1 restore`

---

### 🛡️ Week 3: API Gateway & Rate-Limiter Demo
1. **Trigger Rate Limiting**:
   Send more than 10 requests to the API Gateway in under 1 minute.
   ```bash
   # Run this repeatedly 11 times. On the 11th call, you will get:
   # HTTP/1.1 429 Too Many Requests (Rate limit exceeded)
   curl -X GET http://localhost:5000/gateway-info
   ```

2. **Access Swagger Interactive API Console**:
   Open your browser to `http://localhost:5000/docs`.

---

### 📬 Week 4: Messaging & Asynchronous Workflow Demo
Demonstrate that enrolling a student in `academic-service` automatically generates a fee invoice in `finance-service` via **RabbitMQ** (asynchronous event architecture).

1. **Create Student Profile (Admin Token)**:
   ```bash
   curl -X POST http://localhost:5000/api/v1/academic/students \
     -H "Authorization: Bearer <ADMIN_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"name": "Alice Green", "email": "alice@school.edu"}'
   # Copy the returned student id (e.g. UUID)
   ```

2. **Create Course (Admin Token)**:
   ```bash
   curl -X POST http://localhost:5000/api/v1/academic/courses \
     -H "Authorization: Bearer <ADMIN_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"code": "SEN4121", "title": "Large System Environment", "credits": 3}'
   # Copy the returned course id (e.g. UUID)
   ```

3. **Enroll Student in Course (Admin Token)**:
   This creates the enrollment record in the Academic Database and publishes an asynchronous event to RabbitMQ.
   ```bash
   curl -X POST http://localhost:5000/api/v1/academic/enroll \
     -H "Authorization: Bearer <ADMIN_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"studentId": "<STUDENT_ID>", "courseId": "<COURSE_ID>"}'
   ```

4. **Verify Billing generated in Finance Service automatically**:
   Without making any call to the Finance service, fetch the invoices of the student. You will find that a **$450.00 PENDING tuition invoice** has already been generated!
   ```bash
   curl -X GET http://localhost:5000/api/v1/finance/student/<STUDENT_ID> \
     -H "Authorization: Bearer <ADMIN_TOKEN>"
   ```

---

### 🎓 Week 5: Specific Module Features Demo

#### 📊 Academic Feature: Grade Transcript & GPA Generator
1. **Grade the Student's Course (Admin Token)**:
   ```bash
   curl -X PUT http://localhost:5000/api/v1/academic/enrollments/<ENROLLMENT_ID>/grade \
     -H "Authorization: Bearer <ADMIN_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"grade": "A"}'
   ```
2. **Fetch Transcript**:
   Shows courses enrolled, grades earned, and GPA calculation (e.g. GPA: `4.00`).
   ```bash
   curl -X GET http://localhost:5000/api/v1/academic/students/<STUDENT_ID>/transcript \
     -H "Authorization: Bearer <ADMIN_TOKEN>"
   ```

#### 💸 Finance Feature: Pay Invoice & Generate Receipt
1. **Pay the Pending Invoice**:
   Generates a formal receipt slip with a unique reference number.
   ```bash
   curl -X POST http://localhost:5000/api/v1/finance/<INVOICE_ID>/pay \
     -H "Authorization: Bearer <ADMIN_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"paymentMethod": "DEBIT_CARD"}'
   ```

#### 💼 HR Feature: Staff Salaries & Payroll Deductions
1. **Add Staff Member (Admin Token)**:
   ```bash
   curl -X POST http://localhost:5000/api/v1/hr/staff \
     -H "Authorization: Bearer <ADMIN_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"name": "Prof Tanwi", "email": "tanwi@school.edu", "department": "Software Engineering", "baseSalary": 4800}'
   ```
2. **Calculate Deductions (Admin Token)**:
   Applies tiered tax rules (15% for $4800) and deducts flat rates to output a payroll slip.
   ```bash
   curl -X POST http://localhost:5000/api/v1/hr/payroll/<STAFF_ID>/calculate \
     -H "Authorization: Bearer <ADMIN_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"month": "2026-08", "otherDeductions": 150}'
   ```

---

## 🔒 Security Demonstrations (OWASP A01: BOLA Prevention)

To show the examiner how the system protects data, try to access Alice's records using another student's credentials.

1. **Register a second student, Bob**:
   ```bash
   curl -X POST http://localhost:5000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name": "Bob Blue", "email": "bob@school.edu", "password": "bobpassword", "role": "Student"}'
   ```
2. **Log in as Bob** and get Bob's token.
3. **Attempt to access Alice's Transcript** using Bob's Token:
   ```bash
   curl -X GET http://localhost:5000/api/v1/academic/students/<ALICE_STUDENT_ID>/transcript \
     -H "Authorization: Bearer <BOB_TOKEN>"
   ```
   **Response**: `403 Forbidden: You cannot access another student's transcript (BOLA Prevention)`

---

## ⚡ Performance Demonstration (k6 Load Test)

If k6 is installed on your machine, you can run a load test against the API Gateway to show how it handles traffic:

```bash
k6 run k6-load-test.js
```
This tests response speed and documents HTTP 429 requests generated when virtual users exceed the rate limit rules.
