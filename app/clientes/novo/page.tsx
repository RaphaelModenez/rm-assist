"use client";
import {FormEvent,useState} from "react";
import {useRouter} from "next/navigation";
import {getSupabase} from "@/lib/supabase";

export default function NovoCliente(){
 const router=useRouter(); const [erro,setErro]=useState(""); const [salvando,setSalvando]=useState(false);
 const [f,setF]=useState({nome:"",nome_fantasia:"",cpf_cnpj:"",telefone:"",whatsapp:"",email:"",observacoes:""});
 async function salvar(e:FormEvent){e.preventDefault();if(!f.nome.trim())return setErro("Informe o nome ou razão social.");
  const supabase=getSupabase(); if(!supabase)return setErro("Supabase não configurado.");
  setSalvando(true); setErro("");
  const {error}=await supabase.from("clientes").insert({
    nome:f.nome.trim(), nome_fantasia:f.nome_fantasia||null, cpf_cnpj:f.cpf_cnpj||null,
    telefone:f.telefone||null, whatsapp:f.whatsapp||null, email:f.email||null,
    observacoes:f.observacoes||null, ativo:true
  });
  setSalvando(false); if(error)return setErro(error.message); router.push("/clientes"); router.refresh();
 }
 return <div className="page"><header className="simple-header"><div><p className="eyebrow">CLIENTES</p><h1>Novo cliente</h1><p>Dados principais do cliente.</p></div></header>
 <form className="form-card" onSubmit={salvar}>
  <div className="field"><label>Nome / Razão social *</label><input value={f.nome} onChange={e=>setF({...f,nome:e.target.value})}/></div>
  <div className="field"><label>Nome fantasia</label><input value={f.nome_fantasia} onChange={e=>setF({...f,nome_fantasia:e.target.value})}/></div>
  <div className="field-grid"><div className="field"><label>CPF / CNPJ</label><input value={f.cpf_cnpj} onChange={e=>setF({...f,cpf_cnpj:e.target.value})}/></div><div className="field"><label>Telefone</label><input value={f.telefone} onChange={e=>setF({...f,telefone:e.target.value})}/></div></div>
  <div className="field-grid"><div className="field"><label>WhatsApp</label><input value={f.whatsapp} onChange={e=>setF({...f,whatsapp:e.target.value})}/></div><div className="field"><label>E-mail</label><input type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></div></div>
  <div className="field"><label>Observações</label><textarea rows={4} value={f.observacoes} onChange={e=>setF({...f,observacoes:e.target.value})}/></div>{erro&&<div className="error-box">{erro}</div>}
  <div className="form-actions"><button type="button" className="secondary-button" onClick={()=>router.back()}>Cancelar</button><button className="primary-button" disabled={salvando}>{salvando?"Salvando...":"Salvar cliente"}</button></div>
 </form></div>
}
