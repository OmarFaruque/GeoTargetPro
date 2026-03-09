import http from 'node:http';
import { URL } from 'node:url';
import { buildRule, readRules, writeRules } from './rules-store.mjs';

const PORT = Number(process.env.PORT || 3000);

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

const server = http.createServer(async (req, res) => {
  const method = req.method || 'GET';
  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  if (method === 'GET' && url.pathname === '/health') {
    return sendJson(res, 200, { ok: true, service: 'geotarget-pro' });
  }

  if (method === 'GET' && url.pathname === '/api/rules') {
    const storeId = url.searchParams.get('store_id');
    const country = url.searchParams.get('country')?.toUpperCase();
    const rules = await readRules();
    const filtered = rules.filter((rule) => {
      if (storeId && rule.store_id !== storeId) return false;
      if (country && rule.country_code !== country) return false;
      return true;
    });
    return sendJson(res, 200, { rules: filtered });
  }

  if (method === 'POST' && url.pathname === '/api/rules') {
    try {
      const body = await parseBody(req);
      const newRule = buildRule(body);
      const rules = await readRules();
      rules.push(newRule);
      await writeRules(rules);
      return sendJson(res, 201, { rule: newRule });
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  if (method === 'DELETE' && url.pathname.startsWith('/api/rules/')) {
    const id = url.pathname.split('/').pop();
    const rules = await readRules();
    const next = rules.filter((rule) => rule.id !== id);
    if (next.length === rules.length) {
      return sendJson(res, 404, { error: 'rule not found' });
    }
    await writeRules(next);
    return sendJson(res, 200, { deleted: id });
  }

  if (method === 'GET' && url.pathname === '/apps/geotarget/rules') {
    const country = String(url.searchParams.get('country') || '').toUpperCase();
    const storeId = String(url.searchParams.get('store_id') || 'default');
    if (!country) {
      return sendJson(res, 400, { error: 'country is required' });
    }

    const rules = await readRules();
    const blocked = rules
      .filter(
        (rule) =>
          rule.store_id === storeId &&
          rule.country_code === country &&
          rule.action_type === 'hide_product'
      )
      .flatMap((rule) => rule.product_ids);

    return sendJson(res, 200, {
      country,
      action: 'hide_product',
      productIds: [...new Set(blocked)]
    });
  }

  return sendJson(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`GeoTarget Pro API listening on http://localhost:${PORT}`);
});