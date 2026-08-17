"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {getSupabase} from "@/lib/supabase";
import {fmtData} from "@/lib/domain";

export default function Agenda(){
  const [ch,setCh]=useState<any[]>([]);
  const [erro,setErro]=useState("");
  useEffect(()=>{(async()=>{
    const s=getSupabase(); if(!s)return setErro("Supabase não configurado.");
    const {data,error}=await s.from("chamados")
      .select("*, clientes(nome,nome_fantasia)")
      .not("data_agendada","is",null)
      .order("data_agendada",{ascending:true})
      .order("hora_agendada",{ascending:true});
    if(error)setErro(error.message); else setCh(data||[]);
  })()},[]);
  const nome=(x:any)=>x.clientes?.nome_fantasia||x.clientes?.nome||"Cliente";
  return <div className="page">
    <header className="simple-header"><div><p className="eyebrow">RM ASSIST</p><h1>Agenda</h1><p>Atendimentos agendados.</p></div><Link href="/chamados/novo" className="primary-button">+ Agendar</Link></header>
    {erro&&<div className="error-box">{erro}</div>}
    {ch.length===0?<section className="empty-state"><div className="empty-icon">▣</div><h2>Agenda vazia</h2><p>Os chamados agendados aparecerão aqui.</p></section>:
    <div className="timeline">{ch.map(x=><Link href="/servicos" className="timeline-item" key={x.id}><div className="timeline-date"><strong>{fmtData(x.data_agendada)}</strong><span>{x.hora_agendada?.slice(0,5)||""}</span></div><div><h3>{nome(x)}</h3><p>{x.tipo_servico}</p><small>{x.descricao}</small></div></Link>)}</div>}
  </div>
}
