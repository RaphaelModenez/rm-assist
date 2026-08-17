"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import { readStore } from "@/lib/local-store";

export default function ClientesPage(){
 const [items,setItems]=useState<any[]>([]);
 const [q,setQ]=useState("");
 useEffect(()=>setItems(readStore("clientes")),[]);
 const lista=items.filter(x=>(x.nome+" "+(x.nome_fantasia||"")).toLowerCase().includes(q.toLowerCase()));
 return <div className="page">
  <header className="simple-header"><div><p className="eyebrow">RM ASSIST</p><h1>Clientes</h1><p>Clientes, locais e equipamentos.</p></div><Link className="primary-button" href="/clientes/novo">+ Novo cliente</Link></header>
  <input className="search-input" placeholder="Buscar cliente..." value={q} onChange={e=>setQ(e.target.value)}/>
  {lista.length===0?<section className="empty-state"><div className="empty-icon">♙</div><h2>Nenhum cliente cadastrado</h2><p>Cadastre seu primeiro cliente para começar.</p><Link href="/clientes/novo" className="primary-button inline-button">Cadastrar cliente</Link></section>:
  <div className="client-list">{lista.map(c=><Link className="client-card" href={`/clientes/${c.id}`} key={c.id}><div className="avatar">{c.nome[0]?.toUpperCase()}</div><div className="client-main"><strong>{c.nome_fantasia||c.nome}</strong><span>{c.telefone||c.whatsapp||c.cpf_cnpj||"Cliente"}</span></div><span className="chevron">›</span></Link>)}</div>}
 </div>
}
