"use client";
import {FormEvent,useEffect,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import ClientPicker from "@/components/ClientPicker";
import {getSupabase} from "@/lib/supabase";

function numBR(v:any){
 const n=Number(String(v||"0").trim().replace(",","."));
 return Number.isFinite(n)?n:NaN;
}

export default function EditarPMOC(){
 const {id}=useParams<{id:string}>();const r=useRouter();
 const [f,setF]=useState<any>();const [erro,setErro]=useState("");const [salvando,setSalvando]=useState(false);

 useEffect(()=>{(async()=>{const s=getSupabase();if(!s)return setErro("Supabase não configurado.");const {data,error}=await s.from("pmoc_contratos").select("*").eq("id",id).single();if(error)setErro(error.message);else setF({...data,valor_mensal:String(data.valor_mensal??"").replace(".",",")})})()},[id]);

 async function salvar(e:FormEvent){
  e.preventDefault();if(!f?.cliente_id||!f?.nome?.trim())return setErro("Informe cliente e nome do contrato.");
  const valor=numBR(f.valor_mensal);if(Number.isNaN(valor))return setErro("Informe um valor mensal válido.");
  if(f.data_inicio&&f.proxima_visita&&f.proxima_visita<f.data_inicio)return setErro("A próxima visita não pode ser anterior à data de início.");
  const s=getSupabase();if(!s)return;setSalvando(true);setErro("");
  const {error}=await s.from("pmoc_contratos").update({
    cliente_id:f.cliente_id,nome:f.nome.trim(),periodicidade:f.periodicidade,data_inicio:f.data_inicio||null,
    proxima_visita:f.proxima_visita||null,valor_mensal:valor,observacoes:f.observacoes||null,ativo:!!f.ativo,updated_at:new Date().toISOString()
  }).eq("id",id);
  setSalvando(false);if(error)return setErro(error.message);r.push("/pmoc");r.refresh();
 }

 if(!f&&!erro)return <div className="page">Carregando...</div>;
 return <div className="page"><header className="simple-header"><div><p className="eyebrow">PMOC</p><h1>Editar contrato</h1></div></header><form className="form-card" onSubmit={salvar}>
 {erro&&<div className="error-box">{erro}</div>}
 <div className="field"><label>Cliente *</label><ClientPicker value={f?.cliente_id||""} onChange={v=>setF({...f,cliente_id:v})}/></div>
 <div className="field"><label>Nome do contrato *</label><input value={f?.nome||""} onChange={e=>setF({...f,nome:e.target.value})}/></div>
 <div className="field-grid"><div className="field"><label>Periodicidade</label><select value={f?.periodicidade||"Mensal"} onChange={e=>setF({...f,periodicidade:e.target.value})}><option>Mensal</option><option>Bimestral</option><option>Trimestral</option><option>Semestral</option></select></div><div className="field"><label>Valor mensal</label><input inputMode="decimal" value={f?.valor_mensal||""} onChange={e=>setF({...f,valor_mensal:e.target.value})}/></div></div>
 <div className="field-grid"><div className="field"><label>Início</label><input type="date" value={f?.data_inicio||""} onChange={e=>setF({...f,data_inicio:e.target.value})}/></div><div className="field"><label>Próxima visita</label><input type="date" value={f?.proxima_visita||""} onChange={e=>setF({...f,proxima_visita:e.target.value})}/></div></div>
 <div className="field"><label>Status</label><select value={f?.ativo?"ativo":"inativo"} onChange={e=>setF({...f,ativo:e.target.value==="ativo"})}><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></div>
 <div className="field"><label>Observações</label><textarea rows={4} value={f?.observacoes||""} onChange={e=>setF({...f,observacoes:e.target.value})}/></div>
 <div className="form-actions"><button type="button" className="secondary-button" onClick={()=>r.back()}>Cancelar</button><button className="primary-button" disabled={salvando}>{salvando?"Salvando...":"Salvar alterações"}</button></div>
 </form></div>
}
