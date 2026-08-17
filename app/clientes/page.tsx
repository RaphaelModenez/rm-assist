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
   const {data,error}=await supabase.from("clientes").select("*").order("nome");
   if(error)setErro(error.message); else setItems(data||[]);
   setLoading(false);
 })()},[]);

 const lista=useMemo(()=>{
   const termo=q.trim().toLowerCase();
   return items.filter((x:any)=>{
     if(!mostrarInativos&&!x.ativo)return false;
     return !termo||(x.nome+" "+(x.nome_fantasia||"")+" "+(x.cpf_cnpj||"")+" "+(x.telefone||"")+" "+(x.whatsapp||"")).toLowerCase().includes(termo);
   });
 },[items,q,mostrarInativos]);

 return <div className="page">
  <header className="simple-header"><div><p className="eyebrow">RM ASSIST</p><h1>Clientes</h1><p>Clientes, locais e equipamentos.</p></div><Link className="primary-button" href="/clientes/novo">+ Novo cliente</Link></header>
  <input className="search-input" placeholder="Buscar cliente..." value={q} onChange={e=>setQ(e.target.value)}/>
  <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
    <button className="secondary-button" onClick={()=>setMostrarInativos(!mostrarInativos)}>{mostrarInativos?"Ocultar inativos":"Ver inativos"}</button>
  </div>
  {erro&&<div className="error-box">{erro}</div>}
  {loading?<section className="empty-state"><p>Carregando...</p></section>:lista.length===0?<section className="empty-state"><div className="empty-icon">♙</div><h2>Nenhum cliente para exibir</h2><p>{mostrarInativos?"Nenhum cliente cadastrado.":"Nenhum cliente ativo encontrado."}</p><Link href="/clientes/novo" className="primary-button inline-button">Cadastrar cliente</Link></section>:
  <div className="client-list">{lista.map(c=><Link className="client-card" href={`/clientes/${c.id}`} key={c.id}><div className="avatar">{c.nome[0]?.toUpperCase()}</div><div className="client-main"><strong>{c.nome_fantasia||c.nome}</strong><span>{c.telefone||c.whatsapp||c.cpf_cnpj||"Cliente"}{!c.ativo?" • Inativo":""}</span></div><span className="chevron">›</span></Link>)}</div>}
 </div>
}
