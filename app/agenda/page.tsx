"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {getSupabase} from "@/lib/supabase";
import {fmtData} from "@/lib/domain";
import CancelarChamado from "@/components/CancelarChamado";

function dataLocalISO(d=new Date()){
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

export default function Agenda(){
  const [ch,setCh]=useState<any[]>([]);
  const [mostrarPassados,setMostrarPassados]=useState(false);
  const [erro,setErro]=useState("");
  const [loading,setLoading]=useState(true);
  const [removendo,setRemovendo]=useState("");
  const [q,setQ]=useState("");

  async function carregar(){
    const s=getSupabase(); if(!s){setErro("Supabase não configurado.");setLoading(false);return}
    const {data,error}=await s.from("chamados").select("*, clientes(nome,nome_fantasia), ordens_servico(id,status), chamado_equipamentos(equipamento_id)").not("data_agendada","is",null).order("data_agendada",{ascending:true}).order("hora_agendada",{ascending:true});
    if(error)setErro(error.message); else setCh(data||[]);
    setLoading(false);
  }

  useEffect(()=>{carregar()},[]);

  const hoje=dataLocalISO();
  const d7=new Date();d7.setDate(d7.getDate()+7);const seteDias=dataLocalISO(d7);
  const ativos=useMemo(()=>ch.filter((x:any)=>!["concluido","cancelado"].includes(x.status)),[ch]);
  const passados=useMemo(()=>ativos.filter((x:any)=>x.data_agendada<hoje),[ativos,hoje]);
  const hojeQtd=useMemo(()=>ativos.filter((x:any)=>x.data_agendada===hoje).length,[ativos,hoje]);
  const proximos7=useMemo(()=>ativos.filter((x:any)=>x.data_agendada>=hoje&&x.data_agendada<=seteDias).length,[ativos,hoje,seteDias]);
  const termo=q.trim().toLowerCase();
  const lista=useMemo(()=>ativos.filter((x:any)=>{
    if(!mostrarPassados&&x.data_agendada<hoje)return false;
    const nome=x.clientes?.nome_fantasia||x.clientes?.nome||"Cliente";
    const texto=[nome,x.tipo_servico,x.descricao,x.prioridade,x.status,x.data_agendada].filter(Boolean).join(" ").toLowerCase();
    return !termo||texto.includes(termo);
  }),[ativos,mostrarPassados,hoje,termo]);

  const nome=(x:any)=>x.clientes?.nome_fantasia||x.clientes?.nome||"Cliente";
  const destino=(x:any)=>x.ordens_servico?.[0]?.id?`/os/${x.ordens_servico[0].id}`:"/servicos";
  function rotuloData(x:any){if(x.data_agendada===hoje)return "Hoje";if(x.data_agendada<hoje)return "Atrasado";return fmtData(x.data_agendada);}

  async function excluirAgendamento(x:any){
    if(removendo)return;
    if(x.status==="em_atendimento")return setErro("Este atendimento já foi iniciado. Altere a OS em vez de excluir o agendamento.");
    if(!confirm(`Excluir o agendamento de ${nome(x)}?\n\nO chamado será mantido, mas ficará sem data e horário.`))return;
    const s=getSupabase();if(!s)return;
    setRemovendo(x.id);setErro("");
    const novoStatus=x.status==="agendado"?"aberto":x.status;
    const {error}=await s.from("chamados").update({data_agendada:null,hora_agendada:null,status:novoStatus,updated_at:new Date().toISOString()}).eq("id",x.id);
    setRemovendo("");
    if(error)return setErro(error.message);
    setCh(atual=>atual.filter(a=>a.id!==x.id));
  }

  return <div className="page">
    <header className="simple-header"><div><p className="eyebrow">RM ASSIST</p><h1>Agenda</h1><p>Atendimentos agendados.</p></div><Link href="/chamados/novo" className="primary-button">+ Agendar</Link></header>

    <div className="stat-grid" style={{marginBottom:14}}>
      <article className="stat-card"><strong>{hojeQtd}</strong><span>Hoje</span></article>
      <article className="stat-card"><strong>{proximos7}</strong><span>Próximos 7 dias</span></article>
      <article className="stat-card"><strong>{passados.length}</strong><span>Atrasados</span></article>
    </div>

    <input className="search-input" placeholder="Buscar cliente, serviço, prioridade..." value={q} onChange={e=>setQ(e.target.value)}/>
    <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
      <small className="muted">{lista.length} agendamento{lista.length===1?"":"s"}</small>
      <button className="secondary-button" onClick={()=>setMostrarPassados(!mostrarPassados)}>{mostrarPassados?"Ocultar atrasados":`Ver atrasados${passados.length?` (${passados.length})`:""}`}</button>
    </div>

    {erro&&<div className="error-box">{erro}</div>}
    {loading?<p className="muted">Carregando agenda...</p>:lista.length===0?<section className="empty-state"><div className="empty-icon">▣</div><h2>Nenhum agendamento encontrado</h2><p>Ajuste a busca ou cadastre um novo atendimento.</p></section>:
      <div className="timeline">{lista.map(x=><article className="timeline-item" key={x.id}>
        <div className="timeline-date"><strong>{rotuloData(x)}</strong><span>{x.hora_agendada?.slice(0,5)||"—"}</span></div>
        <div style={{minWidth:0,flex:1}}>
          <h3>{nome(x)}</h3><p>{x.tipo_servico}</p><small>{x.descricao}</small>
          {(x.chamado_equipamentos?.length||0)>0&&<small style={{display:"block",marginTop:4}}>{x.chamado_equipamentos.length} equipamento{x.chamado_equipamentos.length===1?"":"s"}</small>}
          {x.status==="em_atendimento"&&<small style={{display:"block",marginTop:4,fontWeight:700}}>Atendimento em andamento</small>}
          {x.data_agendada<hoje&&<small style={{display:"block",marginTop:4,fontWeight:700}}>Agendado para {fmtData(x.data_agendada)}</small>}
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}>
            <Link href={destino(x)} className="primary-button">{x.ordens_servico?.[0]?.id?"Abrir OS":"Abrir chamado"}</Link>
            {x.status!=="em_atendimento"&&<Link href={`/chamados/${x.id}/editar`} className="secondary-button">Editar agendamento</Link>}
            {x.status!=="em_atendimento"&&<button type="button" className="secondary-button" disabled={!!removendo} onClick={()=>excluirAgendamento(x)} style={{color:"#b42318",borderColor:"#f3b8b2"}}>{removendo===x.id?"Excluindo...":"Excluir agendamento"}</button>}
            {x.status!=="em_atendimento"&&<CancelarChamado chamadoId={x.id} status={x.status} onCancelado={()=>setCh(atual=>atual.map(a=>a.id===x.id?{...a,status:"cancelado"}:a))}/>} 
          </div>
        </div>
      </article>)}</div>}
  </div>
}
