"use client";
import {FormEvent,useEffect,useRef,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import {getSupabase} from "@/lib/supabase";

export default function NovoEq(){
 const {id}=useParams<{id:string}>();const r=useRouter();const trava=useRef(false);
 const [erro,setErro]=useState("");const [salvando,setSalvando]=useState(false);const [locais,setLocais]=useState<any[]>([]);
 const [f,setF]=useState({local_id:"",ambiente:"",tipo:"Split Hi-Wall",marca:"",modelo:"",numero_serie:"",capacidade_btu:"",refrigerante:"",tensao:"220 V",patrimonio:"",observacoes:""});

 useEffect(()=>{const s=getSupabase();if(!s)return;s.from("locais").select("id,nome").eq("cliente_id",id).order("nome").then(({data})=>setLocais(data||[]))},[id]);
 const normal=(v:any)=>String(v||"").trim().toLocaleLowerCase("pt-BR");

 async function save(e:FormEvent){
  e.preventDefault();if(trava.current)return;
  if(!f.ambiente.trim())return setErro("Informe o ambiente.");
  const capacidade=f.capacidade_btu?Number(f.capacidade_btu):null;
  if(capacidade!==null&&(!Number.isFinite(capacidade)||capacidade<=0))return setErro("Informe uma capacidade BTU válida.");
  const s=getSupabase();if(!s)return setErro("Supabase não configurado.");
  trava.current=true;setSalvando(true);setErro("");
  try{
   const {data:existentes,error:buscaErro}=await s.from("equipamentos").select("id,local_id,ambiente,tipo,marca,modelo,numero_serie,patrimonio").eq("cliente_id",id);
   if(buscaErro)throw buscaErro;
   const duplicado=(existentes||[]).find((x:any)=>{
    if(f.numero_serie.trim()&&normal(x.numero_serie)===normal(f.numero_serie))return true;
    if(f.patrimonio.trim()&&normal(x.patrimonio)===normal(f.patrimonio))return true;
    return (x.local_id||"")===(f.local_id||"")&&normal(x.ambiente)===normal(f.ambiente)&&normal(x.tipo)===normal(f.tipo)&&normal(x.marca)===normal(f.marca)&&normal(x.modelo)===normal(f.modelo);
   });
   if(duplicado){setErro("Este equipamento parece já estar cadastrado para este cliente. Confira ambiente, local, série ou patrimônio.");return;}
   const {error}=await s.from("equipamentos").insert({cliente_id:id,local_id:f.local_id||null,ambiente:f.ambiente.trim(),tipo:f.tipo,marca:f.marca.trim()||null,modelo:f.modelo.trim()||null,numero_serie:f.numero_serie.trim()||null,capacidade_btu:capacidade,refrigerante:f.refrigerante||null,tensao:f.tensao||null,patrimonio:f.patrimonio.trim()||null,observacoes:f.observacoes.trim()||null,ativo:true});
   if(error)throw error;
   r.push(`/clientes/${id}`);r.refresh();
  }catch(e:any){setErro(e?.message||"Não foi possível salvar o equipamento.");}
  finally{setSalvando(false);trava.current=false;}
 }

 return <div className="page"><header className="simple-header"><div><p className="eyebrow">EQUIPAMENTO</p><h1>Novo equipamento</h1></div></header><form className="form-card" onSubmit={save}>
  <div className="field"><label>Local</label><select disabled={salvando} value={f.local_id} onChange={e=>setF({...f,local_id:e.target.value})}><option value="">Sem local</option>{locais.map(x=><option key={x.id} value={x.id}>{x.nome}</option>)}</select></div>
  <div className="field"><label>Ambiente *</label><input disabled={salvando} value={f.ambiente} onChange={e=>setF({...f,ambiente:e.target.value})}/></div>
  <div className="field-grid"><div className="field"><label>Tipo</label><select disabled={salvando} value={f.tipo} onChange={e=>setF({...f,tipo:e.target.value})}><option>Split Hi-Wall</option><option>Split Piso-Teto</option><option>Cassete</option><option>Janela</option><option>VRF/VRV</option><option>Outro</option></select></div><div className="field"><label>Capacidade BTU</label><input disabled={salvando} type="number" min="1" value={f.capacidade_btu} onChange={e=>setF({...f,capacidade_btu:e.target.value})}/></div></div>
  {["marca","modelo","numero_serie","patrimonio"].map(k=><div className="field" key={k}><label>{({marca:"Marca",modelo:"Modelo",numero_serie:"Número de série",patrimonio:"Patrimônio / ID"} as any)[k]}</label><input disabled={salvando} value={(f as any)[k]} onChange={e=>setF({...f,[k]:e.target.value})}/></div>)}
  <div className="field-grid"><div className="field"><label>Refrigerante</label><select disabled={salvando} value={f.refrigerante} onChange={e=>setF({...f,refrigerante:e.target.value})}><option value="">Selecione</option><option>R-22</option><option>R-410A</option><option>R-32</option><option>Outro</option></select></div><div className="field"><label>Tensão</label><select disabled={salvando} value={f.tensao} onChange={e=>setF({...f,tensao:e.target.value})}><option>127 V</option><option>220 V</option><option>380 V</option></select></div></div>
  <div className="field"><label>Observações</label><textarea disabled={salvando} rows={3} value={f.observacoes} onChange={e=>setF({...f,observacoes:e.target.value})}/></div>
  {erro&&<div className="error-box">{erro}</div>}
  <div className="form-actions"><button type="button" className="secondary-button" disabled={salvando} onClick={()=>r.back()}>Cancelar</button><button className="primary-button" disabled={salvando}>{salvando?"Salvando...":"Salvar equipamento"}</button></div>
 </form></div>
}
