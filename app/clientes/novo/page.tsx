"use client";
import {FormEvent,Suspense,useRef,useState} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import {getSupabase} from "@/lib/supabase";

function NovoClienteContent(){
 const router=useRouter();const sp=useSearchParams();const retorno=sp.get("retorno");
 const trava=useRef(false);const [erro,setErro]=useState("");const [salvando,setSalvando]=useState(false);
 const [f,setF]=useState({nome:"",nome_fantasia:"",cpf_cnpj:"",telefone:"",whatsapp:"",email:"",observacoes:""});
 const normal=(v:any)=>String(v||"").replace(/\s+/g," ").trim().toLocaleLowerCase("pt-BR");
 const soNumeros=(v:any)=>String(v||"").replace(/\D/g,"");

 async function salvar(e:FormEvent){
  e.preventDefault();if(trava.current)return;
  if(!f.nome.trim())return setErro("Informe o nome ou razão social.");
  const supabase=getSupabase();if(!supabase)return setErro("Supabase não configurado.");
  trava.current=true;setSalvando(true);setErro("");
  try{
   const {data:existentes,error:buscaErro}=await supabase.from("clientes").select("id,nome,nome_fantasia,cpf_cnpj,telefone,whatsapp");
   if(buscaErro)throw buscaErro;
   const doc=soNumeros(f.cpf_cnpj),tel=soNumeros(f.telefone||f.whatsapp);
   const duplicado=(existentes||[]).find((x:any)=>{
    if(doc&&soNumeros(x.cpf_cnpj)===doc)return true;
    const nomeIgual=normal(x.nome)===normal(f.nome)|| (!!f.nome_fantasia&&normal(x.nome_fantasia)===normal(f.nome_fantasia));
    const telefoneExistente=soNumeros(x.telefone||x.whatsapp);
    return nomeIgual&&!!tel&&telefoneExistente===tel;
   });
   if(duplicado){setErro("Este cliente parece já estar cadastrado. Confira nome, CPF/CNPJ ou telefone.");return;}

   const {data,error}=await supabase.from("clientes").insert({nome:f.nome.trim(),nome_fantasia:f.nome_fantasia.trim()||null,cpf_cnpj:f.cpf_cnpj.trim()||null,telefone:f.telefone.trim()||null,whatsapp:f.whatsapp.trim()||null,email:f.email.trim()||null,observacoes:f.observacoes.trim()||null,ativo:true}).select("id").single();
   if(error)throw error;
   if(retorno==="chamado"&&data?.id)router.push(`/chamados/novo?cliente=${data.id}`);else router.push("/clientes");
   router.refresh();
  }catch(e:any){setErro(e?.message||"Não foi possível salvar o cliente.");}
  finally{setSalvando(false);trava.current=false;}
 }

 return <div className="page"><header className="simple-header"><div><p className="eyebrow">CLIENTES</p><h1>Novo cliente</h1><p>{retorno==="chamado"?"Cadastre o cliente e volte automaticamente ao chamado.":"Dados principais do cliente."}</p></div></header>
 <form className="form-card" onSubmit={salvar}>
  <div className="field"><label>Nome / Razão social *</label><input disabled={salvando} value={f.nome} onChange={e=>setF({...f,nome:e.target.value})}/></div>
  <div className="field"><label>Nome fantasia</label><input disabled={salvando} value={f.nome_fantasia} onChange={e=>setF({...f,nome_fantasia:e.target.value})}/></div>
  <div className="field-grid"><div className="field"><label>CPF / CNPJ</label><input disabled={salvando} value={f.cpf_cnpj} onChange={e=>setF({...f,cpf_cnpj:e.target.value})}/></div><div className="field"><label>Telefone</label><input disabled={salvando} value={f.telefone} onChange={e=>setF({...f,telefone:e.target.value})}/></div></div>
  <div className="field-grid"><div className="field"><label>WhatsApp</label><input disabled={salvando} value={f.whatsapp} onChange={e=>setF({...f,whatsapp:e.target.value})}/></div><div className="field"><label>E-mail</label><input disabled={salvando} type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></div></div>
  <div className="field"><label>Observações</label><textarea disabled={salvando} rows={4} value={f.observacoes} onChange={e=>setF({...f,observacoes:e.target.value})}/></div>
  {erro&&<div className="error-box">{erro}</div>}
  <div className="form-actions"><button type="button" className="secondary-button" disabled={salvando} onClick={()=>router.back()}>Cancelar</button><button className="primary-button" disabled={salvando}>{salvando?"Salvando...":retorno==="chamado"?"Salvar e voltar ao chamado":"Salvar cliente"}</button></div>
 </form></div>
}

export default function NovoCliente(){return <Suspense fallback={<div className="page">Carregando...</div>}><NovoClienteContent/></Suspense>}
