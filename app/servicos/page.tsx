"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {getSupabase} from "@/lib/supabase";
import {fmtData} from "@/lib/domain";
import CancelarExcluirOS from "@/components/CancelarExcluirOS";
import CancelarChamado from "@/components/CancelarChamado";

export default function Servicos(){
 const r=useRouter();const [ch,setCh]=useState<any[]>([]),[ord,setOrd]=useState<any[]>([]);
 const [erro,setErro]=useState(""),[iniciando,setIniciando]=useState(""),[mostrarEncerrados,setMostrarEncerrados]=useState(false),[q,setQ]=useState("");

 async function load(){
  const s=getSupabase();if(!s)return setErro("Supabase não configurado.");
  const [{data:c,error:e1},{data:o,error:e2}]=await Promise.all([
   s.from("chamados").select("*, clientes(nome,nome_fantasia), chamado_equipamentos(equipamento_id)").order("created_at",{ascending:false}),
   s.from("ordens_servico").select("*, clientes(nome,nome_fantasia), ordem_servico_equipamentos(equipamento_id)").order("created_at",{ascending:false})
  ]);
  if(e1||e2)setErro(e1?.message||e2?.message||"");else{setCh(c||[]);setOrd(o||[])}
 }

 useEffect(()=>{load()},[]);
 const nome=(x:any)=>x.clientes?.nome_fantasia||x.clientes?.nome||"Cliente";
 const termo=q.trim().toLowerCase();
 const chamados=useMemo(()=>ch.filter((x:any)=>{
  if(!mostrarEncerrados&&["concluido","cancelado"].includes(x.status))return false;
  const texto=[x.numero,nome(x),x.descricao,x.tipo_servico,x.prioridade,x.status].filter(Boolean).join(" ").toLowerCase();
  return !termo||texto.includes(termo);
 }),[ch,mostrarEncerrados,termo]);
 const oss=useMemo(()=>ord.filter((x:any)=>{
  if(!mostrarEncerrados&&x.status==="concluida")return false;
  const texto=[x.numero,nome(x),x.tipo_servico,x.status].filter(Boolean).join(" ").toLowerCase();
  return !termo||texto.includes(termo);
 }),[ord,mostrarEncerrados,termo]);
 const rotaOS=(o:any)=>(o.ordem_servico_equipamentos?.length||0)>1?`/os/${o.id}/equipamentos`:`/os/${o.id}`;
 const ativosCh=ch.filter((x:any)=>!["concluido","cancelado"].includes(x.status)).length;
 const ativosOs=ord.filter((x:any)=>x.status!=="concluida").length;

 async function copiar(s:any,chamadoId:string,osId:string){
  const {data,error}=await s.from("chamado_equipamentos").select("equipamento_id").eq("chamado_id",chamadoId);
  if(error)throw error;
  if((data||[]).length){
   const {error:e}=await s.from("ordem_servico_equipamentos").upsert((data||[]).map((x:any)=>({ordem_servico_id:osId,equipamento_id:x.equipamento_id})),{onConflict:"ordem_servico_id,equipamento_id"});
   if(e)throw e;
  }
  return data||[];
 }

 async function iniciar(c:any){
  if(iniciando)return;
  const s=getSupabase();if(!s)return;
  setIniciando(c.id);setErro("");
  try{
   const {data:ex,error:be}=await s.from("ordens_servico").select("id,status").eq("chamado_id",c.id).maybeSingle();
   if(be)throw be;
   if(ex?.id){
    const rels=await copiar(s,c.id,ex.id);
    if(c.status!=="em_atendimento"){
     const {error:e}=await s.from("chamados").update({status:"em_atendimento",updated_at:new Date().toISOString()}).eq("id",c.id);
     if(e)throw e;
    }
    r.push(rels.length>1?`/os/${ex.id}/equipamentos`:`/os/${ex.id}`);r.refresh();return;
   }
   const rels=c.chamado_equipamentos||[];
   const {data:os,error}=await s.from("ordens_servico").insert({chamado_id:c.id,cliente_id:c.cliente_id,local_id:c.local_id||null,equipamento_id:rels.length===1?rels[0].equipamento_id:(c.equipamento_id||null),tipo_servico:c.tipo_servico,status:"em_atendimento",data_inicio:new Date().toISOString()}).select("id").single();
   if(error)throw error;
   const copiados=await copiar(s,c.id,os.id);
   const {error:e2}=await s.from("chamados").update({status:"em_atendimento",updated_at:new Date().toISOString()}).eq("id",c.id);
   if(e2)throw e2;
   r.push(copiados.length>1?`/os/${os.id}/equipamentos`:`/os/${os.id}`);r.refresh();
  }catch(e:any){setErro(e?.message||"Não foi possível iniciar o atendimento.");}finally{setIniciando("");}
 }

 return <div className="page">
  <header className="simple-header"><div><p className="eyebrow">RM ASSIST</p><h1>Serviços</h1><p>Chamados e ordens de serviço.</p></div><Link href="/chamados/novo" className="primary-button">+ Novo chamado</Link></header>

  <div className="stat-grid" style={{marginBottom:14}}>
   <article className="stat-card"><strong>{ativosCh}</strong><span>Chamados ativos</span></article>
   <article className="stat-card"><strong>{ativosOs}</strong><span>OS em andamento</span></article>
  </div>

  <input className="search-input" placeholder="Buscar cliente, número, serviço, status..." value={q} onChange={e=>setQ(e.target.value)}/>
  <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}><button className="secondary-button" onClick={()=>setMostrarEncerrados(!mostrarEncerrados)}>{mostrarEncerrados?"Ocultar encerrados":"Ver encerrados"}</button></div>
  {erro&&<div className="error-box">{erro}</div>}

  <h3 className="form-section-title">Chamados</h3>
  {chamados.length===0?<p className="muted">Nenhum chamado encontrado.</p>:<div className="service-list">{chamados.map(c=><article className="service-card" key={c.id}>
   <div><span className={`status-chip ${c.status}`}>{String(c.status).replace("_"," ")}</span><h3>Chamado #{String(c.numero).padStart(4,"0")} — {nome(c)}</h3><p>{c.descricao}</p><small>{c.data_agendada?`${fmtData(c.data_agendada)} • ${c.hora_agendada?.slice(0,5)||""}`:"Sem agendamento"} • {c.prioridade}{c.chamado_equipamentos?.length?` • ${c.chamado_equipamentos.length} equipamentos`:""}</small></div>
   <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
    {["aberto","agendado","em_atendimento"].includes(c.status)&&<button className="primary-button" disabled={!!iniciando} onClick={()=>iniciar(c)}>{iniciando===c.id?"Abrindo...":c.status==="em_atendimento"?"Abrir atendimento":"Iniciar atendimento"}</button>}
    {["aberto","agendado"].includes(c.status)&&<CancelarChamado chamadoId={c.id} status={c.status} onCancelado={()=>setCh(atual=>atual.map(x=>x.id===c.id?{...x,status:"cancelado"}:x))}/>} 
   </div>
  </article>)}</div>}

  <h3 className="form-section-title">Ordens de serviço</h3>
  {oss.length===0?<p className="muted">Nenhuma OS encontrada.</p>:<div className="service-list">{oss.map(o=><article className="service-card" key={o.id}>
   <Link href={rotaOS(o)} style={{textDecoration:"none",color:"inherit",flex:1,minWidth:0}}><div><span className={`status-chip ${o.status}`}>{String(o.status).replace("_"," ")}</span><h3>OS #{String(o.numero).padStart(4,"0")} — {nome(o)}</h3><p>{o.tipo_servico||"Serviço"}</p>{o.ordem_servico_equipamentos?.length>0&&<small>{o.ordem_servico_equipamentos.length} equipamento{o.ordem_servico_equipamentos.length===1?"":"s"} nesta OS</small>}</div></Link>
   <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><Link href={rotaOS(o)} className="primary-button">Abrir OS</Link><CancelarExcluirOS osId={o.id} status={o.status} chamadoId={o.chamado_id}/></div>
  </article>)}</div>}
 </div>
}
