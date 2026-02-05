import Database from 'better-sqlite3';
import { config } from '../config.js';

export class QuotaManager {
  private db: Database.Database;
  private readonly limit: number;

  constructor(
    dbPath: string = config.dbPath,
    limit: number = config.quotaLimit,
  ) {
    this.db = new Database(dbPath);
    this.limit = limit;
    this.init();
  }

  private init() {
    this.db.exec(`
            CREATE TABLE IF NOT EXISTS quotas (
                address TEXT PRIMARY KEY,
                count INTEGER DEFAULT 0,
                last_reset INTEGER
            )
        `);
  }

  checkLimit(address: string): boolean {
    const now = Date.now();
    const row = this.db
      .prepare('SELECT count, last_reset FROM quotas WHERE address = ?')
      .get(address) as { count: number; last_reset: number } | undefined;

    if (!row) return true;

    // Reset if interval passed
    if (now - row.last_reset > config.quotaResetIntervalMs) {
      this.db
        .prepare('UPDATE quotas SET count = 0, last_reset = ? WHERE address = ?')
        .run(now, address);
      return true;
    }

    return row.count < this.limit;
  }

  incrementUsage(address: string): void {
    const now = Date.now();
    const row = this.db
      .prepare('SELECT count FROM quotas WHERE address = ?')
      .get(address);

    if (!row) {
      this.db
        .prepare(
          'INSERT INTO quotas (address, count, last_reset) VALUES (?, 1, ?)',
        )
        .run(address, now);
    } else {
      this.db
        .prepare('UPDATE quotas SET count = count + 1 WHERE address = ?')
        .run(address);
    }
  }
}
