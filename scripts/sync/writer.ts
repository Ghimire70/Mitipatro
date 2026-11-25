// scripts/sync/writer.ts
//
// Writes FAQ shard JSON files and the index manifest to both:
//   - data/faqs/        (source of truth, committed to git)
//   - public/data/faqs/ (served at runtime by Vite / express.static)
//
// Files are written atomically (write .tmp then rename).

import fs from 'node:fs';
import path from 'node:path';
import type { FaqItem, FaqIndex, FaqShard } from '../../lib/faqTypes';
import { FAQ_INDEX_VERSION } from '../../lib/faqTypes';

const SOURCE_DIR = path.resolve(process.cwd(), 'data', 'faqs');
const PUBLIC_DIR = path.resolve(process.cwd(), 'public', 'data', 'faqs');

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function atomicWriteJson(filePath: string, data: unknown): void {
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  fs.renameSync(tmp, filePath);
}

function shardDirFor(intent: string, category: string): string {
  return path.join(SOURCE_DIR, intent, category);
}

export function writeShards(faqs: FaqItem[]): FaqShard[] {
  ensureDir(SOURCE_DIR);
  ensureDir(PUBLIC_DIR);

  const byShard = new Map<string, FaqItem[]>();
  for (const f of faqs) {
    const key = `${f.intent}/${f.category}`;
    const arr = byShard.get(key) ?? [];
    arr.push(f);
    byShard.set(key, arr);
  }

  const shards: FaqShard[] = [];
  const now = new Date().toISOString();

  for (const [key, items] of byShard.entries()) {
    const [intent, category] = key.split('/');
    const dir = path.join(SOURCE_DIR, intent, category);
    const publicDir = path.join(PUBLIC_DIR, intent, category);
    ensureDir(dir);
    ensureDir(publicDir);

    // Sort items by question for stable output
    items.sort((a, b) => a.question.localeCompare(b.question));

    const fileName = `${category}.json`;
    const shardPath = path.join(dir, fileName);
    const publicShardPath = path.join(publicDir, fileName);

    const shardData = {
      intent,
      category,
      count: items.length,
      generatedAt: now,
      faqs: items,
    };

    atomicWriteJson(shardPath, shardData);
    atomicWriteJson(publicShardPath, shardData);

    shards.push({
      path: `/data/faqs/${intent}/${category}/${fileName}`,
      intent,
      category,
      count: items.length,
      generatedAt: now,
    });
  }

  shards.sort((a, b) => a.path.localeCompare(b.path));

  const index: FaqIndex = {
    version: FAQ_INDEX_VERSION,
    generatedAt: now,
    totalCount: faqs.length,
    shards,
  };

  atomicWriteJson(path.join(SOURCE_DIR, 'index.json'), index);
  atomicWriteJson(path.join(PUBLIC_DIR, 'index.json'), index);

  return shards;
}
