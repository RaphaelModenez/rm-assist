"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {getSupabase} from "@/lib/supabase";
import {fmtData} from "@/lib/domain";

export default function Servicos(){
  const r=useRouter();
  const [ch,setCh]=useState<any[]>([]);
  const [ord,setOrd]=useState<any[]>([]);
  const [erro,setErro]=useState("");
  const [iniciando,setIniciando]=useState<string>("");

  async function load(){
    const s=getSupabase(); if(!s)return setErro("Supabase não configurado.");
    const [{data:chamados,error:e1},{data:ordens,error:e2}] = await Promise.all([
      s.from("chamados").select("*, clientes(nome,nome_fantasia)").order("created_at",{ascending:false}),
      s.from("ordens_servico").select("*, clientes(nome,nome_fantasia)").order("created_at",{ascending:false})
    ]);
    if(e1||e2)setErro(e1?.message||e2?.message||""); else {setCh(chamados||[]);setOrd(ordens||[])}
  }
  useEffect(()=>{load()},[]);

  function nome(x:any){return x.clientes?.nome_fantasia||x.clientes?.nome||"Cliente"}

  async function iniciar(c:any){
    const s=getSupabase(); if(!s)return;
    setIniciando(c.id); setErro("");
    const {data:os,error}=await s.from("ordens_servico").insert({
      chamado_id:c.id,
      cliente_id:c.cliente_id,
      local_id:c.local_id||null,
      equipamento_id:c.equipamento_id||null,
      tipo_servico:c.tipo_servico,
      status:"em_atendimento",
      data_inicio:new Date().toISOString()
    }).select("id").single();
    if(error){setErro(error.message);setIniciando("");return}
    const {error:e2}=await s.from("chamados").update({status:"em_atendimento",updated_at:new Date().toISOString()}).eq("id",c.id);
    if(e2){setErro(e2.message);setIniciando("");return}
    r.push(`/os/${os.id}`); r.refresh();
  }

  return <div className="page">
    <header className="simple-header"><div><p className="eyebrow">RM ASSIST</p><h1>Serviços</h1><p>Chamados e ordens de serviço.</p></div><Link href="/chamados/novo" className="primary-button">+ Novo chamado</Link></header>
    {erro&&<div className="error-box">{erro}</div>}
    <h3 className="form-section-title">Chamados</h3>
    {ch.length===0?<p className="muted">Nenhum chamado.</p>:<div className="service-list">{ch.map(c=><article className="service-card" key={c.id}><div><span className={`status-chip ${c.status}`}>{String(c.status).replace("_"," ")}</span><h3>Chamado #{String(c.numero).padStart(4,"0")} — {nome(c)}</h3><p>{c.descricao}</p><small>{c.data_agendada?`${fmtData(c.data_agendada)} • ${c.hora_agendada?.slice(0,5)||""}`:"Sem agendamento"} • {c.prioridade}</small></div>{["aberto","agendado"].includes(c.status)&&<button className="primary-button" disabled={iniciando===c.id} onClick={()=>iniciar(c)}>{iniciando===c.id?"Iniciando...":"Iniciar atendimento"}</button>}</article>)}</div>}
    <h3 className="form-section-title">Ordens de serviço</h3>
    {ord.length===0?<p className="muted">Nenhuma OS.</p>:<div className="service-list">{ord.map(o=><Link href={`/os/${o.id}`} className="service-card" key={o.id}><div><span className={`status-chip ${o.status}`}>{String(o.status).replace("_"," ")}</span><h3>OS #{String(o.numero).padStart(4,"0")} — {nome(o)}</h3><p>{o.tipo_servico||"Serviço"}</p></div><span className="chevron">›</span></Link>)}</div>}
  </div>
}
