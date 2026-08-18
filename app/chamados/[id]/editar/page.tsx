"use client";
import {FormEvent,useEffect,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import {getSupabase} from "@/lib/supabase";
import {PRIORIDADES,TIPOS_SERVICO} from "@/lib/domain";

export default function EditarAgendamento(){
 const {id}=useParams<{id:string}>();
 const r=useRouter();
 const [f,setF]=useState<any>();
 const [cliente,setCliente]=useState("");
 const [erro,setErro]=useState("");
 const [salvando,setSalvando]=useState(false);

 useEffect(()=>{(async()=>{
  const s=getSupabase();if(!s)return setErro("Supabase não configurado.");
  const {data,error}=await s.from("chamados")
   .select("*, clientes(nome,nome_fantasia)")
   .eq("id",id).single();
  if(error)return setErro(error.message);
  if(data.status==="em_atendimento")return setErro("Este atendimento já foi iniciado e não pode mais ser reagendado por esta tela.");
  setCliente(data.clientes?.nome_fantasia||data.clientes?.nome||"Cliente");
  setF({
   descricao:data.descricao||"",
   tipo_servico:data.tipo_servico||"Manutenção corretiva",
   prioridade:data.prioridade||"Normal",
   data_agendada:data.data_agendada||"",
   hora_agendada:data.hora_agendada?.slice(0,5)||"",
   duracao_prevista_min:data.duracao_prevista_min??"",
   observacoes:data.observacoes||""
  });
 })()},[id]);

 async function salvar(e:FormEvent){
  e.preventDefault();
  if(!f.data_agendada)return setErro("Informe a nova data do agendamento.");
  const s=getSupabase();if(!s)return;
  setSalvando(true);setErro("");
  const {error}=await s.from("chamados").update({
   descricao:f.descricao.trim(),
   tipo_servico:f.tipo_servico,
   prioridade:f.prioridade,
   data_agendada:f.data_agendada,
   hora_agendada:f.hora_agendada||null,
   duracao_prevista_min:f.duracao_prevista_min?Number(f.duracao_prevista_min):null,
   observacoes:f.observacoes||null,
   status:"agendado",
   updated_at:new Date().toISOString()
  }).eq("id",id);
  setSalvando(false);
  if(error)return setErro(error.message);
  r.push("/agenda");r.refresh();
 }

 if(erro&&!f)return <div className="page"><div className="error-box">{erro}</div><button className="secondary-button" onClick={()=>r.back()}>Voltar</button></div>;
 if(!f)return <div className="page">Carregando agendamento...</div>;

 return <div className="page">
  <header className="simple-header"><div><p className="eyebrow">AGENDAMENTO</p><h1>Editar agendamento</h1><p>{cliente}</p></div></header>
  <form className="form-card" onSubmit={salvar}>
   <div className="field"><label>Solicitação / serviço</label><textarea rows={3} value={f.descricao} onChange={e=>setF({...f,descricao:e.target.value})}/></div>
   <div className="field-grid">
    <div className="field"><label>Tipo de serviço</label><select value={f.tipo_servico} onChange={e=>setF({...f,tipo_servico:e.target.value})}>{TIPOS_SERVICO.map(x=><option key={x}>{x}</option>)}</select></div>
    <div className="field"><label>Prioridade</label><select value={f.prioridade} onChange={e=>setF({...f,prioridade:e.target.value})}>{PRIORIDADES.map(x=><option key={x}>{x}</option>)}</select></div>
   </div>
   <h3 className="form-section-title">Data e horário</h3>
   <div className="field-grid">
    <div className="field"><label>Data *</label><input type="date" value={f.data_agendada} onChange={e=>setF({...f,data_agendada:e.target.value})}/></div>
    <div className="field"><label>Horário</label><input type="time" value={f.hora_agendada} onChange={e=>setF({...f,hora_agendada:e.target.value})}/></div>
   </div>
   <div className="field"><label>Duração prevista (min)</label><input type="number" value={f.duracao_prevista_min} onChange={e=>setF({...f,duracao_prevista_min:e.target.value})}/></div>
   <div className="field"><label>Observações</label><textarea rows={3} value={f.observacoes} onChange={e=>setF({...f,observacoes:e.target.value})}/></div>
   {erro&&<div className="error-box">{erro}</div>}
   <div className="form-actions">
    <button type="button" className="secondary-button" disabled={salvando} onClick={()=>r.back()}>Cancelar</button>
    <button className="primary-button" disabled={salvando}>{salvando?"Salvando...":"Salvar alterações"}</button>
   </div>
  </form>
 </div>
}
