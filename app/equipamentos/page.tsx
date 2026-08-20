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

  const ativos=useMemo(()=>items.filter((x:any)=>x.ativo&&x.clientes?.ativo!==false),[items]);
  const clientesAtivos=useMemo(()=>new Set(ativos.map((x:any)=>x.cliente_id)).size,[ativos]);
  const lista=useMemo(()=>{
    const termo=q.trim().toLowerCase();
    return items.filter((x:any)=>{
      if(!mostrarInativos&&(!x.ativo||x.clientes?.ativo===false))return false;
      const texto=[
        x.ambiente,x.tipo,x.marca,x.modelo,x.numero_serie,x.patrimonio,x.refrigerante,
        x.clientes?.nome,x.clientes?.nome_fantasia,x.locais?.nome
      ].filter(Boolean).join(" ").toLowerCase();
      return !termo||texto.includes(termo);
    });
  },[items,q,mostrarInativos]);

  return <div className="page">
    <header className="simple-header"><div><p className="eyebrow">RM ASSIST</p><h1>Equipamentos</h1><p>Parque de equipamentos dos clientes.</p></div></header>

    <div className="stat-grid" style={{marginBottom:14}}>
      <article className="stat-card"><strong>{ativos.length}</strong><span>Equipamentos ativos</span></article>
      <article className="stat-card"><strong>{clientesAtivos}</strong><span>Clientes com equipamentos</span></article>
      <article className="stat-card"><strong>{items.length-ativos.length}</strong><span>Inativos</span></article>
    </div>

    <input className="search-input" placeholder="Buscar equipamento, cliente, marca, série..." value={q} onChange={e=>setQ(e.target.value)}/>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
      <small className="muted">{lista.length} equipamento{lista.length===1?"":"s"} encontrado{lista.length===1?"":"s"}</small>
      <button className="secondary-button" onClick={()=>setMostrarInativos(!mostrarInativos)}>{mostrarInativos?"Ocultar inativos":"Ver inativos"}</button>
    </div>

    {erro&&<div className="error-box">{erro}</div>}
    {loading?<p className="muted">Carregando equipamentos...</p>:lista.length?<div className="client-list">{lista.map((x:any)=><article className="client-card" key={x.id} style={{alignItems:"center"}}>
      <div className="avatar">❄</div>
      <div className="client-main" style={{minWidth:0}}>
        <strong>{x.ambiente||x.tipo||"Equipamento"}</strong>
        <span>{x.clientes?.nome_fantasia||x.clientes?.nome||"Cliente"}{x.locais?.nome?` • ${x.locais.nome}`:""}{(!x.ativo||x.clientes?.ativo===false)?" • Inativo":""}<br/>{[x.marca,x.modelo,x.capacidade_btu?x.capacidade_btu+" BTU":null,x.refrigerante,x.numero_serie?`S/N ${x.numero_serie}`:null].filter(Boolean).join(" • ")}</span>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
        {x.ativo&&x.clientes?.ativo!==false&&<Link href={`/chamados/novo?cliente=${x.cliente_id}&equipamento=${x.id}&local=${x.local_id||""}`} className="primary-button">+ Chamado</Link>}
        <Link href={`/clientes/${x.cliente_id}/equipamentos/${x.id}/historico`} className="secondary-button">Histórico</Link>
        <Link href={`/clientes/${x.cliente_id}/equipamentos/${x.id}/editar`} className="secondary-button">Editar</Link>
      </div>
    </article>)}</div>:<section className="empty-state"><h2>Nenhum equipamento para exibir</h2><p>{mostrarInativos?"Nenhum equipamento cadastrado.":"Nenhum equipamento ativo encontrado."}</p></section>}
  </div>
}
