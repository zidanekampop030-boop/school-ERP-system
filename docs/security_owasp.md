# OWASP Top 10 Security Protections

This document details the security mitigations implemented in the School ERP Microservices codebase to address key web security risks, satisfying **Week 4: Check your system's safety and speed** and prep for the examiner evaluation.

---

## 1. Broken Object Level Authorization (BOLA / IDOR)

### The Risk (OWASP A01:2021)
Broken Object Level Authorization occurs when an application exposes a database record ID (such as a UUID) via an API endpoint and fails to verify if the requesting user has permission to access that specific record. For example, a student logging in and requesting `GET /api/v1/academic/students/other-student-uuid/transcript` to view another student's grades.

### Our Mitigation
We implemented rigid validation checks in the controllers of all service endpoints that fetch user-specific records:
- **Academic Service (`getTranscript` check)**:
  ```typescript
  const currentUser = (req as any).user;
  if (currentUser.role === 'Student' && currentUser.email !== student.email) {
    return res.status(403).json({ error: "Forbidden: You cannot access another student's transcript (BOLA Prevention)" });
  }
  ```
- **Finance Service (`getStudentInvoices` check)**:
  We check if the user is a `Student` and confirm that the query email matches the JWT payload's email.
- **HR Service (`getStaffPayrollHistory` check)**:
  Students are completely blocked from viewing payrolls. Staff members are blocked from viewing other staff members' payrolls:
  ```typescript
  if (currentUser.role === 'Staff' && currentUser.email !== staff.email) {
    return res.status(403).json({ error: "Forbidden: You cannot access another staff member's payroll" });
  }
  ```
### Why it matters
 BOLA is the most common and dangerous vulnerability in modern APIs. Preventing it ensures student grade privacy and strict salary confidentiality across the university.

---

## 2. SQL Injection (SQLi)

### The Risk (OWASP A03:2021 - Injection)
SQL Injection occurs when user-supplied input is directly concatenated into raw SQL queries without sanitization. An attacker can input SQL payloads (e.g., `' OR '1'='1`) to bypass login forms, delete tables, or download the entire database.

### Our Mitigation
- We use **Sequelize ORM** to execute all database queries. Under the hood, Sequelize uses parameterized queries (prepared statements) provided by the `pg` client.
- In parameterized queries, user inputs are sent as parameters distinct from the SQL query template. The database engine compiles the SQL command template first, then treats the parameter values strictly as literal values, not executable code.
- Example:
  ```typescript
  // SECURE: Automatically parameterized by Sequelize ORM
  const user = await User.findOne({ where: { email } });
  ```
### Why it matters
Injection attacks can lead to complete database compromises, identity theft, and loss of data integrity. Using parameterized queries eliminates the risk entirely.

---

## 3. Identification and Authentication Failures

### The Risk (OWASP A07:2021)
This category covers weaknesses in authentication mechanisms, including storing plain text passwords, lack of brute-force protection (allowing attackers to guess credentials repeatedly), and weak JWT signatures.

### Our Mitigation
1. **Password Hashing with Bcrypt**:
   Plaintext passwords are never stored in the database. When a user registers, we generate a secure salt and hash the password using `bcryptjs` before writing it to PostgreSQL.
   ```typescript
   const salt = await bcrypt.genSalt(10);
   const hashedPassword = await bcrypt.hash(password, salt);
   ```
   Even if the database is leaked, passwords cannot be easily reversed.
2. **Cryptographically Signed JWT Tokens**:
   Session tokens are generated using a cryptographically secure JWT secret. The verification middleware validates the signature on every incoming request.
3. **Gateway Rate Limiting**:
   To prevent brute-force attacks on the `/login` endpoint or Denial of Service (DoS) attempts on the gateway, we rate limit clients at the API Gateway:
   ```typescript
   const gatewayLimiter = rateLimit({
     windowMs: 60 * 1000, // 1 minute
     limit: 10,           // Max 10 requests per minute
     message: { error: 'Too many requests, please try again later.' }
   });
   ```
### Why it matters
Weak authentication allows attackers to easily hijack user accounts. Hashing passwords and rate limiting login attempts prevents unauthorized user takeover.
