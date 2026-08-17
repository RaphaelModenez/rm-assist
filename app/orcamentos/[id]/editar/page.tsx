"use client";
import {FormEvent,useEffect,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import ClientPicker from "@/components/ClientPicker";
import {getSupabase} from "@/lib/supabase";

function numBR(v:any){
  if(v===null||v===undefined||v==="") return 0;
  const n=Number(String(v).trim().replace(",","."));
  return Number.isFinite(n)?n:NaN;
}

export default function EditarOrcamento(){
 const {id}=useParams<{id:string}>(); const r=useRouter();
 const [f,setF]=useState<any>(); const [erro,setErro]=useState(""); const [salvando,setSalvando]=useState(false);

 useEffect(()=>{(async()=>{const s=getSupabase();if(!s)return setErro("Supabase não configurado.");const {data,error}=await s.from("orcamentos").select("*").eq("id",id).single();if(error)setErro(error.message);else setF({...data,valor:String(data.valor??"").replace(".",",")})})()},[id]);

 async function salvar(e:FormEvent){
  e.preventDefault(); if(!f?.cliente_id||!f?.descricao?.trim())return setErro("Informe cliente e descrição.");
  const valor=numBR(f.valor); if(Number.isNaN(valor))return setErro("Informe um valor válido.");
  const s=getSupabase();if(!s)return;setSalvando(true);setErro("");
  const {error}=await s.from("orcamentos").update({
    cliente_id:f.cliente_id,descricao:f.descricao.trim(),valor,status:f.status,
    validade:f.validade||null,observacoes:f.observacoes||null,updated_at:new Date().toISOString()
  }).eq("id",id);
  setSalvando(false);if(error)return setErro(error.message);r.push("/orcamentos");r.refresh();
 }

 if(!f&&!erro)return <div className="page">Carregando...</div>;
 return <div className="page"><header className="simple-header"><div><p className="eyebrow">ORÇAMENTO</p><h1>Editar orçamento</h1></div></header>
 <form className="form-card" onSubmit={salvar}>
  {erro&&<div className="error-box">{erro}</div>}
  <div className="field"><label>Cliente *</label><ClientPicker value={f?.cliente_id||""} onChange={v=>setF({...f,cliente_id:v})}/></div>
  <div className="field"><label>Descrição *</label><input value={f?.descricao||""} onChange={e=>setF({...f,descricao:e.target.value})}/></div>
  <div className="field-grid"><div className="field"><label>Valor</label><input inputMode="decimal" value={f?.valor||""} onChange={e=>setF({...f,valor:e.target.value})}/></div><div className="field"><label>Validade</label><input type="date" value={f?.validade||""} onChange={e=>setF({...f,validade:e.target.value})}/></div></div>
  <div className="field"><label>Status</label><select value={f?.status||"Rascunho"} onChange={e=>setF({...f,status:e.target.value})}><option>Rascunho</option><option>Enviado</option><option>Aprovado</option><option>Reprovado</option></select></div>
  <div className="field"><label>Observações</label><textarea rows={4} value={f?.observacoes||""} onChange={e=>setF({...f,observacoes:e.target.value})}/></div>
  <div className="form-actions"><button type="button" className="secondary-button" onClick={()=>r.back()}>Cancelar</button><button className="primary-button" disabled={salvando}>{salvando?"Salvando...":"Salvar alterações"}</button></div>
 </form></div>
}
