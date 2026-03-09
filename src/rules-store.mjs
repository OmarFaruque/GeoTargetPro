import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_DIR = path.resolve('data');
const DATA_FILE = path.join(DATA_DIR, 'rules.json');

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ rules: [] }, null, 2));
  }
}

export async function readRules() {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  return parsed.rules ?? [];
}

export async function writeRules(rules) {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify({ rules }, null, 2));
}

export function buildRule(input) {
  const store_id = String(input.store_id || '').trim();
  const country_code = String(input.country_code || '').trim().toUpperCase();
  const action_type = String(input.action_type || '').trim();
  const product_ids = Array.isArray(input.product_ids) ? input.product_ids.map(String) : [];

  if (!store_id) throw new Error('store_id is required');
  if (!/^[A-Z]{2}$/.test(country_code)) throw new Error('country_code must be ISO-2 uppercase');
  if (action_type !== 'hide_product') throw new Error("action_type must be 'hide_product'");

  return {
    id: crypto.randomUUID(),
    store_id,
    country_code,
    action_type,
    product_ids,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}