"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
import {getSupabase} from "@/lib/supabase";

export default function Detalhe(){
 const {id}=useParams<{id:string}>();
 const [c,setC]=useState<any>();
 const [locais,setLocais]=useState<any[]>([]);
 const [eqs,setEqs]=useState<any[]>([]);
 const [erro,setErro]=useState("");

 useEffect(()=>{(async()=>{
  const s=getSupabase();if(!s)return setErro("Supabase não configurado.");
  const [{data:cli,error:e1},{data:loc,error:e2},{data:eq,error:e3}]=await Promise.all([
   s.from("clientes").select("*").eq("id",id).single(),
   s.from("locais").select("*").eq("cliente_id",id).order("nome"),
   s.from("equipamentos").select("*").eq("cliente_id",id).order("ambiente")
  ]);
  if(e1||e2||e3)setErro(e1?.message||e2?.message||e3?.message||"");
  setC(cli);setLocais(loc||[]);setEqs(eq||[]);
 })()},[id]);

 if(erro)return <div className="page"><div className="error-box">{erro}</div></div>;
 if(!c)return <div className="page">Carregando...</div>;

 return <div className="page">
  <header className="simple-header">
   <div><p className="eyebrow">CLIENTE</p><h1>{c.nome_fantasia||c.nome}</h1><p>{c.nome_fantasia?c.nome:c.cpf_cnpj||"Cadastro do cliente"}{!c.ativo?" • Inativo":""}</p></div>
   <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
    <Link href={`/clientes/${id}/editar`} className="secondary-button">Editar</Link>
    {c.ativo&&<Link href={`/chamados/novo?cliente=${id}`} className="primary-button">+ Chamado</Link>}
   </div>
  </header>

  <section className="detail-grid">
   <article className="info-card"><h3>Contato</h3><p><b>Telefone:</b> {c.telefone||"—"}</p><p><b>WhatsApp:</b> {c.whatsapp||"—"}</p><p><b>E-mail:</b> {c.email||"—"}</p></article>
   <article className="info-card"><h3>Resumo</h3><p><b>Locais:</b> {locais.length}</p><p><b>Equipamentos ativos:</b> {eqs.filter((x:any)=>x.ativo).length}</p><p><b>Status:</b> {c.ativo?"Ativo":"Inativo"}</p></article>
  </section>

  <section className="section-block">
   <div className="section-heading"><h3>Locais</h3>{c.ativo&&<Link href={`/clientes/${id}/locais/novo`}>+ Adicionar</Link>}</div>
   {locais.length?<div className="mini-list">{locais.map(x=><div className="mini-card" key={x.id}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}><div><strong>{x.nome}</strong><span>{[x.endereco,x.numero,x.cidade].filter(Boolean).join(", ")}</span></div><Link href={`/clientes/${id}/locais/${x.id}/editar`} className="secondary-button">Editar</Link></div></div>)}</div>:<p className="muted">Nenhum local.</p>}
  </section>

  <section className="section-block">
   <div className="section-heading"><h3>Equipamentos</h3>{c.ativo&&<Link href={`/clientes/${id}/equipamentos/novo`}>+ Adicionar</Link>}</div>
   {eqs.length?<div className="mini-list">{eqs.map(x=><div className="mini-card" key={x.id}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}><div><strong>{x.ambiente||x.tipo}{!x.ativo?" • Inativo":""}</strong><span>{[x.marca,x.modelo,x.capacidade_btu?x.capacidade_btu+" BTU":null,x.refrigerante].filter(Boolean).join(" • ")}</span></div><Link href={`/clientes/${id}/equipamentos/${x.id}/editar`} className="secondary-button">Editar</Link></div></div>)}</div>:<p className="muted">Nenhum equipamento.</p>}
  </section>
 </div>
}
