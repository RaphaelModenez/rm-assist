"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {getSupabase} from "@/lib/supabase";
import {moeda} from "@/lib/domain";

export default function Financeiro(){
  const [items,setItems]=useState<any[]>([]);
  const [erro,setErro]=useState("");
  const [loading,setLoading]=useState(true);
  const [q,setQ]=useState("");
  const [periodo,setPeriodo]=useState("mes");

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

  const filtrados=useMemo(()=>{
    const termo=q.trim().toLowerCase();
    const agora=new Date();
    return items.filter((x:any)=>{
      if(periodo!=="todos"){
        if(!x.data_fim)return false;
        const d=new Date(x.data_fim);
        if(periodo==="mes"&&(d.getMonth()!==agora.getMonth()||d.getFullYear()!==agora.getFullYear()))return false;
        if(periodo==="ano"&&d.getFullYear()!==agora.getFullYear())return false;
      }
      const texto=[x.numero,x.clientes?.nome,x.clientes?.nome_fantasia,x.forma_pagamento,x.tipo_servico].filter(Boolean).join(" ").toLowerCase();
      return !termo||texto.includes(termo);
    });
  },[items,q,periodo]);

  const faturadas=useMemo(()=>filtrados.filter((x:any)=>Number(x.valor_servico||0)>0),[filtrados]);
  const total=useMemo(()=>faturadas.reduce((s:number,x:any)=>s+Number(x.valor_servico||0),0),[faturadas]);
  const ticket=useMemo(()=>faturadas.length?total/faturadas.length:0,[faturadas,total]);
  const semValor=filtrados.length-faturadas.length;

  return <div className="page">
    <header className="simple-header"><div><p className="eyebrow">RM ASSIST</p><h1>Financeiro</h1><p>Valores registrados nas ordens de serviço concluídas.</p></div></header>
    {erro&&<div className="error-box">{erro}</div>}

    <div className="field-grid" style={{marginBottom:14}}>
      <div className="field"><label>Período</label><select value={periodo} onChange={e=>setPeriodo(e.target.value)}><option value="mes">Este mês</option><option value="ano">Este ano</option><option value="todos">Todo o período</option></select></div>
      <div className="field"><label>Buscar</label><input placeholder="Cliente, OS, pagamento..." value={q} onChange={e=>setQ(e.target.value)}/></div>
    </div>

    <article className="finance-hero"><span>Total no período</span><strong>{moeda(total)}</strong><small>{faturadas.length} OS com valor informado</small></article>
    <div className="stat-grid">
      <article className="stat-card"><strong>{moeda(ticket)}</strong><span>Ticket médio</span></article>
      <article className="stat-card"><strong>{faturadas.length}</strong><span>OS com valor</span></article>
      <article className="stat-card"><strong>{semValor}</strong><span>OS sem valor</span></article>
    </div>

    {loading?<p className="muted">Carregando financeiro...</p>:filtrados.length===0?<section className="empty-state"><h2>Nenhuma OS encontrada</h2><p>Ajuste o período ou a busca.</p></section>:<div className="service-list">{filtrados.map((x:any)=><Link href={`/os/${x.id}/relatorio`} className="service-card" key={x.id}><div><h3>OS #{String(x.numero).padStart(4,"0")} — {x.clientes?.nome_fantasia||x.clientes?.nome||"Cliente"}</h3><p>{x.forma_pagamento||"Pagamento não informado"} • {x.tipo_servico||"Serviço"}</p><small>{x.data_fim?new Date(x.data_fim).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"}):""}</small></div><strong>{Number(x.valor_servico||0)>0?moeda(x.valor_servico):"Sem valor"}</strong></Link>)}</div>}
  </div>
}
