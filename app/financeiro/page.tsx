"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {getSupabase} from "@/lib/supabase";
import {moeda} from "@/lib/domain";

export default function Financeiro(){
  const [items,setItems]=useState<any[]>([]);
  const [erro,setErro]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{(async()=>{
    const s=getSupabase();
    if(!s){setErro("Supabase não configurado.");setLoading(false);return}
    const {data,error}=await s.from("ordens_servico")
      .select("id,numero,status,data_fim,valor_servico,forma_pagamento,tipo_servico,clientes(nome,nome_fantasia)")
      .eq("status","concluida")
      .order("data_fim",{ascending:false});
    if(error)setErro(error.message); else setItems(data||[]);
    setLoading(false);
  })()},[]);

  const faturadas=useMemo(()=>items.filter((x:any)=>Number(x.valor_servico||0)>0),[items]);
  const total=useMemo(()=>faturadas.reduce((s:any,x:any)=>s+Number(x.valor_servico||0),0),[faturadas]);
  const mesAtual=useMemo(()=>{
    const now=new Date();
    return faturadas.filter((x:any)=>{
      if(!x.data_fim)return false;
      const d=new Date(x.data_fim);
      return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
    }).reduce((s:any,x:any)=>s+Number(x.valor_servico||0),0);
  },[faturadas]);

  return <div className="page">
    <header className="simple-header"><div><p className="eyebrow">RM ASSIST</p><h1>Financeiro</h1><p>Valores registrados nas ordens de serviço concluídas.</p></div></header>
    {erro&&<div className="error-box">{erro}</div>}
    <article className="finance-hero"><span>Total registrado</span><strong>{moeda(total)}</strong><small>{faturadas.length} OS com valor informado</small></article>
    <div className="stat-grid"><article className="stat-card"><strong>{moeda(mesAtual)}</strong><span>Este mês</span></article><article className="stat-card"><strong>{faturadas.length}</strong><span>OS com valor</span></article><article className="stat-card"><strong>{items.length-faturadas.length}</strong><span>OS sem valor</span></article></div>
    {loading?<p className="muted">Carregando financeiro...</p>:items.length===0?<section className="empty-state"><h2>Nenhuma OS concluída</h2><p>Finalize uma OS para aparecer aqui.</p></section>:<div className="service-list">{items.map((x:any)=><Link href={`/os/${x.id}/relatorio`} className="service-card" key={x.id}><div><h3>OS #{String(x.numero).padStart(4,"0")} — {x.clientes?.nome_fantasia||x.clientes?.nome||"Cliente"}</h3><p>{x.forma_pagamento||"Pagamento não informado"} • {x.tipo_servico||"Serviço"}</p><small>{x.data_fim?new Date(x.data_fim).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"}):""}</small></div><strong>{Number(x.valor_servico||0)>0?moeda(x.valor_servico):"Sem valor"}</strong></Link>)}</div>}
  </div>
}
