"use client";
import {FormEvent,useEffect,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import {getSupabase} from "@/lib/supabase";

export default function EditarLocal(){
 const {id,localId}=useParams<{id:string,localId:string}>(); const r=useRouter();
 const [f,setF]=useState<any>(); const [erro,setErro]=useState(""); const [salvando,setSalvando]=useState(false);

 useEffect(()=>{(async()=>{const s=getSupabase();if(!s)return setErro("Supabase não configurado.");const {data,error}=await s.from("locais").select("*").eq("id",localId).eq("cliente_id",id).single();if(error)setErro(error.message);else setF(data)})()},[id,localId]);

 async function save(e:FormEvent){
  e.preventDefault();if(!f?.nome?.trim())return setErro("Informe o nome do local.");
  const s=getSupabase();if(!s)return;setSalvando(true);setErro("");
  const {error}=await s.from("locais").update({nome:f.nome.trim(),endereco:f.endereco||null,numero:f.numero||null,bairro:f.bairro||null,cidade:f.cidade||null,estado:f.estado||null,cep:f.cep||null,referencia:f.referencia||null,updated_at:new Date().toISOString()}).eq("id",localId).eq("cliente_id",id);
  setSalvando(false);if(error)return setErro(error.message);r.push(`/clientes/${id}`);r.refresh();
 }

 if(!f&&!erro)return <div className="page">Carregando...</div>;
 return <div className="page"><header className="simple-header"><div><p className="eyebrow">LOCAL</p><h1>Editar local</h1></div></header><form className="form-card" onSubmit={save}>
 {erro&&<div className="error-box">{erro}</div>}
 {[["nome","Nome do local *"],["endereco","Endereço"],["numero","Número"],["bairro","Bairro"],["cidade","Cidade"],["estado","Estado"],["cep","CEP"],["referencia","Referência"]].map(([k,l])=><div className="field" key={k}><label>{l}</label><input value={f?.[k]||""} onChange={e=>setF({...f,[k]:e.target.value})}/></div>)}
 <div className="form-actions"><button type="button" className="secondary-button" onClick={()=>r.back()}>Cancelar</button><button className="primary-button" disabled={salvando}>{salvando?"Salvando...":"Salvar alterações"}</button></div></form></div>
}
