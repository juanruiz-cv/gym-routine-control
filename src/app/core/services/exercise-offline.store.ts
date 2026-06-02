import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { openDB, type IDBPDatabase } from 'idb';
import type { Exercise } from '@shared/models';

@Injectable({ providedIn: 'root' })
export class ExerciseOfflineStore {
  private readonly _platformId = inject(PLATFORM_ID);
  private _db: Promise<IDBPDatabase | null>;

  constructor() {
    this._db = isPlatformBrowser(this._platformId)
      ? this._initDb()
      : Promise.resolve(null);
  }

  private async _initDb(): Promise<IDBPDatabase> {
    return openDB('gym-exercises', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('exercises')) {
          db.createObjectStore('exercises', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('pending_ops')) {
          const opsStore = db.createObjectStore('pending_ops', { keyPath: 'id' });
          opsStore.createIndex('entityType', 'entityType');
        }
      },
    });
  }

  async getAll(): Promise<Exercise[]> {
    const db = await this._db;
    if (!db) return [];
    return db.getAll('exercises');
  }

  async putAll(exercises: Exercise[]): Promise<void> {
    const db = await this._db;
    if (!db) return;
    const tx = db.transaction('exercises', 'readwrite');
    for (const ex of exercises) {
      tx.store.put(ex);
    }
    await tx.done;
  }

  async put(exercise: Exercise): Promise<void> {
    const db = await this._db;
    if (!db) return;
    await db.put('exercises', exercise);
  }

  async getById(id: string): Promise<Exercise | undefined> {
    const db = await this._db;
    if (!db) return undefined;
    return db.get('exercises', id);
  }

  async delete(id: string): Promise<void> {
    const db = await this._db;
    if (!db) return;
    await db.delete('exercises', id);
  }

  async clear(): Promise<void> {
    const db = await this._db;
    if (!db) return;
    await db.clear('exercises');
  }

  async getPendingOps(): Promise<PendingOperation[]> {
    const db = await this._db;
    if (!db) return [];
    return db.getAll('pending_ops');
  }

  async addPendingOp(op: PendingOperation): Promise<void> {
    const db = await this._db;
    if (!db) return;
    await db.put('pending_ops', op);
  }

  async removePendingOp(id: string): Promise<void> {
    const db = await this._db;
    if (!db) return;
    await db.delete('pending_ops', id);
  }

  async clearPendingOps(): Promise<void> {
    const db = await this._db;
    if (!db) return;
    await db.clear('pending_ops');
  }
}

export interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'exercise';
  entityId: string;
  payload: Partial<Exercise>;
  createdAt: string;
  retryCount: number;
}
