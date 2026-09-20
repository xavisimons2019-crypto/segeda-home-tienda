import type {Product} from './catalog';

/** Position is scoped to the category. Equal/unset positions keep the source order. */
export function compareProductOrder(a: Product, b: Product): number {
  const position = (p: Product) => Number.isInteger(p.sortOrder) && p.sortOrder! > 0 ? p.sortOrder! : Number.MAX_SAFE_INTEGER;
  return position(a) - position(b);
}

export function applyProductOrder(products: Product[], category: string, ids: string[]): Product[] {
  const members = products.filter(p => p.category === category);
  const positions = new Map(ids.map((id, index) => [id, index + 1]));
  if (positions.size !== ids.length || members.length !== ids.length || members.some(p => !positions.has(String(p.id)))) {
    throw new Error('La colección cambió. Actualiza la lista antes de ordenar.');
  }
  return products.map(p => p.category === category ? {...p, sortOrder: positions.get(String(p.id))!} : p).sort(compareProductOrder);
}

export function sameProductOrder(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}
