export type Cliente = {
  id: string;
  nome: string;
  nome_fantasia?: string | null;
  cpf_cnpj?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  observacoes?: string | null;
  ativo: boolean;
  created_at?: string;
};

export type Local = {
  id: string;
  cliente_id: string;
  nome: string;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  referencia?: string | null;
  observacoes?: string | null;
};

export type Equipamento = {
  id: string;
  cliente_id: string;
  local_id?: string | null;
  ambiente?: string | null;
  tipo?: string | null;
  marca?: string | null;
  modelo?: string | null;
  numero_serie?: string | null;
  capacidade_btu?: number | null;
  refrigerante?: string | null;
  tensao?: string | null;
  data_instalacao?: string | null;
  patrimonio?: string | null;
  observacoes?: string | null;
  ativo: boolean;
};
