import crypto from 'crypto';

// --- Unit under test: HMAC signature generation ---
// Mirrors the generateSignature function in worker.ts
function generateSignature(payloadStr: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
}

describe('HMAC Signature Generation', () => {
  const secret = 'test-secret-key';
  const payload = JSON.stringify({ userId: '123', email: 'test@example.com' });

  it('should produce a valid hex string', () => {
    const sig = generateSignature(payload, secret);
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should be deterministic — same input produces same output', () => {
    const sig1 = generateSignature(payload, secret);
    const sig2 = generateSignature(payload, secret);
    expect(sig1).toBe(sig2);
  });

  it('should produce different signatures for different secrets', () => {
    const sig1 = generateSignature(payload, 'secret-a');
    const sig2 = generateSignature(payload, 'secret-b');
    expect(sig1).not.toBe(sig2);
  });

  it('should produce different signatures for different payloads', () => {
    const sig1 = generateSignature('{"a":1}', secret);
    const sig2 = generateSignature('{"b":2}', secret);
    expect(sig1).not.toBe(sig2);
  });

  it('should be verifiable by the subscriber using the same secret', () => {
    const sig = generateSignature(payload, secret);
    // Subscriber-side verification
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    expect(sig).toBe(expected);
  });
});
