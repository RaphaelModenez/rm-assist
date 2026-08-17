"use client";

import Link from "next/link";
import {FormEvent, Suspense, useEffect, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import ClientPicker from "@/components/ClientPicker";
import {getSupabase} from "@/lib/supabase";
import {PRIORIDADES, TIPOS_SERVICO} from "@/lib/domain";

function NovoChamadoContent() {
  const r = useRouter();
  const sp = useSearchParams();
  const [erro,setErro] = useState("");
  const [salvando,setSalvando] = useState(false);
  const [f,setF] = useState({
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
  const [locais,setLocais] = useState<any[]>([]);
  const [eqs,setEqs] = useState<any[]>([]);

  useEffect(()=>{
    const clienteDaUrl = sp.get("cliente") || "";
    if (clienteDaUrl && clienteDaUrl !== f.cliente_id) {
      setF(prev => ({...prev, cliente_id: clienteDaUrl, local_id:"", equipamento_id:""}));
    }
  },[sp]);

  useEffect(()=>{
    (async()=>{
      if(!f.cliente_id){setLocais([]);setEqs([]);return}
      const s=getSupabase();
      if(!s)return;
      const [{data:loc},{data:eq}] = await Promise.all([
        s.from("locais").select("id,nome").eq("cliente_id",f.cliente_id).order("nome"),
        s.from("equipamentos").select("id,ambiente,marca").eq("cliente_id",f.cliente_id).order("ambiente")
      ]);
      setLocais(loc||[]);
      setEqs(eq||[]);
    })()
  },[f.cliente_id]);

  async function save(e:FormEvent){
    e.preventDefault();
    if(!f.cliente_id || !f.descricao.trim()) return setErro("Informe o cliente e a solicitação.");
    const s=getSupabase();
    if(!s)return setErro("Supabase não configurado.");
    setSalvando(true); setErro("");
    const {error}=await s.from("chamados").insert({
      cliente_id:f.cliente_id,
      local_id:f.local_id||null,
      equipamento_id:f.equipamento_id||null,
      descricao:f.descricao.trim(),
      tipo_servico:f.tipo_servico,
      prioridade:f.prioridade,
      status:f.data_agendada?"agendado":"aberto",
      data_agendada:f.data_agendada||null,
      hora_agendada:f.hora_agendada||null,
      duracao_prevista_min:f.duracao_prevista_min?Number(f.duracao_prevista_min):null,
      observacoes:f.observacoes||null
    });
    setSalvando(false);
    if(error)return setErro(error.message);
    r.push("/servicos"); r.refresh();
  }

  return <div className="page">
    <header className="simple-header"><div><p className="eyebrow">NOVO CHAMADO</p><h1>Dados e agendamento</h1><p>Registre a solicitação e, se quiser, já agende.</p></div></header>
    <form className="form-card" onSubmit={save}>
      <div className="field">
        <label>Cliente *</label>
        <ClientPicker value={f.cliente_id} onChange={v=>setF({...f,cliente_id:v,local_id:"",equipamento_id:""})}/>
        <div style={{marginTop:10}}>
          <Link href="/clientes/novo?retorno=chamado" className="secondary-button">+ Cadastrar novo cliente</Link>
        </div>
      </div>
      <div className="field-grid">
        <div className="field"><label>Local</label><select value={f.local_id} onChange={e=>setF({...f,local_id:e.target.value})}><option value="">Selecione</option>{locais.map(x=><option key={x.id} value={x.id}>{x.nome}</option>)}</select></div>
        <div className="field"><label>Equipamento</label><select value={f.equipamento_id} onChange={e=>setF({...f,equipamento_id:e.target.value})}><option value="">Selecione</option>{eqs.map(x=><option key={x.id} value={x.id}>{x.ambiente} — {x.marca||"Sem marca"}</option>)}</select></div>
      </div>
      <div className="field"><label>Solicitação / problema *</label><textarea rows={4} value={f.descricao} onChange={e=>setF({...f,descricao:e.target.value})} placeholder="Ex.: aparelho não está gelando..."/></div>
      <div className="field-grid">
        <div className="field"><label>Tipo de serviço</label><select value={f.tipo_servico} onChange={e=>setF({...f,tipo_servico:e.target.value})}>{TIPOS_SERVICO.map(x=><option key={x}>{x}</option>)}</select></div>
        <div className="field"><label>Prioridade</label><select value={f.prioridade} onChange={e=>setF({...f,prioridade:e.target.value})}>{PRIORIDADES.map(x=><option key={x}>{x}</option>)}</select></div>
      </div>
      <h3 className="form-section-title">Agendamento</h3>
      <div className="field-grid">
        <div className="field"><label>Data</label><input type="date" value={f.data_agendada} onChange={e=>setF({...f,data_agendada:e.target.value})}/></div>
        <div className="field"><label>Horário</label><input type="time" value={f.hora_agendada} onChange={e=>setF({...f,hora_agendada:e.target.value})}/></div>
      </div>
      <div className="field"><label>Duração prevista (min)</label><input type="number" value={f.duracao_prevista_min} onChange={e=>setF({...f,duracao_prevista_min:e.target.value})}/></div>
      <div className="field"><label>Observações</label><textarea rows={3} value={f.observacoes} onChange={e=>setF({...f,observacoes:e.target.value})}/></div>
      {erro&&<div className="error-box">{erro}</div>}
      <div className="form-actions"><button type="button" className="secondary-button" onClick={()=>r.back()}>Cancelar</button><button className="primary-button" disabled={salvando}>{salvando?"Criando...":"Criar chamado"}</button></div>
    </form>
  </div>
}

export default function NovoChamado(){
  return <Suspense fallback={<div className="page">Carregando...</div>}><NovoChamadoContent/></Suspense>
}
