"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import { getSupabase } from "@/lib/supabase";

export default function ClientesPage(){
 const [items,setItems]=useState<any[]>([]);
 const [q,setQ]=useState("");
 const [loading,setLoading]=useState(true);
 const [erro,setErro]=useState("");
 useEffect(()=>{(async()=>{
   const supabase=getSupabase();
   if(!supabase){setErro("Supabase não configurado.");setLoading(false);return;}
   const {data,error}=await supabase.from("clientes").select("*").order("nome");
   if(error)setErro(error.message); else setItems(data||[]);
   setLoading(false);
 })()},[]);
 const lista=items.filter(x=>(x.nome+" "+(x.nome_fantasia||"")).toLowerCase().includes(q.toLowerCase()));
 return <div className="page">
  <header className="simple-header"><div><p className="eyebrow">RM ASSIST</p><h1>Clientes</h1><p>Clientes, locais e equipamentos.</p></div><Link className="primary-button" href="/clientes/novo">+ Novo cliente</Link></header>
  <input className="search-input" placeholder="Buscar cliente..." value={q} onChange={e=>setQ(e.target.value)}/>
  {erro&&<div className="error-box">{erro}</div>}
  {loading?<section className="empty-state"><p>Carregando...</p></section>:lista.length===0?<section className="empty-state"><div className="empty-icon">♙</div><h2>Nenhum cliente cadastrado</h2><p>Cadastre seu primeiro cliente para começar.</p><Link href="/clientes/novo" className="primary-button inline-button">Cadastrar cliente</Link></section>:
  <div className="client-list">{lista.map(c=><Link className="client-card" href={`/clientes/${c.id}`} key={c.id}><div className="avatar">{c.nome[0]?.toUpperCase()}</div><div className="client-main"><strong>{c.nome_fantasia||c.nome}</strong><span>{c.telefone||c.whatsapp||c.cpf_cnpj||"Cliente"}</span></div><span className="chevron">›</span></Link>)}</div>}
 </div>
}
