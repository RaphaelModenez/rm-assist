"use client";
import Link from "next/link";
import {FormEvent,Suspense,useEffect,useState} from "react";
import {useRouter,useSearchParams} from "next/navigation";
import ClientPicker from "@/components/ClientPicker";
import {getSupabase} from "@/lib/supabase";
import {PRIORIDADES,TIPOS_SERVICO} from "@/lib/domain";

function NovoChamadoContent(){
 const r=useRouter(),sp=useSearchParams();
 const [erro,setErro]=useState(""),[salvando,setSalvando]=useState(false);
 const [selecionados,setSelecionados]=useState<string[]>([]);
 const [locais,setLocais]=useState<any[]>([]),[eqs,setEqs]=useState<any[]>([]);
 const [f,setF]=useState({cliente_id:sp.get("cliente")||"",local_id:"",descricao:"",tipo_servico:"Manutenção corretiva",prioridade:"Normal",data_agendada:"",hora_agendada:"",duracao_prevista_min:"120",observacoes:""});

 useEffect(()=>{(async()=>{
  if(!f.cliente_id){setLocais([]);setEqs([]);setSelecionados([]);return}
  const s=getSupabase();if(!s)return;
  const [{data:loc},{data:eq}]=await Promise.all([
   s.from("locais").select("id,nome").eq("cliente_id",f.cliente_id).order("nome"),
   s.from("equipamentos").select("id,local_id,ambiente,marca,modelo,capacidade_btu").eq("cliente_id",f.cliente_id).eq("ativo",true).order("ambiente")
  ]);
  setLocais(loc||[]);setEqs(eq||[]);setSelecionados([]);
 })()},[f.cliente_id]);

 const lista=f.local_id?eqs.filter((x:any)=>x.local_id===f.local_id):eqs;
 const todos=lista.length>0&&lista.every((x:any)=>selecionados.includes(x.id));
 function alternar(id:string){setSelecionados(a=>a.includes(id)?a.filter(x=>x!==id):[...a,id])}
 function alternarTodos(){const ids=lista.map((x:any)=>x.id);setSelecionados(a=>todos?a.filter(x=>!ids.includes(x)):Array.from(new Set([...a,...ids])))}

 async function save(e:FormEvent){
  e.preventDefault();
  if(!f.cliente_id||!f.descricao.trim())return setErro("Informe o cliente e a solicitação.");
  const s=getSupabase();if(!s)return setErro("Supabase não configurado.");
  setSalvando(true);setErro("");
  try{
   const {data:ch,error}=await s.from("chamados").insert({
    cliente_id:f.cliente_id,local_id:f.local_id||null,
    equipamento_id:selecionados.length===1?selecionados[0]:null,
    descricao:f.descricao.trim(),tipo_servico:f.tipo_servico,prioridade:f.prioridade,
    status:f.data_agendada?"agendado":"aberto",data_agendada:f.data_agendada||null,
    hora_agendada:f.hora_agendada||null,duracao_prevista_min:f.duracao_prevista_min?Number(f.duracao_prevista_min):null,
    observacoes:f.observacoes||null
   }).select("id").single();
   if(error)throw error;
   if(selecionados.length){
    const {error:re}=await s.from("chamado_equipamentos").insert(selecionados.map(equipamento_id=>({chamado_id:ch.id,equipamento_id})));
    if(re){await s.from("chamados").delete().eq("id",ch.id);throw re}
   }
   r.push("/servicos");r.refresh();
  }catch(e:any){setErro(e?.message||"Não foi possível criar o chamado.")}
  finally{setSalvando(false)}
 }

 return <div className="page">
  <header className="simple-header"><div><p className="eyebrow">NOVO CHAMADO</p><h1>Dados e agendamento</h1><p>Selecione um ou vários equipamentos.</p></div></header>
  <form className="form-card" onSubmit={save}>
   <div className="field"><label>Cliente *</label><ClientPicker value={f.cliente_id} onChange={v=>{setF({...f,cliente_id:v,local_id:""});setSelecionados([])}}/><div style={{marginTop:10}}><Link href="/clientes/novo?retorno=chamado" className="secondary-button">+ Cadastrar novo cliente</Link></div></div>
   <div className="field"><label>Local</label><select value={f.local_id} onChange={e=>{setF({...f,local_id:e.target.value});setSelecionados([])}}><option value="">Todos os locais</option>{locais.map(x=><option key={x.id} value={x.id}>{x.nome}</option>)}</select></div>
   <div className="field">
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:8}}><label style={{margin:0}}>Equipamentos do atendimento</label>{lista.length>0&&<button type="button" className="secondary-button" onClick={alternarTodos}>{todos?"Desmarcar todos":"Selecionar todos"}</button>}</div>
    {lista.length===0?<div className="muted">Nenhum equipamento ativo encontrado.</div>:<div style={{display:"grid",gap:8}}>{lista.map((x:any)=><label key={x.id} style={{display:"flex",gap:10,padding:"12px 14px",border:"1px solid #e5e7eb",borderRadius:12}}><input type="checkbox" checked={selecionados.includes(x.id)} onChange={()=>alternar(x.id)}/><span><strong>{x.ambiente||"Equipamento"}</strong><small style={{display:"block"}}>{[x.marca,x.modelo,x.capacidade_btu?`${x.capacidade_btu} BTU`:null].filter(Boolean).join(" • ")}</small></span></label>)}</div>}
    <small style={{display:"block",marginTop:8,fontWeight:700}}>{selecionados.length} equipamento{selecionados.length===1?"":"s"} selecionado{selecionados.length===1?"":"s"}</small>
   </div>
   <div className="field"><label>Solicitação / problema *</label><textarea rows={4} value={f.descricao} onChange={e=>setF({...f,descricao:e.target.value})} placeholder="Ex.: limpeza e higienização preventiva..."/></div>
   <div className="field-grid"><div className="field"><label>Tipo de serviço</label><select value={f.tipo_servico} onChange={e=>setF({...f,tipo_servico:e.target.value})}>{TIPOS_SERVICO.map(x=><option key={x}>{x}</option>)}</select></div><div className="field"><label>Prioridade</label><select value={f.prioridade} onChange={e=>setF({...f,prioridade:e.target.value})}>{PRIORIDADES.map(x=><option key={x}>{x}</option>)}</select></div></div>
   <h3 className="form-section-title">Agendamento</h3>
   <div className="field-grid"><div className="field"><label>Data</label><input type="date" value={f.data_agendada} onChange={e=>setF({...f,data_agendada:e.target.value})}/></div><div className="field"><label>Horário</label><input type="time" value={f.hora_agendada} onChange={e=>setF({...f,hora_agendada:e.target.value})}/></div></div>
   <div className="field"><label>Duração prevista (min)</label><input type="number" value={f.duracao_prevista_min} onChange={e=>setF({...f,duracao_prevista_min:e.target.value})}/></div>
   <div className="field"><label>Observações</label><textarea rows={3} value={f.observacoes} onChange={e=>setF({...f,observacoes:e.target.value})}/></div>
   {erro&&<div className="error-box">{erro}</div>}
   <div className="form-actions"><button type="button" className="secondary-button" disabled={salvando} onClick={()=>r.back()}>Cancelar</button><button className="primary-button" disabled={salvando}>{salvando?"Criando...":"Criar chamado"}</button></div>
  </form>
 </div>
}
export default function NovoChamado(){return <Suspense fallback={<div className="page">Carregando...</div>}><NovoChamadoContent/></Suspense>}
