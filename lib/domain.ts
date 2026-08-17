export const TIPOS_SERVICO = [
  "Manutenção preventiva","Higienização / limpeza","Manutenção corretiva",
  "Instalação","Desinstalação","Remanejamento","Carga / recolhimento de refrigerante",
  "Serviço elétrico relacionado","PMOC","Avaliação / visita técnica","Outro"
];

export const PRIORIDADES = ["Baixa","Normal","Alta","Urgente"];

export const CHECKLIST_PREVENTIVA = [
  ["Evaporadora","Filtros de ar"],
  ["Evaporadora","Serpentina"],
  ["Evaporadora","Bandeja de condensado"],
  ["Evaporadora","Dreno"],
  ["Evaporadora","Turbina / ventilador"],
  ["Evaporadora","Conexões elétricas"],
  ["Condensadora","Serpentina"],
  ["Condensadora","Ventilador"],
  ["Condensadora","Conexões elétricas"],
  ["Condensadora","Fixação e vibração"],
  ["Sistema","Isolamento térmico"],
  ["Sistema","Tubulação frigorígena"],
  ["Sistema","Funcionamento geral"]
];

export function fmtData(iso?: string) {
  if (!iso) return "—";
  return new Date(iso + (iso.length === 10 ? "T12:00:00" : "")).toLocaleDateString("pt-BR");
}

export function moeda(v: number | string | undefined) {
  return Number(v || 0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}
