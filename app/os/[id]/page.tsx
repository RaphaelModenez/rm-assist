"use client";
import {useEffect,useMemo,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import {CHECKLIST_PREVENTIVA,moeda} from "@/lib/domain";
import {getSupabase} from "@/lib/supabase";

export default function OSPage(){
  const {id}=useParams<{id:string}>();
  const r=useRouter();
  const [os,setOs]=useState<any>();
  const [cliente,setCliente]=useState<any>();
  const [eq,setEq]=useState<any>();
  const [tab,setTab]=useState("diagnostico");
  const [check,setCheck]=useState<any[]>([]);
  const [med,setMed]=useState<any>({retorno:"",insuflamento:"",tensao:"",corrente:"",pressao_succao:"",pressao_descarga:"",superaquecimento:"",subresfriamento:"",observacoes:""});
  const [material,setMaterial]=useState({descricao:"",quantidade:"1",valor_unitario:""});
  const [mats,setMats]=useState<any[]>([]);
  const [assinatura,setAssinatura]=useState("");
  const [erro,setErro]=useState("");
  const [salvando,setSalvando]=useState(false);

  useEffect(()=>{(async()=>{
    const s=getSupabase(); if(!s)return setErro("Supabase não configurado.");
    const {data:o,error:e0}=await s.from("ordens_servico").select("*").eq("id",id).single();
    if(e0)return setErro(e0.message);
    setOs(o); setAssinatura(o.responsavel_cliente||"");
    const [{data:c},{data:e},{data:ck},{data:mm},{data:ma}] = await Promise.all([
      s.from("clientes").select("*").eq("id",o.cliente_id).single(),
      o.equipamento_id?s.from("equipamentos").select("*").eq("id",o.equipamento_id).single():Promise.resolve({data:null} as any),
      s.from("checklist_itens").select("*").eq("ordem_servico_id",id).order("created_at"),
      s.from("medicoes").select("*").eq("ordem_servico_id",id).order("created_at",{ascending:false}).limit(1).maybeSingle(),
      s.from("materiais_servico").select("*").eq("ordem_servico_id",id).order("created_at",{ascending:false})
    ]);
    setCliente(c); setEq(e);
    setCheck((ck&&ck.length)?ck:CHECKLIST_PREVENTIVA.map(([categoria,item])=>({id:crypto.randomUUID(),ordem_servico_id:id,categoria,item,status:"",observacao:""})));
    if(mm)setMed(mm); setMats(ma||[]);
  })()},[id]);

  const delta=useMemo(()=>med.retorno!==""&&med.insuflamento!==""?(Number(med.retorno)-Number(med.insuflamento)).toFixed(1):"—",[med.retorno,med.insuflamento]);
  if(erro)return <div className="page"><div className="error-box">{erro}</div></div>;
  if(!os)return <div className="page">Carregando OS...</div>;

  async function patchOS(fields:any){
    const s=getSupabase(); if(!s)return;
    const next={...os,...fields}; setOs(next);
    const {error}=await s.from("ordens_servico").update({...fields,updated_at:new Date().toISOString()}).eq("id",id);
    if(error)setErro(error.message);
  }

  async function saveChecklist(){
    const s=getSupabase(); if(!s)return;
    setSalvando(true); setErro("");
    await s.from("checklist_itens").delete().eq("ordem_servico_id",id);
    const rows=check.map(x=>({ordem_servico_id:id,categoria:x.categoria||null,item:x.item||x.descricao||null,status:x.status||null,observacao:x.observacao||null,concluido:x.status==="conforme"}));
    const {error}=await s.from("checklist_itens").insert(rows);
    setSalvando(false); if(error)setErro(error.message);
  }

  async function saveMed(){
    const s=getSupabase(); if(!s)return;
    const payload={ordem_servico_id:id,retorno:med.retorno===""?null:Number(med.retorno),insuflamento:med.insuflamento===""?null:Number(med.insuflamento),tensao:med.tensao===""?null:Number(med.tensao),corrente:med.corrente===""?null:Number(med.corrente),pressao_succao:med.pressao_succao===""?null:Number(med.pressao_succao),pressao_descarga:med.pressao_descarga===""?null:Number(med.pressao_descarga),superaquecimento:med.superaquecimento===""?null:Number(med.superaquecimento),subresfriamento:med.subresfriamento===""?null:Number(med.subresfriamento),delta_t:delta==="—"?null:Number(delta),observacoes:med.observacoes||null,updated_at:new Date().toISOString()};
    const {error}=med.id?await s.from("medicoes").update(payload).eq("id",med.id):await s.from("medicoes").insert(payload);
    if(error)setErro(error.message);
  }

  async function addMat(){
    if(!material.descricao)return;
    const s=getSupabase(); if(!s)return;
    const q=Number(material.quantidade||1), vu=Number(material.valor_unitario||0);
    const {data,error}=await s.from("materiais_servico").insert({ordem_servico_id:id,descricao:material.descricao,quantidade:q,valor_unitario:vu,valor_total:q*vu}).select("*").single();
    if(error)return setErro(error.message);
    setMats([data,...mats]); setMaterial({descricao:"",quantidade:"1",valor_unitario:""});
  }

  async function finalizar(){
    const s=getSupabase(); if(!s)return;
    setSalvando(true); setErro("");
    const {error}=await s.from("ordens_servico").update({status:"concluida",data_fim:new Date().toISOString(),responsavel_cliente:assinatura||null,updated_at:new Date().toISOString()}).eq("id",id);
    if(error){setSalvando(false);return setErro(error.message)}
    if(os.chamado_id)await s.from("chamados").update({status:"concluido",updated_at:new Date().toISOString()}).eq("id",os.chamado_id);
    setSalvando(false); r.push(`/os/${id}/relatorio`);
  }

  return <div className="page">
    <header className="simple-header"><div><p className="eyebrow">ORDEM DE SERVIÇO</p><h1>OS #{String(os.numero).padStart(4,"0")}</h1><p>{cliente?.nome_fantasia||cliente?.nome} • {eq?.ambiente||os.tipo_servico}</p></div><span className={`status-chip ${os.status}`}>{String(os.status).replace("_"," ")}</span></header>
    {erro&&<div className="error-box">{erro}</div>}
    <div className="step-tabs">{[["diagnostico","Diagnóstico"],["checklist","Checklist"],["medicoes","Medições"],["execucao","Execução"],["conclusao","Conclusão"]].map(([k,l])=><button className={tab===k?"active":""} onClick={()=>setTab(k)} key={k}>{l}</button>)}</div>

    {tab==="diagnostico"&&<section className="form-card"><h3>Diagnóstico inicial</h3><div className="field"><label>Diagnóstico / condição encontrada</label><textarea rows={6} value={os.diagnostico||""} onChange={e=>setOs({...os,diagnostico:e.target.value})} onBlur={()=>patchOS({diagnostico:os.diagnostico||null})}/></div></section>}

    {tab==="checklist"&&<section className="form-card"><h3>Checklist de manutenção</h3><div className="check-list">{check.map((x,i)=><div className="check-row" key={x.id}><div><strong>{x.item||x.descricao}</strong><small>{x.categoria||""}</small></div><select value={x.status||""} onChange={e=>{const a=[...check];a[i]={...x,status:e.target.value};setCheck(a)}}><option value="">Selecionar</option><option value="conforme">Conforme</option><option value="nao_conforme">Não conforme</option><option value="na">N/A</option></select></div>)}</div><button className="primary-button" disabled={salvando} onClick={saveChecklist}>Salvar checklist</button></section>}

    {tab==="medicoes"&&<section className="form-card"><h3>Medições técnicas</h3><div className="measure-grid">{[["retorno","Retorno °C"],["insuflamento","Insuflamento °C"],["tensao","Tensão V"],["corrente","Corrente A"],["pressao_succao","Sucção"],["pressao_descarga","Descarga"],["superaquecimento","Superaquecimento °C"],["subresfriamento","Sub-resfriamento °C"]].map(([k,l])=><div className="field" key={k}><label>{l}</label><input inputMode="decimal" value={med[k]??""} onChange={e=>setMed({...med,[k]:e.target.value})}/></div>)}</div><div className="delta-card">ΔT calculado: <strong>{delta} °C</strong></div><div className="field"><label>Observações</label><textarea rows={3} value={med.observacoes||""} onChange={e=>setMed({...med,observacoes:e.target.value})}/></div><button className="primary-button" onClick={saveMed}>Salvar medições</button></section>}

    {tab==="execucao"&&<section className="form-card"><h3>Execução do serviço</h3><div className="field"><label>Serviço executado</label><textarea rows={6} value={os.servico_executado||""} onChange={e=>setOs({...os,servico_executado:e.target.value})} onBlur={()=>patchOS({servico_executado:os.servico_executado||null})}/></div><h3 className="form-section-title">Materiais / peças</h3><div className="field-grid"><div className="field"><label>Descrição</label><input value={material.descricao} onChange={e=>setMaterial({...material,descricao:e.target.value})}/></div><div className="field"><label>Quantidade</label><input type="number" value={material.quantidade} onChange={e=>setMaterial({...material,quantidade:e.target.value})}/></div></div><div className="field"><label>Valor unitário</label><input inputMode="decimal" value={material.valor_unitario} onChange={e=>setMaterial({...material,valor_unitario:e.target.value})}/></div><button type="button" className="secondary-button" onClick={addMat}>+ Adicionar material</button>{mats.map(m=><div className="material-line" key={m.id}><span>{m.quantidade} × {m.descricao}</span><strong>{moeda(m.valor_total)}</strong></div>)}<div className="field"><label>Recomendações</label><textarea rows={3} value={os.recomendacoes||""} onChange={e=>setOs({...os,recomendacoes:e.target.value})} onBlur={()=>patchOS({recomendacoes:os.recomendacoes||null})}/></div></section>}

    {tab==="conclusao"&&<section className="form-card"><h3>Conclusão</h3><div className="field"><label>Situação final do equipamento</label><select value={os.situacao_final||""} onChange={e=>{setOs({...os,situacao_final:e.target.value});patchOS({situacao_final:e.target.value})}}><option value="">Selecione</option><option>Operando normalmente</option><option>Operando com ressalvas</option><option>Equipamento parado</option><option>Aguardando peça / retorno</option></select></div><div className="field"><label>Pendências</label><textarea rows={3} value={os.pendencias||""} onChange={e=>setOs({...os,pendencias:e.target.value})} onBlur={()=>patchOS({pendencias:os.pendencias||null})}/></div><div className="field-grid"><div className="field"><label>Valor do serviço (R$)</label><input inputMode="decimal" value={os.valor_servico??""} onChange={e=>setOs({...os,valor_servico:e.target.value})} onBlur={()=>patchOS({valor_servico:Number(os.valor_servico||0)})}/></div><div className="field"><label>Forma de pagamento</label><select value={os.forma_pagamento||""} onChange={e=>{setOs({...os,forma_pagamento:e.target.value});patchOS({forma_pagamento:e.target.value||null})}}><option value="">Selecione</option><option>PIX</option><option>Dinheiro</option><option>Cartão</option><option>Boleto</option><option>Faturado</option></select></div></div><div className="field"><label>Responsável pelo cliente / aceite</label><input value={assinatura} onChange={e=>setAssinatura(e.target.value)} placeholder="Nome de quem acompanhou o serviço"/></div><button className="primary-button full-button" disabled={salvando} onClick={finalizar}>{salvando?"Finalizando...":"Finalizar OS e gerar relatório"}</button></section>}
  </div>
}
