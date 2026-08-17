"use client";
import {useEffect,useMemo,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import {CHECKLIST_PREVENTIVA,moeda} from "@/lib/domain";
import {getSupabase} from "@/lib/supabase";

export default function OSPage(){
  function numBR(v:any){
    if(v===null||v===undefined||v==="")return null;
    const n=Number(String(v).trim().replace(",","."));
    return Number.isFinite(n)?n:null;
  }
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
  const [fotos,setFotos]=useState<any[]>([]);
  const [assinatura,setAssinatura]=useState("");
  const [erro,setErro]=useState("");
  const [salvando,setSalvando]=useState(false);
  const [enviandoFoto,setEnviandoFoto]=useState(false);
  const [salvo,setSalvo]=useState("");
  const [fotoUrls,setFotoUrls]=useState<Record<string,string>>({});

  useEffect(()=>{(async()=>{
    const s=getSupabase(); if(!s)return setErro("Supabase não configurado.");
    const {data:o,error:e0}=await s.from("ordens_servico").select("*").eq("id",id).single();
    if(e0)return setErro(e0.message);
    setOs(o); setAssinatura(o.responsavel_cliente||"");
    const [{data:c},{data:e},{data:ck},{data:mm},{data:ma},{data:fo}] = await Promise.all([
      s.from("clientes").select("*").eq("id",o.cliente_id).single(),
      o.equipamento_id?s.from("equipamentos").select("*").eq("id",o.equipamento_id).single():Promise.resolve({data:null} as any),
      s.from("checklist_itens").select("*").eq("ordem_servico_id",id).order("created_at"),
      s.from("medicoes").select("*").eq("ordem_servico_id",id).order("created_at",{ascending:false}).limit(1).maybeSingle(),
      s.from("materiais_servico").select("*").eq("ordem_servico_id",id).order("created_at",{ascending:false}),
      s.from("fotos_servico").select("*").eq("ordem_servico_id",id).order("created_at",{ascending:false})
    ]);
    setCliente(c); setEq(e);
    setCheck((ck&&ck.length)?ck:CHECKLIST_PREVENTIVA.map(([categoria,item])=>({id:crypto.randomUUID(),ordem_servico_id:id,categoria,item,status:"",observacao:""})));
    if(mm)setMed(mm); setMats(ma||[]); setFotos(fo||[]);
    const urls:Record<string,string>={};
    await Promise.all((fo||[]).map(async(f:any)=>{
      const {data}=await s.storage.from("fotos-servico").createSignedUrl(f.storage_path,3600);
      if(data?.signedUrl)urls[f.storage_path]=data.signedUrl;
    }));
    setFotoUrls(urls);
  })()},[id]);

  const delta=useMemo(()=>{
    const ret=numBR(med.retorno), ins=numBR(med.insuflamento);
    return ret!==null&&ins!==null?(ret-ins).toFixed(1):"—";
  },[med.retorno,med.insuflamento]);
  if(erro)return <div className="page"><div className="error-box">{erro}</div></div>;
  if(!os)return <div className="page">Carregando OS...</div>;

  async function patchOS(fields:any){
    const s=getSupabase(); if(!s)return false;
    const next={...os,...fields}; setOs(next);
    setSalvando(true); setErro(""); setSalvo("");
    const {error}=await s.from("ordens_servico").update({...fields,updated_at:new Date().toISOString()}).eq("id",id);
    setSalvando(false);
    if(error){setErro(error.message);return false}
    setSalvo("Alterações salvas");
    setTimeout(()=>setSalvo(""),1800);
    return true;
  }

  async function saveExecucao(){
    if(salvando)return;
    const s=getSupabase(); if(!s)return setErro("Supabase não configurado.");
    const servico=String(os.servico_executado||"").trim();
    if(!servico)return setErro("Descreva o serviço executado antes de salvar.");

    setSalvando(true); setErro(""); setSalvo("");
    try{
      const {data,error}=await s.from("ordens_servico")
        .update({
          servico_executado:servico,
          recomendacoes:os.recomendacoes||null,
          updated_at:new Date().toISOString()
        })
        .eq("id",id)
        .select("id,servico_executado,recomendacoes")
        .single();

      if(error)throw error;
      if(!data?.id)throw new Error("A OS não foi confirmada após o salvamento.");

      setOs((atual:any)=>({...atual,
        servico_executado:data.servico_executado,
        recomendacoes:data.recomendacoes
      }));
      setSalvo("Execução salva com sucesso");
      setTimeout(()=>setSalvo(""),1800);
    }catch(e:any){
      setErro(e?.message||"Não foi possível salvar a execução.");
    }finally{
      setSalvando(false);
    }
  }

  async function uploadFotos(files:FileList|null,tipo:string){
    if(!files?.length)return;
    const s=getSupabase(); if(!s)return setErro("Supabase não configurado.");
    setEnviandoFoto(true); setErro("");
    try{
      const novas:any[]=[];
      for(const file of Array.from(files)){
        if(file.size>10*1024*1024) throw new Error("Cada foto deve ter no máximo 10 MB.");
        const ext=(file.name.split(".").pop()||"jpg").toLowerCase();
        const path=`${id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
        const {error:upErr}=await s.storage.from("fotos-servico").upload(path,file,{cacheControl:"3600",upsert:false});
        if(upErr)throw upErr;
        const {data:row,error:dbErr}=await s.from("fotos_servico").insert({ordem_servico_id:id,storage_path:path,legenda:file.name,tipo}).select("*").single();
        if(dbErr)throw dbErr;
        const {data:signed}=await s.storage.from("fotos-servico").createSignedUrl(path,3600);
        if(signed?.signedUrl)setFotoUrls(prev=>({...prev,[path]:signed.signedUrl}));
        novas.push(row);
      }
      setFotos([...novas,...fotos]);
    }catch(e:any){setErro(e.message||"Erro ao enviar foto.")}
    setEnviandoFoto(false);
  }

  async function removerFoto(f:any){
    const s=getSupabase(); if(!s)return;
    const {error:e1}=await s.storage.from("fotos-servico").remove([f.storage_path]);
    if(e1)return setErro(e1.message);
    const {error:e2}=await s.from("fotos_servico").delete().eq("id",f.id);
    if(e2)return setErro(e2.message);
    setFotos(fotos.filter(x=>x.id!==f.id));
  }

  function fotoUrl(f:any){
    return fotoUrls[f.storage_path]||"";
  }

  async function salvarLegendaFoto(f:any,legenda:string){
    const s=getSupabase(); if(!s)return setErro("Supabase não configurado.");
    setErro(""); setSalvo("");
    const texto=String(legenda||"").trim();
    const {data,error}=await s.from("fotos_servico")
      .update({legenda:texto||null})
      .eq("id",f.id)
      .select("id,legenda")
      .single();

    if(error)return setErro(error.message);
    setFotos(atual=>atual.map((x:any)=>x.id===f.id?{...x,legenda:data?.legenda||""}:x));
    setSalvo("Legenda da foto salva");
    setTimeout(()=>setSalvo(""),1800);
  }

  async function saveChecklist(){
    const s=getSupabase(); if(!s)return;
    setSalvando(true); setErro("");
    await s.from("checklist_itens").delete().eq("ordem_servico_id",id);
    const rows=check.map(x=>({ordem_servico_id:id,categoria:x.categoria||null,item:x.item||x.descricao||null,status:x.status||null,observacao:x.observacao||null,concluido:x.status==="conforme"}));
    const {error}=await s.from("checklist_itens").insert(rows);
    setSalvando(false); if(error)setErro(error.message); else {setSalvo("Checklist salvo");setTimeout(()=>setSalvo(""),1800)}
  }

  async function saveMed(){
    const s=getSupabase(); if(!s)return;
    const payload={ordem_servico_id:id,retorno:numBR(med.retorno),insuflamento:numBR(med.insuflamento),tensao:numBR(med.tensao),corrente:numBR(med.corrente),pressao_succao:numBR(med.pressao_succao),pressao_descarga:numBR(med.pressao_descarga),superaquecimento:numBR(med.superaquecimento),subresfriamento:numBR(med.subresfriamento),delta_t:delta==="—"?null:numBR(delta),observacoes:med.observacoes||null,updated_at:new Date().toISOString()};
    const {data,error}=med.id?await s.from("medicoes").update(payload).eq("id",med.id).select("*").single():await s.from("medicoes").insert(payload).select("*").single();
    if(error)setErro(error.message); else {if(data)setMed(data);setSalvo("Medições salvas");setTimeout(()=>setSalvo(""),1800)}
  }

  async function addMat(){
    if(!material.descricao)return;
    const s=getSupabase(); if(!s)return;
    const q=numBR(material.quantidade)||1, vu=numBR(material.valor_unitario)||0;
    if(q<=0)return setErro("Informe uma quantidade válida.");
    const {data,error}=await s.from("materiais_servico").insert({ordem_servico_id:id,descricao:material.descricao,quantidade:q,valor_unitario:vu,valor_total:q*vu}).select("*").single();
    if(error)return setErro(error.message);
    setMats([data,...mats]); setMaterial({descricao:"",quantidade:"1",valor_unitario:""});
  }

  async function finalizar(){
    if(salvando||enviandoFoto)return;
    if(!os.situacao_final)return setErro("Informe a situação final do equipamento antes de concluir a OS.");
    const valor=numBR(os.valor_servico);
    if(os.valor_servico!=="" && os.valor_servico!==null && os.valor_servico!==undefined && valor===null){
      return setErro("Informe um valor de serviço válido. Você pode usar vírgula, por exemplo: 150,00.");
    }
    const s=getSupabase(); if(!s)return;
    setSalvando(true); setErro(""); setSalvo("");
    const fechamento={
      diagnostico:os.diagnostico||null,
      servico_executado:os.servico_executado||null,
      recomendacoes:os.recomendacoes||null,
      situacao_final:os.situacao_final||null,
      pendencias:os.pendencias||null,
      valor_servico:valor||0,
      forma_pagamento:os.forma_pagamento||null,
      responsavel_cliente:assinatura||null,
      status:"concluida",
      data_fim:new Date().toISOString(),
      updated_at:new Date().toISOString()
    };
    const {error}=await s.from("ordens_servico").update(fechamento).eq("id",id);
    if(error){setSalvando(false);return setErro(error.message)}
    if(os.chamado_id){
      const {error:e2}=await s.from("chamados").update({status:"concluido",updated_at:new Date().toISOString()}).eq("id",os.chamado_id);
      if(e2){setSalvando(false);return setErro("A OS foi concluída, mas o chamado não pôde ser atualizado: "+e2.message)}
    }
    setSalvando(false); r.push(`/os/${id}/relatorio`);
  }

  return <div className="page">
    <header className="simple-header"><div><p className="eyebrow">ORDEM DE SERVIÇO</p><h1>OS #{String(os.numero).padStart(4,"0")}</h1><p>{cliente?.nome_fantasia||cliente?.nome} • {eq?.ambiente||os.tipo_servico}</p></div><span className={`status-chip ${os.status}`}>{String(os.status).replace("_"," ")}</span></header>
    {erro&&<div className="error-box">{erro}</div>}
    {salvo&&<div style={{background:"#eaf8f0",color:"#18794e",border:"1px solid #c8ecd8",borderRadius:12,padding:10,marginBottom:14,fontSize:14,fontWeight:700}}>{salvo}</div>}
    <div className="step-tabs">{[["diagnostico","Diagnóstico"],["checklist","Checklist"],["medicoes","Medições"],["execucao","Execução"],["conclusao","Conclusão"]].map(([k,l])=><button className={tab===k?"active":""} onClick={()=>setTab(k)} key={k}>{l}</button>)}</div>

    {tab==="diagnostico"&&<section className="form-card"><h3>Diagnóstico inicial</h3><div className="field"><label>Diagnóstico / condição encontrada</label><textarea rows={6} value={os.diagnostico||""} onChange={e=>setOs({...os,diagnostico:e.target.value})}/></div><button type="button" className="secondary-button" disabled={salvando} onClick={()=>patchOS({diagnostico:os.diagnostico||null})}>{salvando?"Salvando...":"Salvar diagnóstico"}</button><div className="photo-input"><label>Fotos do diagnóstico</label><input type="file" accept="image/*" capture="environment" multiple onChange={e=>uploadFotos(e.target.files,"diagnostico")}/>{enviandoFoto&&<small>Enviando foto...</small>}</div>{fotos.filter(f=>f.tipo==="diagnostico").length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:12,marginTop:14}}>{fotos.filter(f=>f.tipo==="diagnostico").map(f=><div style={{display:"flex",flexDirection:"column",gap:8}} key={f.id}><img style={{width:"100%",aspectRatio:"4 / 3",objectFit:"cover",borderRadius:14,border:"1px solid #e5e7eb"}} src={fotoUrl(f)} alt={f.legenda||"Foto"}/><input placeholder="Ex.: Antes da limpeza" value={f.legenda||""} onChange={e=>setFotos(atual=>atual.map((x:any)=>x.id===f.id?{...x,legenda:e.target.value}:x))}/><button type="button" className="secondary-button" onClick={()=>salvarLegendaFoto(f,f.legenda)}>Salvar legenda</button><button type="button" className="secondary-button" onClick={()=>removerFoto(f)}>Remover</button></div>)}</div>}</section>}

    {tab==="checklist"&&<section className="form-card"><h3>Checklist de manutenção</h3><div className="check-list">{check.map((x,i)=><div className="check-row" key={x.id}><div><strong>{x.item||x.descricao}</strong><small>{x.categoria||""}</small></div><select value={x.status||""} onChange={e=>{const a=[...check];a[i]={...x,status:e.target.value};setCheck(a)}}><option value="">Selecionar</option><option value="conforme">Conforme</option><option value="nao_conforme">Não conforme</option><option value="na">N/A</option></select></div>)}</div><button className="primary-button" disabled={salvando} onClick={saveChecklist}>Salvar checklist</button></section>}

    {tab==="medicoes"&&<section className="form-card"><h3>Medições técnicas</h3><div className="measure-grid">{[["retorno","Retorno °C"],["insuflamento","Insuflamento °C"],["tensao","Tensão V"],["corrente","Corrente A"],["pressao_succao","Sucção"],["pressao_descarga","Descarga"],["superaquecimento","Superaquecimento °C"],["subresfriamento","Sub-resfriamento °C"]].map(([k,l])=><div className="field" key={k}><label>{l}</label><input inputMode="decimal" value={med[k]??""} onChange={e=>setMed({...med,[k]:e.target.value})}/></div>)}</div><div className="delta-card">ΔT calculado: <strong>{delta} °C</strong></div><div className="field"><label>Observações</label><textarea rows={3} value={med.observacoes||""} onChange={e=>setMed({...med,observacoes:e.target.value})}/></div><button className="primary-button" onClick={saveMed}>Salvar medições</button></section>}

    {tab==="execucao"&&<section className="form-card"><h3>Execução do serviço</h3><div className="field"><label>Serviço executado</label><textarea rows={6} value={os.servico_executado||""} onChange={e=>setOs({...os,servico_executado:e.target.value})}/></div><button type="button" className="secondary-button" disabled={salvando||enviandoFoto} onClick={saveExecucao}>{salvando?"Salvando...":"Salvar execução"}</button><h3 className="form-section-title">Materiais / peças</h3><div className="field-grid"><div className="field"><label>Descrição</label><input value={material.descricao} onChange={e=>setMaterial({...material,descricao:e.target.value})}/></div><div className="field"><label>Quantidade</label><input type="number" value={material.quantidade} onChange={e=>setMaterial({...material,quantidade:e.target.value})}/></div></div><div className="field"><label>Valor unitário</label><input inputMode="decimal" value={material.valor_unitario} onChange={e=>setMaterial({...material,valor_unitario:e.target.value})}/></div><button type="button" className="secondary-button" onClick={addMat}>+ Adicionar material</button>{mats.map(m=><div className="material-line" key={m.id}><span>{m.quantidade} × {m.descricao}</span><strong>{moeda(m.valor_total)}</strong></div>)}<div className="field"><label>Recomendações</label><textarea rows={3} value={os.recomendacoes||""} onChange={e=>setOs({...os,recomendacoes:e.target.value})}/></div><div className="photo-input"><label>Fotos antes / durante / depois</label><input type="file" accept="image/*" capture="environment" multiple onChange={e=>uploadFotos(e.target.files,"execucao")}/>{enviandoFoto&&<small>Enviando foto...</small>}</div>{fotos.filter(f=>f.tipo==="execucao").length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:12,marginTop:14}}>{fotos.filter(f=>f.tipo==="execucao").map(f=><div style={{display:"flex",flexDirection:"column",gap:8}} key={f.id}><img style={{width:"100%",aspectRatio:"4 / 3",objectFit:"cover",borderRadius:14,border:"1px solid #e5e7eb"}} src={fotoUrl(f)} alt={f.legenda||"Foto"}/><input placeholder="Ex.: Antes da limpeza" value={f.legenda||""} onChange={e=>setFotos(atual=>atual.map((x:any)=>x.id===f.id?{...x,legenda:e.target.value}:x))}/><button type="button" className="secondary-button" onClick={()=>salvarLegendaFoto(f,f.legenda)}>Salvar legenda</button><button type="button" className="secondary-button" onClick={()=>removerFoto(f)}>Remover</button></div>)}</div>}</section>}

    {tab==="conclusao"&&<section className="form-card"><h3>Conclusão</h3><div className="field"><label>Situação final do equipamento</label><select value={os.situacao_final||""} onChange={e=>{setOs({...os,situacao_final:e.target.value});patchOS({situacao_final:e.target.value})}}><option value="">Selecione</option><option>Operando normalmente</option><option>Operando com ressalvas</option><option>Equipamento parado</option><option>Aguardando peça / retorno</option></select></div><div className="field"><label>Pendências</label><textarea rows={3} value={os.pendencias||""} onChange={e=>setOs({...os,pendencias:e.target.value})} onBlur={()=>patchOS({pendencias:os.pendencias||null})}/></div><div className="field-grid"><div className="field"><label>Valor do serviço (R$)</label><input inputMode="decimal" value={os.valor_servico??""} onChange={e=>setOs({...os,valor_servico:e.target.value})} onBlur={()=>{const v=numBR(os.valor_servico);if(v!==null||os.valor_servico==="")patchOS({valor_servico:v||0})}}/></div><div className="field"><label>Forma de pagamento</label><select value={os.forma_pagamento||""} onChange={e=>{setOs({...os,forma_pagamento:e.target.value});patchOS({forma_pagamento:e.target.value||null})}}><option value="">Selecione</option><option>PIX</option><option>Dinheiro</option><option>Cartão</option><option>Boleto</option><option>Faturado</option></select></div></div><div className="field"><label>Responsável pelo cliente / aceite</label><input value={assinatura} onChange={e=>setAssinatura(e.target.value)} placeholder="Nome de quem acompanhou o serviço"/></div><button className="primary-button full-button" disabled={salvando||enviandoFoto} onClick={finalizar}>{salvando?"Finalizando...":enviandoFoto?"Aguarde o envio das fotos...":"Finalizar OS e gerar relatório"}</button></section>}
  </div>
}
