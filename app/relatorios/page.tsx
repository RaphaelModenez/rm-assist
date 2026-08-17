"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {getSupabase} from "@/lib/supabase";

export default function Relatorios(){
  const [items,setItems]=useState<any[]>([]);
  const [q,setQ]=useState("");
  const [erro,setErro]=useState("");
  const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{
    const s=getSupabase(); if(!s){setErro("Supabase não configurado.");setLoading(false);return}
    const {data,error}=await s.from("ordens_servico").select("id,numero,data_fim,situacao_final,tipo_servico,clientes(nome,nome_fantasia),equipamentos(ambiente,marca,modelo)").eq("status","concluida").order("data_fim",{ascending:false});
    if(error)setErro(error.message); else setItems(data||[]); setLoading(false);
  })()},[]);
  const lista=useMemo(()=>{const t=q.trim().toLowerCase();if(!t)return items;return items.filter((x:any)=>[x.numero,x.clientes?.nome,x.clientes?.nome_fantasia,x.tipo_servico,x.situacao_final,x.equipamentos?.ambiente,x.equipamentos?.marca,x.equipamentos?.modelo].filter(Boolean).join(" ").toLowerCase().includes(t))},[items,q]);
  return <div className="page"><header className="simple-header"><div><p className="eyebrow">RM ASSIST</p><h1>Relatórios</h1><p>Ordens de serviço concluídas e prontas para impressão.</p></div></header>
  <input className="search-input" placeholder="Buscar relatório..." value={q} onChange={e=>setQ(e.target.value)}/>{erro&&<div className="error-box">{erro}</div>}
  {loading?<p className="muted">Carregando relatórios...</p>:lista.length?<div className="service-list">{lista.map((x:any)=><Link className="service-card" href={`/os/${x.id}/relatorio`} key={x.id}><div><h3>OS #{String(x.numero).padStart(4,"0")} — {x.clientes?.nome_fantasia||x.clientes?.nome||"Cliente"}</h3><p>{x.situacao_final||x.tipo_servico||"Serviço concluído"}</p><small>{x.data_fim?new Date(x.data_fim).toLocaleDateString("pt-BR"):""}{x.equipamentos?.ambiente?` • ${x.equipamentos.ambiente}`:""}</small></div><span className="chevron">›</span></Link>)}</div>:<section className="empty-state"><h2>Nenhum relatório</h2><p>Relatórios aparecem quando uma OS é concluída.</p></section>}</div>}
