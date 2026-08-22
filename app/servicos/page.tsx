"use client";
import Link from "next/link";
import {Suspense,useEffect,useMemo,useState} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import {getSupabase} from "@/lib/supabase";
import {fmtData} from "@/lib/domain";
import CancelarExcluirOS from "@/components/CancelarExcluirOS";
import CancelarChamado from "@/components/CancelarChamado";

function ServicosContent(){
 const r=useRouter();const sp=useSearchParams();const filtro=sp.get("filtro")||"";
 const [ch,setCh]=useState<any[]>([]),[ord,setOrd]=useState<any[]>([]);
 const [erro,setErro]=useState(""),[iniciando,setIniciando]=useState(""),[mostrarEncerrados,setMostrarEncerrados]=useState(false),[q,setQ]=useState("");

 async function load(){
  const s=getSupabase();if(!s)return setErro("Supabase não configurado.");
  const [{data:c,error:e1},{data:o,error:e2}]=await Promise.all([
   s.from("chamados").select("*, clientes(nome,nome_fantasia,whatsapp,telefone), locais(nome,endereco,numero,bairro,cidade,estado,cep), chamado_equipamentos(equipamento_id)").order("created_at",{ascending:false}),
   s.from("ordens_servico").select("*, clientes(nome,nome_fantasia), ordem_servico_equipamentos(equipamento_id)").order("created_at",{ascending:false})
  ]);
  if(e1||e2)setErro(e1?.message||e2?.message||"");else{setCh(c||[]);setOrd(o||[])}
 }

 useEffect(()=>{load()},[]);
 const nome=(x:any)=>x.clientes?.nome_fantasia||x.clientes?.nome||"Cliente";
 function endereco(x:any){const l=x.locais;if(!l?.endereco)return "";return [l.endereco,l.numero,l.bairro,l.cidade,l.estado,l.cep].filter(Boolean).join(", ")}
 function wazeUrl(x:any){const e=endereco(x);return e?`https://www.waze.com/ul?q=${encodeURIComponent(e)}&navigate=yes`:""}
 function whatsappUrl(x:any){let n=String(x.clientes?.whatsapp||x.clientes?.telefone||"").replace(/\D/g,"");if(!n)return "";if(!n.startsWith("55")&&(n.length===10||n.length===11))n=`55${n}`;return `https://wa.me/${n}`}
 const termo=q.trim().toLowerCase();
 const chamados=useMemo(()=>ch.filter((x:any)=>{
  if(filtro==="pausados")return false;
  if(filtro==="aguardando_agendamento"&&x.data_agendada)return false;
  if(!mostrarEncerrados&&["concluido","cancelado"].includes(x.status))return false;
  const texto=[x.numero,nome(x),x.descricao,x.tipo_servico,x.prioridade,x.status,endereco(x)].filter(Boolean).join(" ").toLowerCase();
  return !termo||texto.includes(termo);
 }),[ch,mostrarEncerrados,termo,filtro]);
 const oss=useMemo(()=>ord.filter((x:any)=>{
  if(filtro==="aguardando_agendamento")return false;
  if(filtro==="pausados"&&x.status!=="pausada")return false;
  if(!mostrarEncerrados&&x.status==="concluida")return false;
  const texto=[x.numero,nome(x),x.tipo_servico,x.status,x.motivo_pausa].filter(Boolean).join(" ").toLowerCase();
  return !termo||texto.includes(termo);
 }),[ord,mostrarEncerrados,termo,filtro]);
 const rotaOS=(o:any)=>(o.ordem_servico_equipamentos?.length||0)>1?`/os/${o.id}/equipamentos`:`/os/${o.id}`;
 const ativosCh=ch.filter((x:any)=>!["concluido","cancelado"].includes(x.status)).length;
 const ativosOs=ord.filter((x:any)=>x.status!=="concluida").length;
 const tituloFiltro=filtro==="pausados"?"Atendimentos pausados":filtro==="aguardando_agendamento"?"Aguardando agendamento":"";

 async function copiar(s:any,chamado:any,osId:string){
  let {data,error}=await s.from("chamado_equipamentos").select("equipamento_id").eq("chamado_id",chamado.id);if(error)throw error;
  // Chamados de clientes novos muitas vezes são criados antes do cadastro dos aparelhos.
  // Se ainda não havia aparelhos vinculados, procura os equipamentos ativos cadastrados depois,
  // priorizando o mesmo local do atendimento para não misturar aparelhos de outros endereços.
  if(!(data||[]).length){
   let busca=s.from("equipamentos").select("id").eq("cliente_id",chamado.cliente_id).eq("ativo",true);
   if(chamado.local_id)busca=busca.eq("local_id",chamado.local_id);
   const {data:novos,error:eNovos}=await busca;if(eNovos)throw eNovos;
   data=(novos||[]).map((x:any)=>({equipamento_id:x.id}));
   if(data.length){const {error:eCh}=await s.from("chamado_equipamentos").upsert(data.map((x:any)=>({chamado_id:chamado.id,equipamento_id:x.equipamento_id})),{onConflict:"chamado_id,equipamento_id"});if(eCh)throw eCh}
  }
  if((data||[]).length){const {error:e}=await s.from("ordem_servico_equipamentos").upsert((data||[]).map((x:any)=>({ordem_servico_id:osId,equipamento_id:x.equipamento_id})),{onConflict:"ordem_servico_id,equipamento_id"});if(e)throw e}
  return data||[];
 }

 async function iniciar(c:any){
  if(iniciando)return;const s=getSupabase();if(!s)return;setIniciando(c.id);setErro("");
  try{
   const {data:ex,error:be}=await s.from("ordens_servico").select("id,status").eq("chamado_id",c.id).maybeSingle();if(be)throw be;
   if(ex?.id){const rels=await copiar(s,c,ex.id);if(c.status!=="em_atendimento"){const {error:e}=await s.from("chamados").update({status:"em_atendimento",updated_at:new Date().toISOString()}).eq("id",c.id);if(e)throw e}r.push(rels.length>1?`/os/${ex.id}/equipamentos`:`/os/${ex.id}`);r.refresh();return}
   const rels=c.chamado_equipamentos||[];const {data:os,error}=await s.from("ordens_servico").insert({chamado_id:c.id,cliente_id:c.cliente_id,local_id:c.local_id||null,equipamento_id:rels.length===1?rels[0].equipamento_id:(c.equipamento_id||null),tipo_servico:c.tipo_servico,status:"em_atendimento",data_inicio:new Date().toISOString()}).select("id").single();if(error)throw error;
   const copiados=await copiar(s,c,os.id);const {error:e2}=await s.from("chamados").update({status:"em_atendimento",updated_at:new Date().toISOString()}).eq("id",c.id);if(e2)throw e2;r.push(copiados.length>1?`/os/${os.id}/equipamentos`:`/os/${os.id}`);r.refresh();
  }catch(e:any){setErro(e?.message||"Não foi possível iniciar o atendimento.")}finally{setIniciando("")}
 }

 return <div className="page">
  <header className="simple-header"><div><p className="eyebrow">RM ASSIST</p><h1>{tituloFiltro||"Serviços"}</h1><p>{filtro==="pausados"?"Ordens de serviço aguardando continuidade.":filtro==="aguardando_agendamento"?"Chamados abertos sem data definida.":"Chamados e ordens de serviço."}</p></div><Link href="/chamados/novo" className="primary-button">+ Novo chamado</Link></header>
  {filtro&&<div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}><Link href="/servicos" className="secondary-button">Ver todos os serviços</Link></div>}
  {!filtro&&<div className="stat-grid" style={{marginBottom:14}}><article className="stat-card"><strong>{ativosCh}</strong><span>Chamados ativos</span></article><article className="stat-card"><strong>{ativosOs}</strong><span>OS em andamento</span></article></div>}
  <input className="search-input" placeholder="Buscar cliente, número, serviço, status..." value={q} onChange={e=>setQ(e.target.value)}/>
  {!filtro&&<div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}><button className="secondary-button" onClick={()=>setMostrarEncerrados(!mostrarEncerrados)}>{mostrarEncerrados?"Ocultar encerrados":"Ver encerrados"}</button></div>}
  {erro&&<div className="error-box">{erro}</div>}

  {filtro!=="pausados"&&<><h3 className="form-section-title">Chamados</h3>{chamados.length===0?<p className="muted">Nenhum chamado encontrado.</p>:<div className="service-list">{chamados.map(c=>{const waze=wazeUrl(c),whats=whatsappUrl(c),end=endereco(c);return <article className="service-card" key={c.id}><div style={{flex:1,minWidth:0}}><span className={`status-chip ${c.status}`}>{String(c.status).replace("_"," ")}</span><h3>Chamado #{String(c.numero).padStart(4,"0")} — {nome(c)}</h3><p>{c.descricao}</p><small>{c.data_agendada?`${fmtData(c.data_agendada)} • ${c.hora_agendada?.slice(0,5)||""}`:"Sem agendamento"} • {c.prioridade}{c.chamado_equipamentos?.length?` • ${c.chamado_equipamentos.length} equipamentos`:""}</small>{end&&<small style={{display:"block",marginTop:4}}>{end}</small>}</div><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>{["aberto","agendado","em_atendimento"].includes(c.status)&&<button className="primary-button" disabled={!!iniciando} onClick={()=>iniciar(c)}>{iniciando===c.id?"Atualizando...":c.status==="em_atendimento"?"Abrir atendimento":"Iniciar atendimento"}</button>}{["aberto","agendado"].includes(c.status)&&<Link href={`/chamados/${c.id}/editar`} className="secondary-button">Editar</Link>}{waze&&<a href={waze} target="_blank" rel="noopener noreferrer" className="secondary-button">Trajeto</a>}{whats&&<a href={whats} target="_blank" rel="noopener noreferrer" className="secondary-button">WhatsApp</a>}{["aberto","agendado"].includes(c.status)&&<CancelarChamado chamadoId={c.id} status={c.status} onCancelado={()=>setCh(atual=>atual.map(x=>x.id===c.id?{...x,status:"cancelado"}:x))}/>}</div></article>})}</div>}</>}

  {filtro!=="aguardando_agendamento"&&<><h3 className="form-section-title">Ordens de serviço</h3>{oss.length===0?<p className="muted">Nenhuma OS encontrada.</p>:<div className="service-list">{oss.map(o=><article className="service-card" key={o.id}><Link href={rotaOS(o)} style={{textDecoration:"none",color:"inherit",flex:1,minWidth:0}}><div><span className={`status-chip ${o.status}`}>{String(o.status).replace("_"," ")}</span><h3>OS #{String(o.numero).padStart(4,"0")} — {nome(o)}</h3><p>{o.tipo_servico||"Serviço"}</p>{o.status==="pausada"&&o.motivo_pausa&&<small style={{display:"block",marginTop:4}}>Motivo da pausa: {o.motivo_pausa}</small>}{o.ordem_servico_equipamentos?.length>0&&<small>{o.ordem_servico_equipamentos.length} equipamento{o.ordem_servico_equipamentos.length===1?"":"s"} nesta OS</small>}</div></Link><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><Link href={rotaOS(o)} className="primary-button">Abrir OS</Link><CancelarExcluirOS osId={o.id} status={o.status} chamadoId={o.chamado_id}/></div></article>)}</div>}</>}
 </div>
}

export default function Servicos(){return <Suspense fallback={<div className="page">Carregando serviços...</div>}><ServicosContent/></Suspense>}