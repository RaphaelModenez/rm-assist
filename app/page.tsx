"use client";
import Image from "next/image";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {getSupabase} from "@/lib/supabase";
import {fmtData} from "@/lib/domain";

export default function Home(){
  const [s,setS]=useState({hoje:0,abertos:0,andamento:0,clientes:0,concluidos:0});
  const [agenda,setAgenda]=useState<any[]>([]);
  const [erro,setErro]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{(async()=>{
    const sb=getSupabase();
    if(!sb){setErro("Supabase não configurado.");setLoading(false);return}
    const hoje=new Date().toISOString().slice(0,10);
    const [{data:ch,error:e1},{data:os,error:e2},{count:clientes,error:e3}] = await Promise.all([
      sb.from("chamados").select("*, clientes(nome,nome_fantasia)").order("data_agendada",{ascending:true}).order("hora_agendada",{ascending:true}),
      sb.from("ordens_servico").select("id,status,data_fim"),
      sb.from("clientes").select("*",{count:"exact",head:true})
    ]);
    if(e1||e2||e3)setErro(e1?.message||e2?.message||e3?.message||"");
    const chamados=ch||[], ordens=os||[];
    setS({
      hoje:chamados.filter((x:any)=>x.data_agendada===hoje && x.status!=="concluido").length,
      abertos:chamados.filter((x:any)=>["aberto","agendado"].includes(x.status)).length,
      andamento:ordens.filter((x:any)=>x.status==="em_atendimento").length,
      clientes:clientes||0,
      concluidos:ordens.filter((x:any)=>x.status==="concluida").length
    });
    setAgenda(chamados.filter((x:any)=>x.data_agendada && !["concluido","cancelado"].includes(x.status)).slice(0,4));
    setLoading(false);
  })()},[]);

  const saudacao=useMemo(()=>{
    const h=new Date().getHours();
    return h<12?"Bom dia!":h<18?"Boa tarde!":"Boa noite!";
  },[]);

  const nome=(x:any)=>x.clientes?.nome_fantasia||x.clientes?.nome||"Cliente";

  return <div className="page">
    <header className="topbar"><div className="brand"><Image src="/icons/rm-assist-logo.png" alt="RM Assist" width={50} height={50} className="brand-logo"/><div><h1>RM Assist</h1><p>Gestão de serviços</p></div></div></header>
    <section className="hero"><div><p className="eyebrow">PAINEL</p><h2>{saudacao}</h2><p>Seus atendimentos em um só lugar.</p></div><Link href="/chamados/novo" className="primary-button">+ Novo chamado</Link></section>

    {erro&&<div className="error-box">{erro}</div>}
    {loading?<p className="muted">Atualizando painel...</p>:<>
      <div className="stat-grid">
        {[[s.hoje,"Serviços hoje"],[s.abertos,"Chamados abertos"],[s.andamento,"OS em andamento"],[s.clientes,"Clientes"]].map(([v,l])=><article className="stat-card" key={String(l)}><strong>{v}</strong><span>{l}</span></article>)}
      </div>

      <div className="section-heading"><h3>Próximos serviços</h3><Link href="/agenda">Ver agenda</Link></div>
      {agenda.length===0?<p className="muted">Nenhum serviço agendado.</p>:<div className="agenda-list">
        {agenda.map(x=><Link href="/servicos" className="agenda-card" key={x.id}><div className="time-pill"><strong>{fmtData(x.data_agendada)}</strong><span>{x.hora_agendada?.slice(0,5)||"—"}</span></div><div className="agenda-main"><strong>{nome(x)}</strong><span>{x.tipo_servico}</span></div><span className="status-badge">{x.status}</span></Link>)}
      </div>}

      <section className="quick-card"><div><p className="eyebrow">HISTÓRICO</p><h3>{s.concluidos} OS concluída{s.concluidos===1?"":"s"}</h3><p>Consulte atendimentos anteriores e reabra relatórios.</p></div><Link href="/historico" className="round-plus">›</Link></section>
    </>}
  </div>
}
