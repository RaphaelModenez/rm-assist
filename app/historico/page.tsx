"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {getSupabase} from "@/lib/supabase";
import {moeda} from "@/lib/domain";

export default function Historico(){
  const [items,setItems]=useState<any[]>([]);
  const [q,setQ]=useState("");
  const [erro,setErro]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{(async()=>{
    const s=getSupabase();
    if(!s){setErro("Supabase não configurado.");setLoading(false);return}
    const {data,error}=await s.from("ordens_servico")
      .select("*, clientes(nome,nome_fantasia), equipamentos(ambiente,marca,modelo)")
      .eq("status","concluida")
      .order("data_fim",{ascending:false});
    if(error)setErro(error.message); else setItems(data||[]);
    setLoading(false);
  })()},[]);

  const lista=useMemo(()=>{
    const termo=q.trim().toLowerCase();
    if(!termo)return items;
    return items.filter((x:any)=>{
      const texto=[
        x.numero,
        x.clientes?.nome,
        x.clientes?.nome_fantasia,
        x.tipo_servico,
        x.equipamentos?.ambiente,
        x.equipamentos?.marca,
        x.equipamentos?.modelo
      ].filter(Boolean).join(" ").toLowerCase();
      return texto.includes(termo);
    });
  },[items,q]);

  return <div className="page">
    <header className="simple-header"><div><p className="eyebrow">RM ASSIST</p><h1>Histórico</h1><p>Ordens de serviço concluídas.</p></div></header>
    <input className="search-input" placeholder="Buscar por cliente, OS ou equipamento..." value={q} onChange={e=>setQ(e.target.value)}/>
    {erro&&<div className="error-box">{erro}</div>}
    {loading?<p className="muted">Carregando histórico...</p>:lista.length===0?<section className="empty-state"><h2>Nenhuma OS concluída</h2><p>Os serviços finalizados aparecerão aqui.</p></section>:
    <div className="service-list">{lista.map((o:any)=><article className="service-card" key={o.id}><div><span className="status-chip concluida">concluída</span><h3>OS #{String(o.numero).padStart(4,"0")} — {o.clientes?.nome_fantasia||o.clientes?.nome||"Cliente"}</h3><p>{o.tipo_servico||"Serviço"}{o.equipamentos?.ambiente?` • ${o.equipamentos.ambiente}`:""}</p><small>{o.data_fim?new Date(o.data_fim).toLocaleDateString("pt-BR"):""}{o.valor_servico!==null&&o.valor_servico!==undefined?` • ${moeda(o.valor_servico)}`:""}</small></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Link href={`/os/${o.id}`} className="secondary-button">Abrir OS</Link><Link href={`/os/${o.id}/relatorio`} className="primary-button">Relatório</Link></div></article>)}</div>}
  </div>
}
