"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {getSupabase} from "@/lib/supabase";

export default function Equipamentos(){
  const [items,setItems]=useState<any[]>([]);
  const [q,setQ]=useState("");
  const [erro,setErro]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{(async()=>{
    const s=getSupabase();
    if(!s){setErro("Supabase não configurado.");setLoading(false);return}
    const {data,error}=await s.from("equipamentos")
      .select("*, clientes(id,nome,nome_fantasia), locais(nome)")
      .order("ambiente");
    if(error)setErro(error.message); else setItems(data||[]);
    setLoading(false);
  })()},[]);

  const lista=useMemo(()=>{
    const termo=q.trim().toLowerCase();
    if(!termo)return items;
    return items.filter((x:any)=>[
      x.ambiente,x.tipo,x.marca,x.modelo,x.numero_serie,x.patrimonio,
      x.clientes?.nome,x.clientes?.nome_fantasia,x.locais?.nome
    ].filter(Boolean).join(" ").toLowerCase().includes(termo));
  },[items,q]);

  return <div className="page">
    <header className="simple-header"><div><p className="eyebrow">RM ASSIST</p><h1>Equipamentos</h1><p>Parque de equipamentos dos clientes.</p></div></header>
    <input className="search-input" placeholder="Buscar equipamento, cliente, marca..." value={q} onChange={e=>setQ(e.target.value)}/>
    {erro&&<div className="error-box">{erro}</div>}
    {loading?<p className="muted">Carregando equipamentos...</p>:lista.length?<div className="client-list">{lista.map((x:any)=><Link href={`/clientes/${x.cliente_id}`} className="client-card" key={x.id}><div className="avatar">❄</div><div className="client-main"><strong>{x.ambiente||x.tipo||"Equipamento"}</strong><span>{x.clientes?.nome_fantasia||x.clientes?.nome||"Cliente"}{x.locais?.nome?` • ${x.locais.nome}`:""}<br/>{[x.marca,x.modelo,x.capacidade_btu?x.capacidade_btu+" BTU":null,x.refrigerante].filter(Boolean).join(" • ")}</span></div><span className="chevron">›</span></Link>)}</div>:<section className="empty-state"><h2>Nenhum equipamento</h2><p>Cadastre equipamentos dentro da ficha do cliente.</p></section>}
  </div>
}
