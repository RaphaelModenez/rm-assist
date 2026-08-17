export type StoreName =
  | "clientes" | "locais" | "equipamentos" | "chamados" | "ordens"
  | "checklists" | "medicoes" | "materiais" | "fotos" | "assinaturas"
  | "orcamentos" | "financeiro";

const prefix = "rmassist_";

export function readStore<T>(name: StoreName): T[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(prefix + name) || "[]"); }
  catch { return []; }
}

export function writeStore<T>(name: StoreName, data: T[]) {
  localStorage.setItem(prefix + name, JSON.stringify(data));
}

export function addStore<T extends { id: string }>(name: StoreName, item: T) {
  const data = readStore<T>(name);
  data.unshift(item);
  writeStore(name, data);
  return item;
}

export function updateStore<T extends { id: string }>(name: StoreName, item: T) {
  const data = readStore<T>(name);
  const idx = data.findIndex(x => x.id === item.id);
  if (idx >= 0) data[idx] = item; else data.unshift(item);
  writeStore(name, data);
  return item;
}

export function nextNumber(name: "chamados" | "ordens") {
  const data = readStore<any>(name);
  return (data.reduce((m, x) => Math.max(m, Number(x.numero || 0)), 0) || 0) + 1;
}
