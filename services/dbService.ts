
import initSqlJs from 'sql.js';
import { UserProfile, UsageRecord, CustomTemplate, Category, Outcome } from '../types';
import { INITIAL_PROFILE } from '../constants';

const STORAGE_KEY = 'excuses.db_binary';
// Version must match the one in index.html import map exactly
const WASM_URL = 'https://unpkg.com/sql.js@1.12.0/dist/sql-wasm.wasm';

export class DatabaseService {
  private sql: any = null;
  private db: any = null;

  async init(): Promise<void> {
    try {
      // 1. Fetch WASM binary with version parity
      const response = await fetch(WASM_URL);
      if (!response.ok) throw new Error(`Failed to fetch WASM: ${response.statusText}`);
      const wasmBinary = await response.arrayBuffer();

      // 2. Initialize engine
      this.sql = await initSqlJs({
        wasmBinary: wasmBinary
      });

      // 3. Load from IndexedDB
      const savedDbBinary = await this.loadFromIndexedDB();
      
      if (savedDbBinary && savedDbBinary.length > 0) {
        try {
          this.db = new this.sql.Database(savedDbBinary);
        } catch (e) {
          console.error("Corrupt database file, reinitializing", e);
          this.db = new this.sql.Database();
          await this.createSchema();
        }
      } else {
        this.db = new this.sql.Database();
        await this.createSchema();
      }
    } catch (err) {
      console.error("Critical failure during Database initialization:", err);
      throw err;
    }
  }

  private async createSchema() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY CHECK (id = 0),
        overall_credibility REAL,
        risk_score REAL,
        honesty_debt INTEGER
      );

      CREATE TABLE IF NOT EXISTS overused_categories (
        category TEXT PRIMARY KEY
      );

      CREATE TABLE IF NOT EXISTS history (
        id TEXT PRIMARY KEY,
        excuse_id TEXT,
        category TEXT,
        context TEXT,
        timestamp TEXT,
        confidence REAL,
        was_true INTEGER,
        credibility_impact REAL,
        outcome TEXT,
        self_rating REAL,
        reflection_notes TEXT
      );

      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        category TEXT,
        text TEXT
      );
    `);

    // Bootstrap initial profile
    const res = this.db.exec("SELECT count(*) FROM profile");
    if (res[0].values[0][0] === 0) {
      this.db.run(
        "INSERT INTO profile (id, overall_credibility, risk_score, honesty_debt) VALUES (?, ?, ?, ?)",
        [0, INITIAL_PROFILE.overallCredibility, INITIAL_PROFILE.riskScore, INITIAL_PROFILE.honestyDebt]
      );
    }
    await this.persist();
  }

  async getProfile(): Promise<UserProfile> {
    const res = this.db.exec("SELECT overall_credibility, risk_score, honesty_debt FROM profile WHERE id = 0");
    const overusedRes = this.db.exec("SELECT category FROM overused_categories");
    
    const row = res[0].values[0];
    const overused = overusedRes.length > 0 ? overusedRes[0].values.map((v: any) => v[0]) : [];

    return {
      overallCredibility: row[0],
      riskScore: row[1],
      honestyDebt: row[2],
      overusedCategories: overused as Category[]
    };
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    this.db.run(
      "UPDATE profile SET overall_credibility = ?, risk_score = ?, honesty_debt = ? WHERE id = 0",
      [profile.overallCredibility, profile.riskScore, profile.honestyDebt]
    );

    this.db.run("DELETE FROM overused_categories");
    profile.overusedCategories.forEach(cat => {
      this.db.run("INSERT INTO overused_categories (category) VALUES (?)", [cat]);
    });

    await this.persist();
  }

  async getHistory(): Promise<UsageRecord[]> {
    const res = this.db.exec("SELECT * FROM history ORDER BY timestamp ASC");
    if (res.length === 0) return [];

    return res[0].values.map((v: any) => ({
      id: v[0],
      excuseId: v[1],
      category: v[2] as Category,
      context: v[3],
      timestamp: v[4],
      confidenceWhenUsed: v[5],
      wasTrue: v[6] === 1,
      credibilityImpact: v[7],
      outcome: v[8] as Outcome || undefined,
      selfRatingAfter: v[9] || undefined,
      reflectionNotes: v[10] || undefined
    }));
  }

  async saveHistory(record: UsageRecord): Promise<void> {
    this.db.run(
      `INSERT OR REPLACE INTO history 
      (id, excuse_id, category, context, timestamp, confidence, was_true, credibility_impact, outcome, self_rating, reflection_notes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id, record.excuseId, record.category, record.context, record.timestamp, 
        record.confidenceWhenUsed, record.wasTrue ? 1 : 0, record.credibilityImpact,
        record.outcome || null, record.selfRatingAfter || null, record.reflectionNotes || null
      ]
    );
    await this.persist();
  }

  async getTemplates(): Promise<CustomTemplate[]> {
    const res = this.db.exec("SELECT id, category, text FROM templates");
    if (res.length === 0) return [];

    return res[0].values.map((v: any) => ({
      id: v[0],
      category: v[1] as Category,
      text: v[2]
    }));
  }

  async saveTemplate(template: CustomTemplate): Promise<void> {
    this.db.run(
      "INSERT OR REPLACE INTO templates (id, category, text) VALUES (?, ?, ?)",
      [template.id, template.category, template.text]
    );
    await this.persist();
  }

  async deleteTemplate(id: string): Promise<void> {
    this.db.run("DELETE FROM templates WHERE id = ?", [id]);
    await this.persist();
  }

  async clearAllData(): Promise<void> {
    this.db.run("DELETE FROM history");
    this.db.run("DELETE FROM templates");
    this.db.run("DELETE FROM overused_categories");
    this.db.run(
      "UPDATE profile SET overall_credibility = ?, risk_score = ?, honesty_debt = ? WHERE id = 0",
      [INITIAL_PROFILE.overallCredibility, INITIAL_PROFILE.riskScore, INITIAL_PROFILE.honestyDebt]
    );
    await this.persist();
  }

  async getDatabaseBinary(): Promise<Uint8Array> {
    return this.db.export();
  }

  private async persist(): Promise<void> {
    if (!this.db) return;
    const data = this.db.export();
    await this.saveToIndexedDB(data);
  }

  private async saveToIndexedDB(binary: Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SocialCapitalStorage', 1);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files');
        }
      };
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction('files', 'readwrite');
        const store = tx.objectStore('files');
        const putReq = store.put(binary, STORAGE_KEY);
        
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async loadFromIndexedDB(): Promise<Uint8Array | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SocialCapitalStorage', 1);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files');
        }
      };
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('files')) {
            db.close();
            resolve(null);
            return;
        }
        const tx = db.transaction('files', 'readonly');
        const store = tx.objectStore('files');
        const getReq = store.get(STORAGE_KEY);
        
        getReq.onsuccess = () => {
          db.close();
          resolve(getReq.result || null);
        };
        getReq.onerror = () => {
          db.close();
          resolve(null);
        };
      };
      request.onerror = () => resolve(null);
    });
  }
}

export const db = new DatabaseService();
