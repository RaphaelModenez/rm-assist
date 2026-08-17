"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {getSupabase} from "@/lib/supabase";

export default function Equipamentos(){
  const [items,setItems]=useState<any[]>([]);
  const [q,setQ]=useState("");
  const [mostrarInativos,setMostrarInativos]=useState(false);
  const [erro,setErro]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{(async()=>{
    const s=getSupabase();
    if(!s){setErro("Supabase não configurado.");setLoading(false);return}
    const {data,error}=await s.from("equipamentos")
      .select("*, clientes(id,nome,nome_fantasia,ativo), locais(nome)")
      .order("ambiente");
    if(error)setErro(error.message); else setItems(data||[]);
    setLoading(false);
  })()},[]);

  const lista=useMemo(()=>{
    const termo=q.trim().toLowerCase();
    return items.filter((x:any)=>{
      if(!mostrarInativos&&(!x.ativo||x.clientes?.ativo===false))return false;
      const texto=[
        x.ambiente,x.tipo,x.marca,x.modelo,x.numero_serie,x.patrimonio,
        x.clientes?.nome,x.clientes?.nome_fantasia,x.locais?.nome
      ].filter(Boolean).join(" ").toLowerCase();
      return !termo||texto.includes(termo);
    });
  },[items,q,mostrarInativos]);

  return <div className="page">
    <header className="simple-header"><div><p className="eyebrow">RM ASSIST</p><h1>Equipamentos</h1><p>Parque de equipamentos dos clientes.</p></div></header>
    <input className="search-input" placeholder="Buscar equipamento, cliente, marca..." value={q} onChange={e=>setQ(e.target.value)}/>
    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
      <button className="secondary-button" onClick={()=>setMostrarInativos(!mostrarInativos)}>{mostrarInativos?"Ocultar inativos":"Ver inativos"}</button>
    </div>
    {erro&&<div className="error-box">{erro}</div>}
    {loading?<p className="muted">Carregando equipamentos...</p>:lista.length?<div className="client-list">{lista.map((x:any)=><Link href={`/clientes/${x.cliente_id}`} className="client-card" key={x.id}><div className="avatar">❄</div><div className="client-main"><strong>{x.ambiente||x.tipo||"Equipamento"}</strong><span>{x.clientes?.nome_fantasia||x.clientes?.nome||"Cliente"}{x.locais?.nome?` • ${x.locais.nome}`:""}{(!x.ativo||x.clientes?.ativo===false)?" • Inativo":""}<br/>{[x.marca,x.modelo,x.capacidade_btu?x.capacidade_btu+" BTU":null,x.refrigerante].filter(Boolean).join(" • ")}</span></div><span className="chevron">›</span></Link>)}</div>:<section className="empty-state"><h2>Nenhum equipamento para exibir</h2><p>{mostrarInativos?"Nenhum equipamento cadastrado.":"Nenhum equipamento ativo encontrado."}</p></section>}
  </div>
}
