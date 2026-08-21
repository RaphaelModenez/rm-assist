"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {useParams} from "next/navigation";
import {CHECKLIST_PREVENTIVA} from "@/lib/domain";
import {getSupabase} from "@/lib/supabase";

const medVazio={retorno:"",insuflamento:"",tensao:"",corrente:"",pressao_succao:"",pressao_descarga:"",superaquecimento:"",subresfriamento:"",observacoes:""};

export default function EquipamentosOS(){
 const {id}=useParams<{id:string}>();
 const [os,setOs]=useState<any>();
 const [equipamentos,setEquipamentos]=useState<any[]>([]);
 const [ativo,setAtivo]=useState("");
 const [exec,setExec]=useState<any>({});
 const [check,setCheck]=useState<any[]>([]);
 const [med,setMed]=useState<any>(medVazio);
 const [fotos,setFotos]=useState<any[]>([]);
 const [fotoUrls,setFotoUrls]=useState<Record<string,string>>({});
 const [erro,setErro]=useState("");
 const [salvo,setSalvo]=useState("");
 const [salvando,setSalvando]=useState(false);
 const [enviando,setEnviando]=useState(false);

 function num(v:any){if(v===null||v===undefined||v==="")return null;const n=Number(String(v).replace(",","."));return Number.isFinite(n)?n:null}
 const delta=useMemo(()=>{const a=num(med.retorno),b=num(med.insuflamento);return a!==null&&b!==null?(a-b).toFixed(1):"—"},[med.retorno,med.insuflamento]);

 async function loadEquipamentos(){
  const s=getSupabase();if(!s)return setErro("Supabase não configurado.");
  const {data:o,error:e0}=await s.from("ordens_servico").select("*").eq("id",id).single();
  if(e0)return setErro(e0.message);
  setOs(o);
  const {data:rels,error:e1}=await s.from("ordem_servico_equipamentos").select("equipamento_id").eq("ordem_servico_id",id);
  if(e1)return setErro(e1.message);
  const ids=(rels||[]).map((x:any)=>x.equipamento_id);
  if(!ids.length&&o.equipamento_id)ids.push(o.equipamento_id);
  if(!ids.length)return setEquipamentos([]);
  const {data:eq,error:e2}=await s.from("equipamentos").select("*").in("id",ids).order("ambiente");
  if(e2)return setErro(e2.message);
  setEquipamentos(eq||[]);
  if((eq||[]).length)setAtivo((eq||[])[0].id);
 }

 useEffect(()=>{loadEquipamentos()},[id]);

 useEffect(()=>{if(!ativo)return;(async()=>{
  const s=getSupabase();if(!s)return;
  setErro("");setSalvo("");
  const [{data:ex},{data:ck},{data:mm},{data:fo}]=await Promise.all([
   s.from("os_equipamento_execucao").select("*").eq("ordem_servico_id",id).eq("equipamento_id",ativo).maybeSingle(),
   s.from("checklist_itens").select("*").eq("ordem_servico_id",id).eq("equipamento_id",ativo).order("created_at"),
   s.from("medicoes").select("*").eq("ordem_servico_id",id).eq("equipamento_id",ativo).order("created_at",{ascending:false}).limit(1).maybeSingle(),
   s.from("fotos_servico").select("*").eq("ordem_servico_id",id).eq("equipamento_id",ativo).order("created_at")
  ]);
  setExec(ex||{diagnostico:"",servico_executado:"",recomendacoes:"",situacao_final:"",pendencias:""});
  setCheck((ck&&ck.length)?ck:CHECKLIST_PREVENTIVA.map(([categoria,item])=>({id:crypto.randomUUID(),categoria,item,status:"",observacao:""})));
  setMed(mm||medVazio);
  setFotos(fo||[]);
  const urls:Record<string,string>={};
  await Promise.all((fo||[]).map(async(f:any)=>{const {data}=await s.storage.from("fotos-servico").createSignedUrl(f.storage_path,3600);if(data?.signedUrl)urls[f.storage_path]=data.signedUrl}));
  setFotoUrls(prev=>({...prev,...urls}));
 })()},[ativo,id]);

 function ok(msg:string){setSalvo(msg);setTimeout(()=>setSalvo(""),1600)}

 async function salvarExecucao(){
  const s=getSupabase();if(!s||!ativo)return;
  setSalvando(true);setErro("");
  const {error}=await s.from("os_equipamento_execucao").upsert({
   ordem_servico_id:id,equipamento_id:ativo,
   diagnostico:exec.diagnostico||null,
   servico_executado:exec.servico_executado||null,
   recomendacoes:exec.recomendacoes||null,
   situacao_final:exec.situacao_final||null,
   pendencias:exec.pendencias||null,
   updated_at:new Date().toISOString()
  },{onConflict:"ordem_servico_id,equipamento_id"});
  setSalvando(false);if(error)setErro(error.message);else ok("Dados do equipamento salvos");
 }

 async function salvarChecklist(){
  const s=getSupabase();if(!s||!ativo)return;
  setSalvando(true);setErro("");
  const {error:e0}=await s.from("checklist_itens").delete().eq("ordem_servico_id",id).eq("equipamento_id",ativo);
  if(e0){setSalvando(false);return setErro(e0.message)}
  const rows=check.map(x=>({ordem_servico_id:id,equipamento_id:ativo,categoria:x.categoria||null,item:x.item||x.descricao||null,status:x.status||null,observacao:x.observacao||null,concluido:x.status==="conforme"}));
  const {error}=await s.from("checklist_itens").insert(rows);
  setSalvando(false);if(error)setErro(error.message);else ok("Checklist salvo");
 }

 async function salvarMedicoes(){
  const s=getSupabase();if(!s||!ativo)return;
  const payload={ordem_servico_id:id,equipamento_id:ativo,retorno:num(med.retorno),insuflamento:num(med.insuflamento),tensao:num(med.tensao),corrente:num(med.corrente),pressao_succao:num(med.pressao_succao),pressao_descarga:num(med.pressao_descarga),superaquecimento:num(med.superaquecimento),subresfriamento:num(med.subresfriamento),delta_t:delta==="—"?null:num(delta),observacoes:med.observacoes||null,updated_at:new Date().toISOString()};
  const {data,error}=med.id?await s.from("medicoes").update(payload).eq("id",med.id).select("*").single():await s.from("medicoes").insert(payload).select("*").single();
  if(error)setErro(error.message);else{if(data)setMed(data);ok("Medições salvas")}
 }

 async function enviarFotos(files:FileList|null,tipo:string){
  if(!files?.length||!ativo)return;
  const s=getSupabase();if(!s)return;
  setEnviando(true);setErro("");
  try{
   const novas:any[]=[];
   for(const file of Array.from(files)){
    const ext=(file.name.split(".").pop()||"jpg").toLowerCase();
    const path=`${id}/${ativo}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const {error:up}=await s.storage.from("fotos-servico").upload(path,file,{upsert:false});
    if(up)throw up;
    const {data:row,error:db}=await s.from("fotos_servico").insert({ordem_servico_id:id,equipamento_id:ativo,storage_path:path,legenda:"",tipo}).select("*").single();
    if(db)throw db;
    const {data:signed}=await s.storage.from("fotos-servico").createSignedUrl(path,3600);
    if(signed?.signedUrl)setFotoUrls(p=>({...p,[path]:signed.signedUrl}));
    novas.push(row);
   }
   setFotos(p=>[...p,...novas]);ok(files.length===1?"Foto adicionada":"Fotos adicionadas");
  }catch(e:any){setErro(e.message||"Erro ao enviar foto")}
  setEnviando(false);
 }

 async function salvarLegenda(f:any){
  const s=getSupabase();if(!s)return;
  const {error}=await s.from("fotos_servico").update({legenda:f.legenda||null}).eq("id",f.id);
  if(error)setErro(error.message);else ok("Legenda salva");
 }

 const eq=equipamentos.find(x=>x.id===ativo);

 if(erro&&!os)return <div className="page"><div className="error-box">{erro}</div></div>;
 if(!os)return <div className="page">Carregando OS...</div>;

 return <div className="page">
  <header className="simple-header">
   <div><p className="eyebrow">OS #{String(os.numero).padStart(4,"0")}</p><h1>Equipamentos atendidos</h1><p>{equipamentos.length} equipamento{equipamentos.length===1?"":"s"} nesta ordem de serviço.</p></div>
   <Link href={`/os/${id}`} className="secondary-button">Conclusão da OS</Link>
  </header>

  {erro&&<div className="error-box">{erro}</div>}
  {salvo&&<div className="success-box">{salvo}</div>}

  <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:10,marginBottom:14}}>
   {equipamentos.map((x:any)=><button key={x.id} type="button" className={ativo===x.id?"primary-button":"secondary-button"} onClick={()=>setAtivo(x.id)} style={{whiteSpace:"nowrap"}}>{x.ambiente||x.tipo||"Equipamento"}</button>)}
  </div>

  {eq&&<section className="info-card" style={{marginBottom:14}}>
   <h3>{eq.ambiente||"Equipamento"}</h3>
   <p>{[eq.tipo,eq.marca,eq.modelo,eq.capacidade_btu?`${eq.capacidade_btu} BTU`:null,eq.refrigerante].filter(Boolean).join(" • ")}</p>
   {eq.numero_serie&&<small>Nº de série: {eq.numero_serie}</small>}
  </section>}

  <section className="form-card">
   <h3>Diagnóstico e execução</h3>
   <div className="field"><label>Condição encontrada / diagnóstico</label><textarea rows={4} value={exec.diagnostico||""} onChange={e=>setExec({...exec,diagnostico:e.target.value})}/></div>
   <div className="field"><label>Serviço executado</label><textarea rows={4} value={exec.servico_executado||""} onChange={e=>setExec({...exec,servico_executado:e.target.value})}/></div>
   <div className="field"><label>Recomendações</label><textarea rows={3} value={exec.recomendacoes||""} onChange={e=>setExec({...exec,recomendacoes:e.target.value})}/></div>
   <div className="field"><label>Situação final</label><select value={exec.situacao_final||""} onChange={e=>setExec({...exec,situacao_final:e.target.value})}><option value="">Selecione</option><option>Operando normalmente</option><option>Operando com ressalvas</option><option>Equipamento parado</option><option>Aguardando peça</option></select></div>
   <div className="field"><label>Pendências</label><textarea rows={2} value={exec.pendencias||""} onChange={e=>setExec({...exec,pendencias:e.target.value})}/></div>
   <button type="button" className="primary-button" disabled={salvando} onClick={salvarExecucao}>{salvando?"Salvando...":"Salvar dados do equipamento"}</button>
  </section>

  <section className="form-card">
   <h3>Checklist</h3>
   <div className="checklist">{check.map((x:any,i:number)=><div className="check-row" key={x.id||i}><div><strong>{x.item||x.descricao}</strong><small>{x.categoria}</small></div><select value={x.status||""} onChange={e=>setCheck(check.map((a:any,j:number)=>j===i?{...a,status:e.target.value}:a))}><option value="">—</option><option value="conforme">Conforme</option><option value="nao_conforme">Não conforme</option><option value="na">N/A</option></select></div>)}</div>
   <button type="button" className="secondary-button" disabled={salvando} onClick={salvarChecklist}>Salvar checklist</button>
  </section>

  <section className="form-card">
   <h3>Medições técnicas</h3>
   <div className="field-grid">
    {[["retorno","Retorno °C"],["insuflamento","Insuflamento °C"],["tensao","Tensão V"],["corrente","Corrente A"],["pressao_succao","Pressão sucção"],["pressao_descarga","Pressão descarga"],["superaquecimento","Superaquecimento °C"],["subresfriamento","Sub-resfriamento °C"]].map(([k,l])=><div className="field" key={k}><label>{l}</label><input inputMode="decimal" value={med[k]??""} onChange={e=>setMed({...med,[k]:e.target.value})}/></div>)}
   </div>
   <p><b>ΔT:</b> {delta} °C</p>
   <div className="field"><label>Observações</label><textarea rows={2} value={med.observacoes||""} onChange={e=>setMed({...med,observacoes:e.target.value})}/></div>
   <button type="button" className="secondary-button" onClick={salvarMedicoes}>Salvar medições</button>
  </section>

  <section className="form-card">
   <h3>Fotos deste equipamento</h3>
   <p className="muted" style={{marginTop:-4}}>Você pode tirar uma foto na hora ou escolher imagens já salvas no celular.</p>
   <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
    <label className="secondary-button">+ Foto antes<input hidden type="file" accept="image/*" multiple onChange={e=>{enviarFotos(e.target.files,"diagnostico");e.currentTarget.value=""}}/></label>
    <label className="secondary-button">+ Foto durante/depois<input hidden type="file" accept="image/*" multiple onChange={e=>{enviarFotos(e.target.files,"execucao");e.currentTarget.value=""}}/></label>
   </div>
   {enviando&&<p className="muted">Enviando foto...</p>}
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:12}}>
    {fotos.map((f:any)=><div key={f.id} style={{display:"grid",gap:6}}><img src={fotoUrls[f.storage_path]||""} alt="" style={{width:"100%",aspectRatio:"4 / 3",objectFit:"cover",borderRadius:12}}/><small>{f.tipo==="diagnostico"?"Antes / diagnóstico":"Durante / depois"}</small><input placeholder="Ex.: Antes da limpeza" value={f.legenda||""} onChange={e=>setFotos(fs=>fs.map(x=>x.id===f.id?{...x,legenda:e.target.value}:x))}/><button type="button" className="secondary-button" onClick={()=>salvarLegenda(f)}>Salvar legenda</button></div>)}
   </div>
  </section>

  <div style={{display:"flex",justifyContent:"space-between",gap:10,flexWrap:"wrap",marginTop:16}}>
   <Link href="/servicos" className="secondary-button">Voltar aos serviços</Link>
   <Link href={`/os/${id}`} className="primary-button">Ir para conclusão da OS →</Link>
  </div>
 </div>
}
