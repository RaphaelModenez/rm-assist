"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {getSupabase} from "@/lib/supabase";
import {fmtData} from "@/lib/domain";

function dataLocalISO(){
  const d=new Date();
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

export default function Agenda(){
  const [ch,setCh]=useState<any[]>([]);
  const [mostrarPassados,setMostrarPassados]=useState(false);
  const [erro,setErro]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{(async()=>{
    const s=getSupabase(); if(!s){setErro("Supabase não configurado.");setLoading(false);return}
    const {data,error}=await s.from("chamados")
      .select("*, clientes(nome,nome_fantasia), ordens_servico(id,status)")
      .not("data_agendada","is",null)
      .order("data_agendada",{ascending:true})
      .order("hora_agendada",{ascending:true});
    if(error)setErro(error.message); else setCh(data||[]);
    setLoading(false);
  })()},[]);

  const hoje=dataLocalISO();

  const ativos=useMemo(()=>ch.filter((x:any)=>!["concluido","cancelado"].includes(x.status)),[ch]);

  const passados=useMemo(
    ()=>ativos.filter((x:any)=>x.data_agendada<hoje),
    [ativos,hoje]
  );

  const lista=useMemo(
    ()=>ativos.filter((x:any)=>mostrarPassados?true:x.data_agendada>=hoje),
    [ativos,mostrarPassados,hoje]
  );

  const hojeQtd=useMemo(
    ()=>ativos.filter((x:any)=>x.data_agendada===hoje).length,
    [ativos,hoje]
  );

  const nome=(x:any)=>x.clientes?.nome_fantasia||x.clientes?.nome||"Cliente";
  const destino=(x:any)=>x.ordens_servico?.[0]?.id?`/os/${x.ordens_servico[0].id}`:"/servicos";

  function rotuloData(x:any){
    if(x.data_agendada===hoje)return "Hoje";
    if(x.data_agendada<hoje)return "Atrasado";
    return fmtData(x.data_agendada);
  }

  return <div className="page">
    <header className="simple-header">
      <div><p className="eyebrow">RM ASSIST</p><h1>Agenda</h1><p>Atendimentos agendados.</p></div>
      <Link href="/chamados/novo" className="primary-button">+ Agendar</Link>
    </header>

    <div className="stat-grid" style={{marginBottom:14}}>
      <article className="stat-card"><strong>{hojeQtd}</strong><span>Hoje</span></article>
      <article className="stat-card"><strong>{passados.length}</strong><span>Atrasados</span></article>
    </div>

    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
      <button className="secondary-button" onClick={()=>setMostrarPassados(!mostrarPassados)}>
        {mostrarPassados?"Ocultar atrasados":`Ver atrasados${passados.length?` (${passados.length})`:""}`}
      </button>
    </div>

    {erro&&<div className="error-box">{erro}</div>}

    {loading?<p className="muted">Carregando agenda...</p>:lista.length===0?
      <section className="empty-state"><div className="empty-icon">▣</div><h2>Agenda vazia</h2><p>Nenhum atendimento agendado para exibir.</p></section>:
      <div className="timeline">{lista.map(x=><Link href={destino(x)} className="timeline-item" key={x.id}>
        <div className="timeline-date">
          <strong>{rotuloData(x)}</strong>
          <span>{x.hora_agendada?.slice(0,5)||"—"}</span>
        </div>
        <div>
          <h3>{nome(x)}</h3>
          <p>{x.tipo_servico}</p>
          <small>{x.descricao}</small>
          {x.status==="em_atendimento"&&<small style={{display:"block",marginTop:4,fontWeight:700}}>Atendimento em andamento</small>}
          {x.data_agendada<hoje&&<small style={{display:"block",marginTop:4,fontWeight:700}}>Agendado para {fmtData(x.data_agendada)}</small>}
        </div>
      </Link>)}</div>}
  </div>
}
