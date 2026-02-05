import { describe, it, expect, vi, afterEach } from 'vitest';

describe('Config', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  it('should load default values', async () => {
    // Clear env vars relevant to config
    delete process.env.QUOTA_LIMIT;
    delete process.env.DB_PATH;

    const { config } = await import('../src/config.js');

    expect(config.quotaLimit).toBe(10);
    expect(config.dbPath).toBe(':memory:');
    expect(config.networkProvider).toBe(
      'https://devnet-gateway.multiversx.com',
    );
  });

  it('should load values from environment', async () => {
    process.env.QUOTA_LIMIT = '50';
    process.env.DB_PATH = './test.db';
    process.env.NETWORK_PROVIDER = 'https://custom-gateway.com';

    // Re-import to pick up new env vars
    const { config } = await import('../src/config.js');

    expect(config.quotaLimit).toBe(50);
    expect(config.dbPath).toBe('./test.db');
    expect(config.networkProvider).toBe('https://custom-gateway.com');
  });
});
