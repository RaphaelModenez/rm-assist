"use client";
import {Suspense,useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {getSupabase} from "@/lib/supabase";
import {fmtData} from "@/lib/domain";
import CancelarChamado from "@/components/CancelarChamado";

function dataLocalISO(d=new Date()){
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function isoDia(y:number,m:number,d:number){return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`}
const meses=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const semana=["D","S","T","Q","Q","S","S"];

function AgendaContent(){
  const sp=useSearchParams();
  const filtro=sp.get("filtro")||"";
  const [ch,setCh]=useState<any[]>([]);
  const [mostrarPassados,setMostrarPassados]=useState(filtro==="atrasados");
  const [erro,setErro]=useState("");
  const [loading,setLoading]=useState(true);
  const [removendo,setRemovendo]=useState("");
  const [q,setQ]=useState("");
  const agora=new Date();
  const [mesVisivel,setMesVisivel]=useState(new Date(agora.getFullYear(),agora.getMonth(),1));
  const [diaSelecionado,setDiaSelecionado]=useState<string|null>(null);

  async function carregar(){
    const s=getSupabase(); if(!s){setErro("Supabase não configurado.");setLoading(false);return}
    const {data,error}=await s.from("chamados").select("*, clientes(nome,nome_fantasia,whatsapp,telefone), locais(nome,endereco,numero,bairro,cidade,estado,cep), ordens_servico(id,status), chamado_equipamentos(equipamento_id)").not("data_agendada","is",null).order("data_agendada",{ascending:true}).order("hora_agendada",{ascending:true});
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
  const qtdPorDia=useMemo(()=>ativos.reduce((acc:any,x:any)=>{acc[x.data_agendada]=(acc[x.data_agendada]||0)+1;return acc},{}),[ativos]);
  const termo=q.trim().toLowerCase();
  const lista=useMemo(()=>ativos.filter((x:any)=>{
    if(filtro==="atrasados"&&!(x.data_agendada<hoje))return false;
    if(diaSelecionado&&x.data_agendada!==diaSelecionado)return false;
    if(filtro!=="atrasados"&&!diaSelecionado&&!mostrarPassados&&x.data_agendada<hoje)return false;
    const nome=x.clientes?.nome_fantasia||x.clientes?.nome||"Cliente";
    const texto=[nome,x.tipo_servico,x.descricao,x.prioridade,x.status,x.data_agendada,x.locais?.endereco,x.locais?.cidade].filter(Boolean).join(" ").toLowerCase();
    return !termo||texto.includes(termo);
  }),[ativos,mostrarPassados,hoje,termo,diaSelecionado,filtro]);

  const calendario=useMemo(()=>{
    const y=mesVisivel.getFullYear(),m=mesVisivel.getMonth();
    const primeiro=new Date(y,m,1).getDay();
    const total=new Date(y,m+1,0).getDate();
    const anterior=new Date(y,m,0).getDate();
    const cells:any[]=[];
    for(let i=0;i<42;i++){
      let dia,mes=m,ano=y,fora=false;
      if(i<primeiro){dia=anterior-primeiro+i+1;mes=m-1;fora=true}
      else if(i>=primeiro+total){dia=i-primeiro-total+1;mes=m+1;fora=true}
      else dia=i-primeiro+1;
      if(mes<0){mes=11;ano--} if(mes>11){mes=0;ano++}
      cells.push({dia,iso:isoDia(ano,mes,dia),fora});
    }
    return cells;
  },[mesVisivel]);

  const nome=(x:any)=>x.clientes?.nome_fantasia||x.clientes?.nome||"Cliente";
  const destino=(x:any)=>x.ordens_servico?.[0]?.id?`/os/${x.ordens_servico[0].id}`:"/servicos";
  function rotuloData(x:any){if(x.data_agendada===hoje)return "Hoje";if(x.data_agendada<hoje)return "Atrasado";return fmtData(x.data_agendada);}
  function mudarMes(delta:number){setMesVisivel(d=>new Date(d.getFullYear(),d.getMonth()+delta,1));setDiaSelecionado(null)}
  function irHoje(){const d=new Date();setMesVisivel(new Date(d.getFullYear(),d.getMonth(),1));setDiaSelecionado(hoje)}
  function endereco(x:any){
    const l=x.locais;
    if(!l?.endereco)return "";
    return [l.endereco,l.numero,l.bairro,l.cidade,l.estado,l.cep].filter(Boolean).join(", ");
  }
  function wazeUrl(x:any){
    const e=endereco(x); return e?`https://www.waze.com/ul?q=${encodeURIComponent(e)}&navigate=yes`:"";
  }
  function whatsappUrl(x:any){
    let n=String(x.clientes?.whatsapp||x.clientes?.telefone||"").replace(/\D/g,"");
    if(!n)return "";
    if(!n.startsWith("55")&&(n.length===10||n.length===11))n=`55${n}`;
    return `https://wa.me/${n}`;
  }

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
    <header className="simple-header"><div><p className="eyebrow">RM ASSIST</p><h1>{filtro==="atrasados"?"Atendimentos atrasados":"Agenda"}</h1><p>{filtro==="atrasados"?"Serviços com data vencida e ainda pendentes.":"Atendimentos agendados."}</p></div><Link href="/chamados/novo" className="primary-button">+ Agendar</Link></header>

    {filtro==="atrasados"&&<div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}><Link href="/agenda" className="secondary-button">Ver agenda completa</Link></div>}

    {filtro!=="atrasados"&&<section style={{background:"var(--card, #fff)",border:"1px solid var(--border, #e5e7eb)",borderRadius:18,padding:"16px 14px",marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:14}}><div><strong style={{fontSize:22}}>{meses[mesVisivel.getMonth()]}</strong><span className="muted" style={{marginLeft:8}}>{mesVisivel.getFullYear()}</span></div><div style={{display:"flex",gap:7}}><button type="button" className="secondary-button" onClick={()=>mudarMes(-1)} aria-label="Mês anterior">‹</button><button type="button" className="secondary-button" onClick={irHoje}>Hoje</button><button type="button" className="secondary-button" onClick={()=>mudarMes(1)} aria-label="Próximo mês">›</button></div></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:5,textAlign:"center"}}>{semana.map((d,i)=><div key={i} className="muted" style={{fontSize:12,fontWeight:700,paddingBottom:5}}>{d}</div>)}{calendario.map((c,i)=>{const qtd=qtdPorDia[c.iso]||0, selecionado=diaSelecionado===c.iso, atual=c.iso===hoje;return <button key={i} type="button" onClick={()=>{setDiaSelecionado(selecionado?null:c.iso);if(c.fora){const [a,m]=c.iso.split("-").map(Number);setMesVisivel(new Date(a,m-1,1))}}} aria-label={`${c.dia}, ${qtd} agendamento${qtd===1?"":"s"}`} style={{appearance:"none",border:selecionado?"2px solid #1677ff":"1px solid transparent",background:selecionado?"#eaf3ff":"transparent",borderRadius:12,minHeight:54,padding:"5px 2px",opacity:c.fora?.38:1,color:"inherit",position:"relative",cursor:"pointer"}}><span style={{display:"inline-flex",width:30,height:30,borderRadius:"50%",alignItems:"center",justifyContent:"center",fontWeight:atual?800:600,background:atual?"#1677ff":"transparent",color:atual?"white":"inherit"}}>{c.dia}</span><span style={{display:"flex",justifyContent:"center",alignItems:"center",flexWrap:"wrap",gap:2,minHeight:8,marginTop:2}}>{Array.from({length:qtd},(_,n)=><i key={n} style={{display:"block",width:6,height:6,borderRadius:"50%",background:"#1677ff"}}/>)}</span></button>})}</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginTop:8,minHeight:28}}><small className="muted"><span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:"#1677ff",marginRight:6}}/>Cada bolinha representa um serviço agendado</small>{diaSelecionado&&<button type="button" onClick={()=>setDiaSelecionado(null)} style={{border:0,background:"transparent",color:"#1677ff",fontWeight:700,cursor:"pointer"}}>Ver todos</button>}</div>
    </section>}

    {filtro!=="atrasados"&&<div className="stat-grid" style={{marginBottom:14}}><article className="stat-card"><strong>{hojeQtd}</strong><span>Hoje</span></article><article className="stat-card"><strong>{proximos7}</strong><span>Próximos 7 dias</span></article><article className="stat-card"><strong>{passados.length}</strong><span>Atrasados</span></article></div>}
    <input className="search-input" placeholder="Buscar cliente, serviço, prioridade..." value={q} onChange={e=>setQ(e.target.value)}/>
    <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}><small className="muted">{diaSelecionado?`Serviços de ${fmtData(diaSelecionado)} · `:""}{lista.length} agendamento{lista.length===1?"":"s"}</small>{filtro!=="atrasados"&&<button className="secondary-button" onClick={()=>setMostrarPassados(!mostrarPassados)}>{mostrarPassados?"Ocultar atrasados":`Ver atrasados${passados.length?` (${passados.length})`:""}`}</button>}</div>

    {erro&&<div className="error-box">{erro}</div>}
    {loading?<p className="muted">Carregando agenda...</p>:lista.length===0?<section className="empty-state"><div className="empty-icon">▣</div><h2>{filtro==="atrasados"?"Nenhum atendimento atrasado":diaSelecionado?"Nenhum serviço neste dia":"Nenhum agendamento encontrado"}</h2><p>{filtro==="atrasados"?"Não há serviços vencidos pendentes.":diaSelecionado?"Selecione outro dia no calendário ou toque em Ver todos.":"Ajuste a busca ou cadastre um novo atendimento."}</p></section>:<div className="timeline">{lista.map(x=>{const waze=wazeUrl(x), whats=whatsappUrl(x), end=endereco(x);return <article className="timeline-item" key={x.id}><div className="timeline-date"><strong>{rotuloData(x)}</strong><span>{x.hora_agendada?.slice(0,5)||"—"}</span></div><div style={{minWidth:0,flex:1}}><h3>{nome(x)}</h3><p>{x.tipo_servico}</p><small>{x.descricao}</small>{end&&<small style={{display:"block",marginTop:4}}>{end}</small>}{(x.chamado_equipamentos?.length||0)>0&&<small style={{display:"block",marginTop:4}}>{x.chamado_equipamentos.length} equipamento{x.chamado_equipamentos.length===1?"":"s"}</small>}{x.status==="em_atendimento"&&<small style={{display:"block",marginTop:4,fontWeight:700}}>Atendimento em andamento</small>}{x.data_agendada<hoje&&<small style={{display:"block",marginTop:4,fontWeight:700}}>Agendado para {fmtData(x.data_agendada)}</small>}<div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}><Link href={destino(x)} className="primary-button">{x.ordens_servico?.[0]?.id?"Abrir OS":"Abrir chamado"}</Link>{waze&&<a href={waze} target="_blank" rel="noopener noreferrer" className="secondary-button">Trajeto</a>}{whats&&<a href={whats} target="_blank" rel="noopener noreferrer" className="secondary-button">WhatsApp</a>}{x.status!=="em_atendimento"&&<Link href={`/chamados/${x.id}/editar`} className="secondary-button">Editar agendamento</Link>}{x.status!=="em_atendimento"&&<button type="button" className="secondary-button" disabled={!!removendo} onClick={()=>excluirAgendamento(x)} style={{color:"#b42318",borderColor:"#f3b8b2"}}>{removendo===x.id?"Excluindo...":"Excluir agendamento"}</button>}{x.status!=="em_atendimento"&&<CancelarChamado chamadoId={x.id} status={x.status} onCancelado={()=>setCh(atual=>atual.map(a=>a.id===x.id?{...a,status:"cancelado"}:a))}/>}</div></div></article>})}</div>}
  </div>
}

export default function Agenda(){return <Suspense fallback={<div className="page">Carregando agenda...</div>}><AgendaContent/></Suspense>}
