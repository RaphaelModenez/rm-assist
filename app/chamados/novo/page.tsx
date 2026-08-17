"use client";

import {
  FormEvent,
  Suspense,
  useEffect,
  useState
} from "react";

import {
  useRouter,
  useSearchParams
} from "next/navigation";

import ClientPicker from "@/components/ClientPicker";
import {
  addStore,
  nextNumber,
  readStore
} from "@/lib/local-store";
import {
  PRIORIDADES,
  TIPOS_SERVICO
} from "@/lib/domain";

function NovoChamadoContent() {
  const r = useRouter();
  const sp = useSearchParams();

  const [f, setF] = useState({
    cliente_id: sp.get("cliente") || "",
    local_id: "",
    equipamento_id: "",
    descricao: "",
    tipo_servico: "Manutenção corretiva",
    prioridade: "Normal",
    data_agendada: "",
    hora_agendada: "",
    duracao_prevista_min: "120",
    observacoes: ""
  });

  const [locais, setLocais] = useState<any[]>([]);
  const [eqs, setEqs] = useState<any[]>([]);

  useEffect(() => {
    setLocais(
      readStore<any>("locais").filter(
        x => x.cliente_id === f.cliente_id
      )
    );

    setEqs(
      readStore<any>("equipamentos").filter(
        x => x.cliente_id === f.cliente_id
      )
    );
  }, [f.cliente_id]);

  function save(e: FormEvent) {
    e.preventDefault();

    if (!f.cliente_id || !f.descricao) return;

    const item = {
      ...f,
      id: crypto.randomUUID(),
      numero: nextNumber("chamados"),
      status: f.data_agendada ? "agendado" : "aberto",
      created_at: new Date().toISOString()
    };

    addStore("chamados", item);
    r.push("/servicos");
  }

  return (
    <div className="page">
      <header className="simple-header">
        <div>
          <p className="eyebrow">NOVO CHAMADO</p>
          <h1>Dados e agendamento</h1>
          <p>
            Registre a solicitação e, se quiser,
            já agende.
          </p>
        </div>
      </header>

      <form className="form-card" onSubmit={save}>
        <div className="field">
          <label>Cliente *</label>

          <ClientPicker
            value={f.cliente_id}
            onChange={v =>
              setF({
                ...f,
                cliente_id: v,
                local_id: "",
                equipamento_id: ""
              })
            }
          />
        </div>

        <div className="field-grid">
          <div className="field">
            <label>Local</label>

            <select
              value={f.local_id}
              onChange={e =>
                setF({
                  ...f,
                  local_id: e.target.value
                })
              }
            >
              <option value="">Selecione</option>

              {locais.map(x => (
                <option
                  key={x.id}
                  value={x.id}
                >
                  {x.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Equipamento</label>

            <select
              value={f.equipamento_id}
              onChange={e =>
                setF({
                  ...f,
                  equipamento_id: e.target.value
                })
              }
            >
              <option value="">Selecione</option>

              {eqs.map(x => (
                <option
                  key={x.id}
                  value={x.id}
                >
                  {x.ambiente} — {x.marca}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Solicitação / problema *</label>

          <textarea
            rows={4}
            value={f.descricao}
            onChange={e =>
              setF({
                ...f,
                descricao: e.target.value
              })
            }
            placeholder="Ex.: aparelho não está gelando..."
          />
        </div>

        <div className="field-grid">
          <div className="field">
            <label>Tipo de serviço</label>

            <select
              value={f.tipo_servico}
              onChange={e =>
                setF({
                  ...f,
                  tipo_servico: e.target.value
                })
              }
            >
              {TIPOS_SERVICO.map(x => (
                <option key={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Prioridade</label>

            <select
              value={f.prioridade}
              onChange={e =>
                setF({
                  ...f,
                  prioridade: e.target.value
                })
              }
            >
              {PRIORIDADES.map(x => (
                <option key={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>
        </div>

        <h3 className="form-section-title">
          Agendamento
        </h3>

        <div className="field-grid">
          <div className="field">
            <label>Data</label>

            <input
              type="date"
              value={f.data_agendada}
              onChange={e =>
                setF({
                  ...f,
                  data_agendada: e.target.value
                })
              }
            />
          </div>

          <div className="field">
            <label>Horário</label>

            <input
              type="time"
              value={f.hora_agendada}
              onChange={e =>
                setF({
                  ...f,
                  hora_agendada: e.target.value
                })
              }
            />
          </div>
        </div>

        <div className="field">
          <label>Duração prevista (min)</label>

          <input
            type="number"
            value={f.duracao_prevista_min}
            onChange={e =>
              setF({
                ...f,
                duracao_prevista_min: e.target.value
              })
            }
          />
        </div>

        <div className="field">
          <label>Observações</label>

          <textarea
            rows={3}
            value={f.observacoes}
            onChange={e =>
              setF({
                ...f,
                observacoes: e.target.value
              })
            }
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => r.back()}
          >
            Cancelar
          </button>

          <button className="primary-button">
            Criar chamado
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NovoChamado() {
  return (
    <Suspense
      fallback={
        <div className="page">
          Carregando...
        </div>
      }
    >
      <NovoChamadoContent />
    </Suspense>
  );
}
