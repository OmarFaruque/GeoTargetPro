import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRule } from '../src/rules-store.mjs';

test('buildRule accepts valid hide_product rule', () => {
  const rule = buildRule({
    store_id: 'store-1',
    country_code: 'us',
    action_type: 'hide_product',
    product_ids: ['gid://shopify/Product/1']
  });

  assert.equal(rule.store_id, 'store-1');
  assert.equal(rule.country_code, 'US');
  assert.equal(rule.action_type, 'hide_product');
  assert.deepEqual(rule.product_ids, ['gid://shopify/Product/1']);
  assert.ok(rule.id);
});

test('buildRule rejects unsupported action_type', () => {
  assert.throws(
    () => buildRule({ store_id: 'store-1', country_code: 'US', action_type: 'show_banner' }),
    /action_type must be 'hide_product'/
  );
});