"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {getSupabase} from "@/lib/supabase";

export default function ClientesPage(){
 const [items,setItems]=useState<any[]>([]);
 const [q,setQ]=useState("");
 const [mostrarInativos,setMostrarInativos]=useState(false);
 const [loading,setLoading]=useState(true);
 const [erro,setErro]=useState("");

 useEffect(()=>{(async()=>{
   const supabase=getSupabase();
   if(!supabase){setErro("Supabase não configurado.");setLoading(false);return;}
   const {data,error}=await supabase.from("clientes").select("*, equipamentos(id,ativo), locais(id)").order("nome");
   if(error)setErro(error.message); else setItems(data||[]);
   setLoading(false);
 })()},[]);

 const ativos=useMemo(()=>items.filter((x:any)=>x.ativo),[items]);
 const totalEquip=useMemo(()=>ativos.reduce((s:number,x:any)=>s+(x.equipamentos||[]).filter((e:any)=>e.ativo).length,0),[ativos]);
 const lista=useMemo(()=>{
   const termo=q.trim().toLowerCase();
   return items.filter((x:any)=>{
     if(!mostrarInativos&&!x.ativo)return false;
     return !termo||(x.nome+" "+(x.nome_fantasia||"")+" "+(x.cpf_cnpj||"")+" "+(x.telefone||"")+" "+(x.whatsapp||"")+" "+(x.email||"")).toLowerCase().includes(termo);
   });
 },[items,q,mostrarInativos]);

 return <div className="page">
  <header className="simple-header"><div><p className="eyebrow">RM ASSIST</p><h1>Clientes</h1><p>Clientes, locais e equipamentos.</p></div><Link className="primary-button" href="/clientes/novo">+ Novo cliente</Link></header>

  <div className="stat-grid" style={{marginBottom:14}}>
   <article className="stat-card"><strong>{ativos.length}</strong><span>Clientes ativos</span></article>
   <article className="stat-card"><strong>{totalEquip}</strong><span>Equipamentos ativos</span></article>
   <article className="stat-card"><strong>{items.length-ativos.length}</strong><span>Clientes inativos</span></article>
  </div>

  <input className="search-input" placeholder="Buscar cliente, telefone, CNPJ..." value={q} onChange={e=>setQ(e.target.value)}/>
  <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
    <small className="muted">{lista.length} cliente{lista.length===1?"":"s"} encontrado{lista.length===1?"":"s"}</small>
    <button className="secondary-button" onClick={()=>setMostrarInativos(!mostrarInativos)}>{mostrarInativos?"Ocultar inativos":"Ver inativos"}</button>
  </div>
  {erro&&<div className="error-box">{erro}</div>}
  {loading?<section className="empty-state"><p>Carregando...</p></section>:lista.length===0?<section className="empty-state"><div className="empty-icon">♙</div><h2>Nenhum cliente para exibir</h2><p>{mostrarInativos?"Nenhum cliente cadastrado.":"Nenhum cliente ativo encontrado."}</p><Link href="/clientes/novo" className="primary-button inline-button">Cadastrar cliente</Link></section>:
  <div className="client-list">{lista.map(c=><article className="client-card" key={c.id} style={{alignItems:"center"}}>
    <div className="avatar">{c.nome[0]?.toUpperCase()}</div>
    <div className="client-main" style={{minWidth:0}}><strong>{c.nome_fantasia||c.nome}</strong><span>{c.telefone||c.whatsapp||c.cpf_cnpj||"Cliente"}{!c.ativo?" • Inativo":""}<br/>{(c.locais||[]).length} local{(c.locais||[]).length===1?"":"is"} • {(c.equipamentos||[]).filter((e:any)=>e.ativo).length} equipamento{(c.equipamentos||[]).filter((e:any)=>e.ativo).length===1?"":"s"} ativo{(c.equipamentos||[]).filter((e:any)=>e.ativo).length===1?"":"s"}</span></div>
    <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
      {c.ativo&&<Link href={`/chamados/novo?cliente=${c.id}`} className="primary-button">+ Chamado</Link>}
      <Link href={`/clientes/${c.id}`} className="secondary-button">Abrir</Link>
    </div>
  </article>)}</div>}
 </div>
}
