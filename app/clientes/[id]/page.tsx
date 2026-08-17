"use client";
import Link from "next/link"; import {useEffect,useState} from "react"; import {useParams} from "next/navigation"; import {readStore} from "@/lib/local-store";
export default function Detalhe(){
 const {id}=useParams<{id:string}>(); const [c,setC]=useState<any>(); const [locais,setLocais]=useState<any[]>([]); const [eqs,setEqs]=useState<any[]>([]);
 useEffect(()=>{setC(readStore<any>("clientes").find(x=>x.id===id));setLocais(readStore<any>("locais").filter(x=>x.cliente_id===id));setEqs(readStore<any>("equipamentos").filter(x=>x.cliente_id===id));},[id]);
 if(!c)return <div className="page">Carregando...</div>;
 return <div className="page"><header className="simple-header"><div><p className="eyebrow">CLIENTE</p><h1>{c.nome_fantasia||c.nome}</h1><p>{c.nome_fantasia?c.nome:c.cpf_cnpj||"Cadastro do cliente"}</p></div><Link href={`/chamados/novo?cliente=${id}`} className="primary-button">+ Chamado</Link></header>
 <section className="detail-grid"><article className="info-card"><h3>Contato</h3><p><b>Telefone:</b> {c.telefone||"—"}</p><p><b>WhatsApp:</b> {c.whatsapp||"—"}</p><p><b>E-mail:</b> {c.email||"—"}</p></article><article className="info-card"><h3>Resumo</h3><p><b>Locais:</b> {locais.length}</p><p><b>Equipamentos:</b> {eqs.length}</p></article></section>
 <section className="section-block"><div className="section-heading"><h3>Locais</h3><Link href={`/clientes/${id}/locais/novo`}>+ Adicionar</Link></div>{locais.length? <div className="mini-list">{locais.map(x=><div className="mini-card" key={x.id}><strong>{x.nome}</strong><span>{[x.endereco,x.numero,x.cidade].filter(Boolean).join(", ")}</span></div>)}</div>:<p className="muted">Nenhum local.</p>}</section>
 <section className="section-block"><div className="section-heading"><h3>Equipamentos</h3><Link href={`/clientes/${id}/equipamentos/novo`}>+ Adicionar</Link></div>{eqs.length?<div className="mini-list">{eqs.map(x=><div className="mini-card" key={x.id}><strong>{x.ambiente||x.tipo}</strong><span>{[x.marca,x.modelo,x.capacidade_btu?x.capacidade_btu+" BTU":null,x.refrigerante].filter(Boolean).join(" • ")}</span></div>)}</div>:<p className="muted">Nenhum equipamento.</p>}</section>
 </div>
}
