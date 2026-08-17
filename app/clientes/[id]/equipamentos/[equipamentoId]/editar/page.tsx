"use client";
import {FormEvent,useEffect,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import {getSupabase} from "@/lib/supabase";

export default function EditarEq(){
 const {id,equipamentoId}=useParams<{id:string,equipamentoId:string}>();const r=useRouter();
 const [erro,setErro]=useState("");const [salvando,setSalvando]=useState(false);const [locais,setLocais]=useState<any[]>([]);const [f,setF]=useState<any>();

 useEffect(()=>{(async()=>{const s=getSupabase();if(!s)return setErro("Supabase não configurado.");const [{data:eq,error:e1},{data:ls,error:e2}]=await Promise.all([s.from("equipamentos").select("*").eq("id",equipamentoId).eq("cliente_id",id).single(),s.from("locais").select("id,nome").eq("cliente_id",id).order("nome")]);if(e1||e2)setErro(e1?.message||e2?.message||"");else {setF(eq);setLocais(ls||[])}})()},[id,equipamentoId]);

 async function save(e:FormEvent){
  e.preventDefault();if(!f?.ambiente?.trim())return setErro("Informe o ambiente.");
  const s=getSupabase();if(!s)return;setSalvando(true);setErro("");
  const capacidade=f.capacidade_btu===""||f.capacidade_btu===null?null:Number(f.capacidade_btu);
  if(capacidade!==null&&!Number.isFinite(capacidade)){setSalvando(false);return setErro("Capacidade BTU inválida.");}
  const {error}=await s.from("equipamentos").update({local_id:f.local_id||null,ambiente:f.ambiente.trim(),tipo:f.tipo,marca:f.marca||null,modelo:f.modelo||null,numero_serie:f.numero_serie||null,capacidade_btu:capacidade,refrigerante:f.refrigerante||null,tensao:f.tensao||null,patrimonio:f.patrimonio||null,observacoes:f.observacoes||null,ativo:!!f.ativo,updated_at:new Date().toISOString()}).eq("id",equipamentoId).eq("cliente_id",id);
  setSalvando(false);if(error)return setErro(error.message);r.push(`/clientes/${id}`);r.refresh();
 }

 if(!f&&!erro)return <div className="page">Carregando...</div>;
 return <div className="page"><header className="simple-header"><div><p className="eyebrow">EQUIPAMENTO</p><h1>Editar equipamento</h1></div></header><form className="form-card" onSubmit={save}>
 {erro&&<div className="error-box">{erro}</div>}
 <div className="field"><label>Local</label><select value={f?.local_id||""} onChange={e=>setF({...f,local_id:e.target.value})}><option value="">Sem local</option>{locais.map(x=><option key={x.id} value={x.id}>{x.nome}</option>)}</select></div>
 <div className="field"><label>Ambiente *</label><input value={f?.ambiente||""} onChange={e=>setF({...f,ambiente:e.target.value})}/></div>
 <div className="field-grid"><div className="field"><label>Tipo</label><select value={f?.tipo||"Split Hi-Wall"} onChange={e=>setF({...f,tipo:e.target.value})}><option>Split Hi-Wall</option><option>Split Piso-Teto</option><option>Cassete</option><option>Janela</option><option>VRF/VRV</option><option>Outro</option></select></div><div className="field"><label>Capacidade BTU</label><input type="number" value={f?.capacidade_btu??""} onChange={e=>setF({...f,capacidade_btu:e.target.value})}/></div></div>
 {["marca","modelo","numero_serie","patrimonio"].map(k=><div className="field" key={k}><label>{({marca:"Marca",modelo:"Modelo",numero_serie:"Número de série",patrimonio:"Patrimônio / ID"} as any)[k]}</label><input value={f?.[k]||""} onChange={e=>setF({...f,[k]:e.target.value})}/></div>)}
 <div className="field-grid"><div className="field"><label>Refrigerante</label><select value={f?.refrigerante||""} onChange={e=>setF({...f,refrigerante:e.target.value})}><option value="">Selecione</option><option>R-22</option><option>R-410A</option><option>R-32</option><option>Outro</option></select></div><div className="field"><label>Tensão</label><select value={f?.tensao||"220 V"} onChange={e=>setF({...f,tensao:e.target.value})}><option>127 V</option><option>220 V</option><option>380 V</option></select></div></div>
 <div className="field"><label>Status</label><select value={f?.ativo?"ativo":"inativo"} onChange={e=>setF({...f,ativo:e.target.value==="ativo"})}><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></div>
 <div className="field"><label>Observações</label><textarea rows={3} value={f?.observacoes||""} onChange={e=>setF({...f,observacoes:e.target.value})}/></div>
 <div className="form-actions"><button type="button" className="secondary-button" onClick={()=>r.back()}>Cancelar</button><button className="primary-button" disabled={salvando}>{salvando?"Salvando...":"Salvar alterações"}</button></div></form></div>
}
