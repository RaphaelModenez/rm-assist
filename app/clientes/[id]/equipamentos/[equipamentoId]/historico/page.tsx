"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {useParams} from "next/navigation";
import {getSupabase} from "@/lib/supabase";

export default function HistoricoEquipamento(){
 const {id,equipamentoId}=useParams<{id:string,equipamentoId:string}>();
 const [eq,setEq]=useState<any>(); const [cliente,setCliente]=useState<any>();
 const [itens,setItens]=useState<any[]>([]); const [erro,setErro]=useState(""); const [loading,setLoading]=useState(true);

 useEffect(()=>{(async()=>{
  const s=getSupabase(); if(!s){setErro("Supabase não configurado.");setLoading(false);return}
  const [{data:equip,error:e1},{data:cli,error:e2}]=await Promise.all([
   s.from("equipamentos").select("*").eq("id",equipamentoId).eq("cliente_id",id).single(),
   s.from("clientes").select("id,nome,nome_fantasia").eq("id",id).single()
  ]);
  if(e1||e2){setErro(e1?.message||e2?.message||"");setLoading(false);return}
  setEq(equip); setCliente(cli);

  const {data:rels,error:e3}=await s.from("ordem_servico_equipamentos").select("ordem_servico_id").eq("equipamento_id",equipamentoId);
  if(e3){setErro(e3.message);setLoading(false);return}
  const osIds=(rels||[]).map((x:any)=>x.ordem_servico_id);

  const {data:osDiretas,error:e4}=await s.from("ordens_servico").select("id").eq("equipamento_id",equipamentoId);
  if(e4){setErro(e4.message);setLoading(false);return}
  for(const x of osDiretas||[]) if(!osIds.includes(x.id)) osIds.push(x.id);

  if(!osIds.length){setItens([]);setLoading(false);return}

  const [{data:oss,error:e5},{data:execs,error:e6}]=await Promise.all([
   s.from("ordens_servico").select("id,numero,status,tipo_servico,data_inicio,data_fim,valor_servico,forma_pagamento").in("id",osIds).order("data_inicio",{ascending:false}),
   s.from("os_equipamento_execucao").select("*").eq("equipamento_id",equipamentoId).in("ordem_servico_id",osIds)
  ]);
  if(e5||e6){setErro(e5?.message||e6?.message||"");setLoading(false);return}

  setItens((oss||[]).map((o:any)=>({...o,execucao:(execs||[]).find((x:any)=>x.ordem_servico_id===o.id)||null})));
  setLoading(false);
 })()},[id,equipamentoId]);

 const concluidas=useMemo(()=>itens.filter(x=>x.status==="concluida").length,[itens]);
 const data=(v:any)=>v?new Date(v).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"}):"—";

 if(erro)return <div className="page"><div className="error-box">{erro}</div></div>;
 if(loading)return <div className="page">Carregando histórico...</div>;

 return <div className="page">
  <header className="simple-header">
   <div><p className="eyebrow">HISTÓRICO TÉCNICO</p><h1>{eq?.ambiente||eq?.tipo||"Equipamento"}</h1><p>{cliente?.nome_fantasia||cliente?.nome} • {[eq?.marca,eq?.modelo,eq?.capacidade_btu?`${eq.capacidade_btu} BTU`:null].filter(Boolean).join(" • ")}</p></div>
   <Link href={`/clientes/${id}`} className="secondary-button">Voltar</Link>
  </header>

  <div className="stat-grid" style={{marginBottom:18}}>
   <article className="stat-card"><strong>{itens.length}</strong><span>Atendimentos</span></article>
   <article className="stat-card"><strong>{concluidas}</strong><span>Concluídos</span></article>
  </div>

  {itens.length===0?<section className="empty-state"><h2>Sem histórico ainda</h2><p>Os próximos atendimentos deste equipamento aparecerão aqui automaticamente.</p></section>:
  <div className="service-list">{itens.map((o:any)=>{const ex=o.execucao||{};return <article className="service-card" key={o.id} style={{alignItems:"flex-start"}}>
   <div style={{flex:1,minWidth:0}}>
    <span className={`status-chip ${o.status}`}>{String(o.status).replace("_"," ")}</span>
    <h3>OS #{String(o.numero).padStart(4,"0")} — {o.tipo_servico||"Serviço"}</h3>
    <small>{data(o.data_inicio)}{o.data_fim?` → ${data(o.data_fim)}`:""}</small>
    <div style={{marginTop:12,display:"grid",gap:8}}>
     {ex.diagnostico&&<p><b>Diagnóstico:</b> {ex.diagnostico}</p>}
     {ex.servico_executado&&<p><b>Serviço executado:</b> {ex.servico_executado}</p>}
     {ex.situacao_final&&<p><b>Situação final:</b> {ex.situacao_final}</p>}
     {ex.recomendacoes&&<p><b>Recomendações:</b> {ex.recomendacoes}</p>}
     {ex.pendencias&&<p><b>Pendências:</b> {ex.pendencias}</p>}
    </div>
   </div>
   <Link href={`/os/${o.id}/relatorio`} className="primary-button">Relatório</Link>
  </article>})}</div>}
 </div>
}
