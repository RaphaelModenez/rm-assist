"use client";
import Link from "next/link";
import {FormEvent,useEffect,useMemo,useState} from "react";
import ClientPicker from "@/components/ClientPicker";
import {getSupabase} from "@/lib/supabase";
import {moeda} from "@/lib/domain";

function numBR(v:any){
 const n=Number(String(v||"0").trim().replace(",","."));
 return Number.isFinite(n)?n:NaN;
}

export default function PMOC(){
 const [items,setItems]=useState<any[]>([]);const [clientes,setClientes]=useState<Record<string,string>>({});const [erro,setErro]=useState("");const [salvando,setSalvando]=useState(false);
 const [f,setF]=useState({cliente_id:"",nome:"Contrato PMOC",periodicidade:"Mensal",data_inicio:"",proxima_visita:"",valor_mensal:"",observacoes:""});
 async function load(){const s=getSupabase();if(!s)return setErro("Supabase não configurado.");const [{data:it,error:e1},{data:cs,error:e2}]=await Promise.all([s.from("pmoc_contratos").select("*").order("proxima_visita",{ascending:true}),s.from("clientes").select("id,nome,nome_fantasia")]);if(e1||e2)return setErro(e1?.message||e2?.message||"");setItems(it||[]);setClientes(Object.fromEntries((cs||[]).map((c:any)=>[c.id,c.nome_fantasia||c.nome])))}
 useEffect(()=>{load()},[]);
 async function save(e:FormEvent){
  e.preventDefault();if(!f.cliente_id||!f.nome.trim())return setErro("Informe cliente e nome do contrato.");
  const valor=numBR(f.valor_mensal);if(Number.isNaN(valor))return setErro("Informe um valor mensal válido.");
  if(f.data_inicio&&f.proxima_visita&&f.proxima_visita<f.data_inicio)return setErro("A próxima visita não pode ser anterior à data de início.");
  const s=getSupabase();if(!s)return;setSalvando(true);setErro("");
  const {error}=await s.from("pmoc_contratos").insert({cliente_id:f.cliente_id,nome:f.nome.trim(),periodicidade:f.periodicidade,data_inicio:f.data_inicio||null,proxima_visita:f.proxima_visita||null,valor_mensal:valor,observacoes:f.observacoes||null,ativo:true});
  setSalvando(false);if(error)return setErro(error.message);setF({cliente_id:"",nome:"Contrato PMOC",periodicidade:"Mensal",data_inicio:"",proxima_visita:"",valor_mensal:"",observacoes:""});load()
 }
 async function toggle(x:any){const s=getSupabase();if(!s)return;const {error}=await s.from("pmoc_contratos").update({ativo:!x.ativo,updated_at:new Date().toISOString()}).eq("id",x.id);if(error)setErro(error.message);else load()}
 const ativos=useMemo(()=>items.filter((x:any)=>x.ativo).length,[items]);const mensal=useMemo(()=>items.filter((x:any)=>x.ativo).reduce((s:any,x:any)=>s+Number(x.valor_mensal||0),0),[items]);

 return <div className="page"><header className="simple-header"><div><p className="eyebrow">RM ASSIST</p><h1>PMOC</h1><p>Contratos e próximas manutenções preventivas.</p></div></header>
 <div className="stat-grid"><article className="stat-card"><strong>{ativos}</strong><span>Contratos ativos</span></article><article className="stat-card"><strong>{moeda(mensal)}</strong><span>Mensal contratado</span></article></div>
 <form className="form-card compact-form" onSubmit={save}><div className="field"><label>Cliente *</label><ClientPicker value={f.cliente_id} onChange={v=>setF({...f,cliente_id:v})}/></div><div className="field"><label>Nome do contrato *</label><input value={f.nome} onChange={e=>setF({...f,nome:e.target.value})}/></div><div className="field-grid"><div className="field"><label>Periodicidade</label><select value={f.periodicidade} onChange={e=>setF({...f,periodicidade:e.target.value})}><option>Mensal</option><option>Bimestral</option><option>Trimestral</option><option>Semestral</option></select></div><div className="field"><label>Valor mensal</label><input inputMode="decimal" value={f.valor_mensal} onChange={e=>setF({...f,valor_mensal:e.target.value})} placeholder="0,00"/></div></div><div className="field-grid"><div className="field"><label>Início</label><input type="date" value={f.data_inicio} onChange={e=>setF({...f,data_inicio:e.target.value})}/></div><div className="field"><label>Próxima visita</label><input type="date" value={f.proxima_visita} onChange={e=>setF({...f,proxima_visita:e.target.value})}/></div></div><div className="field"><label>Observações</label><textarea rows={3} value={f.observacoes} onChange={e=>setF({...f,observacoes:e.target.value})}/></div>{erro&&<div className="error-box">{erro}</div>}<button className="primary-button" disabled={salvando}>{salvando?"Salvando...":"Salvar contrato PMOC"}</button></form>
 {items.length===0?<section className="empty-state"><h2>Nenhum contrato PMOC</h2><p>Cadastre o primeiro contrato recorrente.</p></section>:<div className="service-list">{items.map((x:any)=><article className="service-card" key={x.id}><div><span className={`status-chip ${x.ativo?"agendado":"concluida"}`}>{x.ativo?"ativo":"inativo"}</span><h3>{x.nome} — {clientes[x.cliente_id]||"Cliente"}</h3><p>{x.periodicidade} • {moeda(x.valor_mensal)}</p><small>{x.proxima_visita?`Próxima visita: ${new Date(x.proxima_visita+"T12:00:00").toLocaleDateString("pt-BR")}`:"Próxima visita não definida"}</small></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Link href={`/pmoc/${x.id}/editar`} className="secondary-button">Editar</Link><button className="secondary-button" onClick={()=>toggle(x)}>{x.ativo?"Desativar":"Ativar"}</button></div></article>)}</div>}</div>
}
