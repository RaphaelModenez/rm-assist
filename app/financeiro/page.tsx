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

  const total=useMemo(()=>items.reduce((s:any,x:any)=>s+Number(x.valor_servico||0),0),[items]);
  const mesAtual=useMemo(()=>{
    const now=new Date();
    return items.filter((x:any)=>{
      if(!x.data_fim)return false;
      const d=new Date(x.data_fim);
      return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
    }).reduce((s:any,x:any)=>s+Number(x.valor_servico||0),0);
  },[items]);

  return <div className="page">
    <header className="simple-header"><div><p className="eyebrow">RM ASSIST</p><h1>Financeiro</h1><p>Valores registrados nas ordens concluídas.</p></div></header>
    {erro&&<div className="error-box">{erro}</div>}
    <article className="finance-hero"><span>Total registrado</span><strong>{moeda(total)}</strong><small>{items.length} serviços concluídos</small></article>
    <div className="stat-grid"><article className="stat-card"><strong>{moeda(mesAtual)}</strong><span>Este mês</span></article><article className="stat-card"><strong>{items.length}</strong><span>OS faturadas</span></article></div>
    {loading?<p className="muted">Carregando financeiro...</p>:items.length===0?<section className="empty-state"><h2>Nenhum valor registrado</h2><p>Finalize uma OS com valor para aparecer aqui.</p></section>:<div className="service-list">{items.map((x:any)=><Link href={`/os/${x.id}/relatorio`} className="service-card" key={x.id}><div><h3>OS #{String(x.numero).padStart(4,"0")} — {x.clientes?.nome_fantasia||x.clientes?.nome||"Cliente"}</h3><p>{x.forma_pagamento||"Pagamento não informado"} • {x.tipo_servico||"Serviço"}</p><small>{x.data_fim?new Date(x.data_fim).toLocaleDateString("pt-BR"):""}</small></div><strong>{moeda(x.valor_servico)}</strong></Link>)}</div>}
  </div>
}
