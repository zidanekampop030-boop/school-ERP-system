import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Security & Hashing Unit Tests', () => {
  const password = 'SuperSecurePassword123!';
  const jwtSecret = 'test-secret-key-999';

  test('Password Hashing is One-Way & Secure (bcrypt)', async () => {
    // Generate salt and hash
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Verify hash is not equal to plaintext password
    expect(hash).not.toBe(password);

    // Verify correct password matches hash
    const isMatch = await bcrypt.compare(password, hash);
    expect(isMatch).toBe(true);

    // Verify incorrect password fails
    const isMatchFail = await bcrypt.compare('WrongPassword', hash);
    expect(isMatchFail).toBe(false);
  });

  test('JWT Tokens are Signed & Verifiable', () => {
    const payload = {
      id: 'd3b07384-d113-4956-a534-7d5a5d08dcd9',
      name: 'John Doe',
      role: 'Student',
    };

    // Sign token
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    // Decode token and verify contents
    const decoded: any = jwt.verify(token, jwtSecret);
    expect(decoded.id).toBe(payload.id);
    expect(decoded.name).toBe(payload.name);
    expect(decoded.role).toBe(payload.role);

    // Verify token fails with wrong secret
    expect(() => {
      jwt.verify(token, 'wrong-secret');
    }).toThrow();
  });
});
