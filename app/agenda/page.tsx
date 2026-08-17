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
      .select("*, clientes(nome,nome_fantasia)")
      .not("data_agendada","is",null)
      .order("data_agendada",{ascending:true})
      .order("hora_agendada",{ascending:true});
    if(error)setErro(error.message); else setCh(data||[]);
    setLoading(false);
  })()},[]);

  const hoje=dataLocalISO();
  const lista=useMemo(()=>ch.filter((x:any)=>{
    if(["concluido","cancelado"].includes(x.status))return false;
    return mostrarPassados?true:x.data_agendada>=hoje;
  }),[ch,mostrarPassados,hoje]);

  const nome=(x:any)=>x.clientes?.nome_fantasia||x.clientes?.nome||"Cliente";

  return <div className="page">
    <header className="simple-header"><div><p className="eyebrow">RM ASSIST</p><h1>Agenda</h1><p>Atendimentos agendados.</p></div><Link href="/chamados/novo" className="primary-button">+ Agendar</Link></header>
    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
      <button className="secondary-button" onClick={()=>setMostrarPassados(!mostrarPassados)}>{mostrarPassados?"Ocultar passados":"Ver passados"}</button>
    </div>
    {erro&&<div className="error-box">{erro}</div>}
    {loading?<p className="muted">Carregando agenda...</p>:lista.length===0?<section className="empty-state"><div className="empty-icon">▣</div><h2>Agenda vazia</h2><p>Nenhum atendimento agendado para exibir.</p></section>:
    <div className="timeline">{lista.map(x=><Link href="/servicos" className="timeline-item" key={x.id}><div className="timeline-date"><strong>{fmtData(x.data_agendada)}</strong><span>{x.hora_agendada?.slice(0,5)||"—"}</span></div><div><h3>{nome(x)}</h3><p>{x.tipo_servico}</p><small>{x.descricao}</small></div></Link>)}</div>}
  </div>
}
