import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG_VIEW_KEY, nextCatalogBatch, readCatalogView, withCatalogView } from '../lib/catalog-view.ts';

const defaults = { category: '', query: '', audience: 'all', theme: 'all', sort: 'manual' };
const snapshot = { scope: 'catalog', filters: { ...defaults, category: 'placas', query: 'safari', audience: 'unisex', sort: 'price-asc' }, visible: 48, scrollY: 3240 };

test('a product history entry round-trips every filter, loaded batch and scroll position', () => {
  const state = withCatalogView({ __NA: true, tree: ['catalogo'], unrelated: { value: 3 } }, snapshot);
  assert.deepEqual(readCatalogView(state, 'catalog', defaults), snapshot);
  assert.deepEqual(state.tree, ['catalogo']);
  assert.equal(state.__NA, true);
  assert.deepEqual(state.unrelated, { value: 3 });
});

test('restoring another listing or invalid history cannot override its defaults', () => {
  const state = withCatalogView(null, snapshot);
  assert.equal(readCatalogView(state, 'nubes', defaults), null);
  assert.equal(readCatalogView(null, 'catalog', defaults), null);
  for (const invalid of [{ ...snapshot, visible: -12 }, { ...snapshot, scrollY: NaN }, { ...snapshot, filters: { ...defaults, query: 7 } }]) {
    assert.equal(readCatalogView({ [CATALOG_VIEW_KEY]: invalid }, 'catalog', defaults), null);
  }
});

test('pagination ends at the available products, including incomplete final batches', () => {
  assert.equal(nextCatalogBatch(12, 43), 24);
  assert.equal(nextCatalogBatch(36, 43), 43);
  assert.equal(nextCatalogBatch(43, 43), 43);
  assert.equal(nextCatalogBatch(12, 0), 0);
});
