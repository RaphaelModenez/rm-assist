"use client";
import {FormEvent,useEffect,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import {getSupabase} from "@/lib/supabase";

export default function EditarCliente(){
 const {id}=useParams<{id:string}>(); const r=useRouter();
 const [f,setF]=useState<any>(); const [erro,setErro]=useState(""); const [salvando,setSalvando]=useState(false);

 useEffect(()=>{(async()=>{const s=getSupabase();if(!s)return setErro("Supabase não configurado.");const {data,error}=await s.from("clientes").select("*").eq("id",id).single();if(error)setErro(error.message);else setF(data)})()},[id]);

 async function salvar(e:FormEvent){
  e.preventDefault(); if(!f?.nome?.trim())return setErro("Informe o nome ou razão social.");
  const s=getSupabase();if(!s)return;
  setSalvando(true);setErro("");
  const {error}=await s.from("clientes").update({
   nome:f.nome.trim(),nome_fantasia:f.nome_fantasia||null,cpf_cnpj:f.cpf_cnpj||null,telefone:f.telefone||null,whatsapp:f.whatsapp||null,email:f.email||null,observacoes:f.observacoes||null,ativo:!!f.ativo,updated_at:new Date().toISOString()
  }).eq("id",id);
  setSalvando(false);if(error)return setErro(error.message);r.push(`/clientes/${id}`);r.refresh();
 }

 if(!f&&!erro)return <div className="page">Carregando...</div>;
 return <div className="page"><header className="simple-header"><div><p className="eyebrow">CLIENTE</p><h1>Editar cliente</h1></div></header>
 <form className="form-card" onSubmit={salvar}>
  {erro&&<div className="error-box">{erro}</div>}
  <div className="field"><label>Nome / Razão social *</label><input value={f?.nome||""} onChange={e=>setF({...f,nome:e.target.value})}/></div>
  <div className="field"><label>Nome fantasia</label><input value={f?.nome_fantasia||""} onChange={e=>setF({...f,nome_fantasia:e.target.value})}/></div>
  <div className="field-grid"><div className="field"><label>CPF / CNPJ</label><input value={f?.cpf_cnpj||""} onChange={e=>setF({...f,cpf_cnpj:e.target.value})}/></div><div className="field"><label>Telefone</label><input value={f?.telefone||""} onChange={e=>setF({...f,telefone:e.target.value})}/></div></div>
  <div className="field-grid"><div className="field"><label>WhatsApp</label><input value={f?.whatsapp||""} onChange={e=>setF({...f,whatsapp:e.target.value})}/></div><div className="field"><label>E-mail</label><input type="email" value={f?.email||""} onChange={e=>setF({...f,email:e.target.value})}/></div></div>
  <div className="field"><label>Observações</label><textarea rows={4} value={f?.observacoes||""} onChange={e=>setF({...f,observacoes:e.target.value})}/></div>
  <div className="field"><label>Status</label><select value={f?.ativo?"ativo":"inativo"} onChange={e=>setF({...f,ativo:e.target.value==="ativo"})}><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></div>
  <div className="form-actions"><button type="button" className="secondary-button" onClick={()=>r.back()}>Cancelar</button><button className="primary-button" disabled={salvando}>{salvando?"Salvando...":"Salvar alterações"}</button></div>
 </form></div>
}
