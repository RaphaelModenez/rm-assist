"use client";
import Link from "next/link";
import {FormEvent,useEffect,useMemo,useState} from "react";
import ClientPicker from "@/components/ClientPicker";
import {getSupabase} from "@/lib/supabase";
import {moeda} from "@/lib/domain";

function numBR(v:any){
  if(v===null||v===undefined||v==="") return 0;
  const n=Number(String(v).trim().replace(",","."));
  return Number.isFinite(n)?n:NaN;
}

export default function Orcamentos(){
  const [items,setItems]=useState<any[]>([]);
  const [clientes,setClientes]=useState<Record<string,string>>({});
  const [f,setF]=useState({cliente_id:"",descricao:"",valor:"",status:"Rascunho",validade:"",observacoes:""});
  const [erro,setErro]=useState("");
  const [salvando,setSalvando]=useState(false);

  async function load(){
    const s=getSupabase(); if(!s)return setErro("Supabase não configurado.");
    const [{data:orc,error:e1},{data:cs,error:e2}] = await Promise.all([
      s.from("orcamentos").select("*").order("created_at",{ascending:false}),
      s.from("clientes").select("id,nome,nome_fantasia")
    ]);
    if(e1||e2)return setErro(e1?.message||e2?.message||"");
    setItems(orc||[]);
    setClientes(Object.fromEntries((cs||[]).map((c:any)=>[c.id,c.nome_fantasia||c.nome])));
  }

  useEffect(()=>{load()},[]);

  async function save(e:FormEvent){
    e.preventDefault();
    if(!f.cliente_id||!f.descricao.trim())return setErro("Informe cliente e descrição.");
    const valor=numBR(f.valor);
    if(Number.isNaN(valor))return setErro("Informe um valor válido. Você pode usar vírgula, por exemplo: 850,00.");
    const s=getSupabase(); if(!s)return setErro("Supabase não configurado.");
    setSalvando(true);setErro("");
    const {error}=await s.from("orcamentos").insert({
      cliente_id:f.cliente_id,
      descricao:f.descricao.trim(),
      valor,
      status:f.status,
      validade:f.validade||null,
      observacoes:f.observacoes||null
    });
    setSalvando(false);
    if(error)return setErro(error.message);
    setF({cliente_id:"",descricao:"",valor:"",status:"Rascunho",validade:"",observacoes:""});
    load();
  }

  async function mudarStatus(id:string,status:string){
    const s=getSupabase(); if(!s)return;
    const {error}=await s.from("orcamentos").update({status,updated_at:new Date().toISOString()}).eq("id",id);
    if(error)setErro(error.message); else load();
  }

  const totais=useMemo(()=>({
    enviados:items.filter((x:any)=>x.status==="Enviado").length,
    aprovados:items.filter((x:any)=>x.status==="Aprovado").length,
    valorAprovado:items.filter((x:any)=>x.status==="Aprovado").reduce((s:any,x:any)=>s+Number(x.valor||0),0)
  }),[items]);

  return <div className="page">
    <header className="simple-header"><div><p className="eyebrow">RM ASSIST</p><h1>Orçamentos</h1><p>Propostas e acompanhamento comercial.</p></div></header>
    <div className="stat-grid"><article className="stat-card"><strong>{totais.enviados}</strong><span>Enviados</span></article><article className="stat-card"><strong>{totais.aprovados}</strong><span>Aprovados</span></article><article className="stat-card"><strong>{moeda(totais.valorAprovado)}</strong><span>Valor aprovado</span></article></div>
    <form className="form-card compact-form" onSubmit={save}>
      <div className="field"><label>Cliente *</label><ClientPicker value={f.cliente_id} onChange={v=>setF({...f,cliente_id:v})}/></div>
      <div className="field"><label>Descrição *</label><input value={f.descricao} onChange={e=>setF({...f,descricao:e.target.value})}/></div>
      <div className="field-grid"><div className="field"><label>Valor</label><input inputMode="decimal" value={f.valor} onChange={e=>setF({...f,valor:e.target.value})} placeholder="0,00"/></div><div className="field"><label>Validade</label><input type="date" value={f.validade} onChange={e=>setF({...f,validade:e.target.value})}/></div></div>
      <div className="field"><label>Status</label><select value={f.status} onChange={e=>setF({...f,status:e.target.value})}><option>Rascunho</option><option>Enviado</option><option>Aprovado</option><option>Reprovado</option></select></div>
      <div className="field"><label>Observações</label><textarea rows={3} value={f.observacoes} onChange={e=>setF({...f,observacoes:e.target.value})}/></div>
      {erro&&<div className="error-box">{erro}</div>}
      <button className="primary-button" disabled={salvando}>{salvando?"Salvando...":"Salvar orçamento"}</button>
    </form>
    <div className="service-list">{items.map((x:any)=><article className="service-card" key={x.id}><div><span className={`status-chip ${String(x.status).toLowerCase()}`}>{x.status}</span><h3>Orçamento #{String(x.numero).padStart(4,"0")} — {clientes[x.cliente_id]||"Cliente"}</h3><p>{x.descricao}</p><small>{x.validade?`Validade: ${new Date(x.validade+"T12:00:00").toLocaleDateString("pt-BR")}`:"Sem validade definida"}</small></div><div style={{display:"flex",alignItems:"flex-end",gap:8,flexDirection:"column"}}><strong>{moeda(x.valor)}</strong><select value={x.status} onChange={e=>mudarStatus(x.id,e.target.value)}><option>Rascunho</option><option>Enviado</option><option>Aprovado</option><option>Reprovado</option></select><Link href={`/orcamentos/${x.id}/editar`} className="secondary-button">Editar</Link></div></article>)}</div>
  </div>
}
