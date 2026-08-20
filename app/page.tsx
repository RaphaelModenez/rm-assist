"use client";
import Image from "next/image";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {getSupabase} from "@/lib/supabase";
import {fmtData,moeda} from "@/lib/domain";

function dataLocalISO(){
  const d=new Date();
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

export default function Home(){
  const [s,setS]=useState({hoje:0,abertos:0,andamento:0,clientes:0,concluidos:0,atrasados:0,faturamentoMes:0});
  const [agenda,setAgenda]=useState<any[]>([]);
  const [erro,setErro]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{(async()=>{
    const sb=getSupabase();
    if(!sb){setErro("Supabase não configurado.");setLoading(false);return}
    const hoje=dataLocalISO();
    const now=new Date();
    const [{data:ch,error:e1},{data:os,error:e2},{count:clientes,error:e3}] = await Promise.all([
      sb.from("chamados").select("*, clientes(nome,nome_fantasia), ordens_servico(id,status)").order("data_agendada",{ascending:true}).order("hora_agendada",{ascending:true}),
      sb.from("ordens_servico").select("id,status,data_fim,valor_servico"),
      sb.from("clientes").select("*",{count:"exact",head:true}).eq("ativo",true)
    ]);
    if(e1||e2||e3)setErro(e1?.message||e2?.message||e3?.message||"");
    const chamados=ch||[], ordens=os||[];
    const ativos=chamados.filter((x:any)=>!["concluido","cancelado"].includes(x.status));
    const faturamentoMes=ordens.filter((x:any)=>{
      if(x.status!=="concluida"||!x.data_fim)return false;
      const d=new Date(x.data_fim);
      return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
    }).reduce((total:number,x:any)=>total+Number(x.valor_servico||0),0);

    setS({
      hoje:ativos.filter((x:any)=>x.data_agendada===hoje).length,
      abertos:ativos.filter((x:any)=>["aberto","agendado"].includes(x.status)).length,
      andamento:ordens.filter((x:any)=>x.status==="em_atendimento").length,
      clientes:clientes||0,
      concluidos:ordens.filter((x:any)=>x.status==="concluida").length,
      atrasados:ativos.filter((x:any)=>x.data_agendada && x.data_agendada<hoje).length,
      faturamentoMes
    });

    setAgenda(ativos.filter((x:any)=>x.data_agendada && x.data_agendada>=hoje).slice(0,4));
    setLoading(false);
  })()},[]);

  const saudacao=useMemo(()=>{const h=new Date().getHours();return h<12?"Bom dia!":h<18?"Boa tarde!":"Boa noite!";},[]);
  const nome=(x:any)=>x.clientes?.nome_fantasia||x.clientes?.nome||"Cliente";
  const destino=(x:any)=>x.ordens_servico?.[0]?.id?`/os/${x.ordens_servico[0].id}`:"/servicos";

  return <div className="page">
    <header className="topbar"><div className="brand"><Image src="/icons/rm-assist-logo.png" alt="RM Assist" width={50} height={50} className="brand-logo"/><div><h1>RM Assist</h1><p>Gestão de serviços</p></div></div></header>

    <section className="hero"><div><p className="eyebrow">PAINEL</p><h2>{saudacao}</h2><p>Seus atendimentos em um só lugar.</p></div><Link href="/chamados/novo" className="primary-button">+ Novo chamado</Link></section>
    {erro&&<div className="error-box">{erro}</div>}

    {loading?<p className="muted">Atualizando painel...</p>:<>
      {s.atrasados>0&&<Link href="/agenda" className="error-box" style={{display:"block",textDecoration:"none",marginBottom:14}}><strong>{s.atrasados} atendimento{s.atrasados===1?"":"s"} atrasado{s.atrasados===1?"":"s"}</strong><br/><span>Toque para revisar a agenda.</span></Link>}

      <div className="stat-grid">
        <Link href="/agenda" className="stat-card" style={{textDecoration:"none"}}><strong>{s.hoje}</strong><span>Serviços hoje</span></Link>
        <Link href="/servicos" className="stat-card" style={{textDecoration:"none"}}><strong>{s.abertos}</strong><span>Chamados abertos</span></Link>
        <Link href="/servicos" className="stat-card" style={{textDecoration:"none"}}><strong>{s.andamento}</strong><span>OS em andamento</span></Link>
        <Link href="/financeiro" className="stat-card" style={{textDecoration:"none"}}><strong>{moeda(s.faturamentoMes)}</strong><span>Faturado no mês</span></Link>
      </div>

      <div className="section-heading"><h3>Próximos serviços</h3><Link href="/agenda">Ver agenda</Link></div>
      {agenda.length===0?<p className="muted">Nenhum serviço agendado.</p>:<div className="agenda-list">{agenda.map(x=><Link href={destino(x)} className="agenda-card" key={x.id}><div className="time-pill"><strong>{fmtData(x.data_agendada)}</strong><span>{x.hora_agendada?.slice(0,5)||"—"}</span></div><div className="agenda-main"><strong>{nome(x)}</strong><span>{x.tipo_servico}</span></div><span className="status-badge">{x.status==="em_atendimento"?"em atendimento":x.status}</span></Link>)}</div>}

      <div className="section-heading"><h3>Acesso rápido</h3></div>
      <div className="stat-grid">
       <Link href="/clientes" className="stat-card" style={{textDecoration:"none"}}><strong>{s.clientes}</strong><span>Clientes</span></Link>
       <Link href="/equipamentos" className="stat-card" style={{textDecoration:"none"}}><strong>❄</strong><span>Equipamentos</span></Link>
       <Link href="/financeiro" className="stat-card" style={{textDecoration:"none"}}><strong>R$</strong><span>Financeiro</span></Link>
       <Link href="/historico" className="stat-card" style={{textDecoration:"none"}}><strong>{s.concluidos}</strong><span>Histórico</span></Link>
      </div>

      <section className="quick-card"><div><p className="eyebrow">HISTÓRICO</p><h3>{s.concluidos} OS concluída{s.concluidos===1?"":"s"}</h3><p>Consulte atendimentos anteriores e relatórios.</p></div><Link href="/historico" className="round-plus">›</Link></section>
    </>}
  </div>
}
