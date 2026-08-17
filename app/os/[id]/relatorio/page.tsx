"use client";
import {useEffect,useMemo,useState} from "react";
import {useParams} from "next/navigation";
import {getSupabase} from "@/lib/supabase";
import {moeda} from "@/lib/domain";

export default function Relatorio(){
  const {id}=useParams<{id:string}>();
  const [d,setD]=useState<any>({});
  const [erro,setErro]=useState("");
  const [fotoUrls,setFotoUrls]=useState<Record<string,string>>({});

  useEffect(()=>{(async()=>{
    const s=getSupabase(); if(!s)return setErro("Supabase não configurado.");
    const {data:os,error}=await s.from("ordens_servico").select("*").eq("id",id).single();
    if(error)return setErro(error.message);
    const [{data:cliente},{data:local},{data:eq},{data:check},{data:med},{data:mats},{data:fotos}] = await Promise.all([
      s.from("clientes").select("*").eq("id",os.cliente_id).single(),
      os.local_id?s.from("locais").select("*").eq("id",os.local_id).single():Promise.resolve({data:null} as any),
      os.equipamento_id?s.from("equipamentos").select("*").eq("id",os.equipamento_id).single():Promise.resolve({data:null} as any),
      s.from("checklist_itens").select("*").eq("ordem_servico_id",id).order("created_at"),
      s.from("medicoes").select("*").eq("ordem_servico_id",id).order("created_at",{ascending:false}).limit(1).maybeSingle(),
      s.from("materiais_servico").select("*").eq("ordem_servico_id",id).order("created_at"),
      s.from("fotos_servico").select("*").eq("ordem_servico_id",id).order("created_at")
    ]);
    setD({os,cliente,local,eq,check:check||[],med,mats:mats||[],fotos:fotos||[]});
    const urls:Record<string,string>={};
    await Promise.all((fotos||[]).map(async(f:any)=>{
      const {data}=await s.storage.from("fotos-servico").createSignedUrl(f.storage_path,3600);
      if(data?.signedUrl)urls[f.storage_path]=data.signedUrl;
    }));
    setFotoUrls(urls);
  })()},[id]);

  function fotoUrl(path:string){return fotoUrls[path]||""}
  function statusChecklist(v:string){
    if(v==="conforme")return "Conforme";
    if(v==="nao_conforme")return "Não conforme";
    if(v==="na")return "N/A";
    return "—";
  }
  function n(v:any,sufixo=""){return v===null||v===undefined||v===""?"—":`${String(v).replace(".",",")}${sufixo}`}
  const totalMateriais=useMemo(()=>d.mats?.reduce((s:number,m:any)=>s+Number(m.valor_total||0),0)||0,[d.mats]);

  if(erro)return <div className="page"><div className="error-box">{erro}</div></div>;
  if(!d.os)return <div className="page">Carregando relatório...</div>;

  return <div className="report-wrap">
    <div className="report-actions no-print"><button className="secondary-button" onClick={()=>history.back()}>Voltar</button><button className="primary-button" onClick={()=>window.print()}>Imprimir / Salvar PDF</button></div>
    <article className="report">
      <header className="report-header"><div><h1>RM Assist</h1><p>Relatório de Ordem de Serviço</p></div><div><strong>OS #{String(d.os.numero).padStart(4,"0")}</strong><p>{new Date(d.os.data_fim||Date.now()).toLocaleDateString("pt-BR")}</p></div></header>

      <section><h2>Cliente</h2><p><b>{d.cliente?.nome_fantasia||d.cliente?.nome}</b><br/>{d.local?.nome||""} {[d.local?.endereco,d.local?.numero,d.local?.cidade].filter(Boolean).join(", ")}<br/>{d.cliente?.telefone||d.cliente?.whatsapp||""}{d.cliente?.email?<><br/>{d.cliente.email}</>:null}</p></section>

      <section><h2>Equipamento</h2><p>{[d.eq?.ambiente,d.eq?.tipo,d.eq?.marca,d.eq?.modelo,d.eq?.capacidade_btu?d.eq.capacidade_btu+" BTU":null,d.eq?.refrigerante].filter(Boolean).join(" • ")||"Não especificado"}</p>{d.eq?.numero_serie&&<p><b>Nº de série:</b> {d.eq.numero_serie}</p>}</section>

      <section><h2>Diagnóstico</h2><p>{d.os.diagnostico||"—"}</p></section>
      <section><h2>Serviço executado</h2><p>{d.os.servico_executado||"—"}</p></section>

      {d.check.length>0&&<section><h2>Checklist</h2><table><tbody>{d.check.map((x:any)=><tr key={x.id}><td>{x.categoria?`${x.categoria} — `:""}{x.item||x.descricao}</td><td>{statusChecklist(x.status)}</td></tr>)}</tbody></table></section>}

      {d.med&&<section><h2>Medições técnicas</h2><div className="report-grid">
        <p>Retorno: <b>{n(d.med.retorno," °C")}</b></p>
        <p>Insuflamento: <b>{n(d.med.insuflamento," °C")}</b></p>
        <p>ΔT: <b>{n(d.med.delta_t," °C")}</b></p>
        <p>Tensão: <b>{n(d.med.tensao," V")}</b></p>
        <p>Corrente: <b>{n(d.med.corrente," A")}</b></p>
        <p>Pressão de sucção: <b>{n(d.med.pressao_succao)}</b></p>
        <p>Pressão de descarga: <b>{n(d.med.pressao_descarga)}</b></p>
        <p>Superaquecimento: <b>{n(d.med.superaquecimento," °C")}</b></p>
        <p>Sub-resfriamento: <b>{n(d.med.subresfriamento," °C")}</b></p>
      </div>{d.med.observacoes&&<p><b>Observações:</b> {d.med.observacoes}</p>}</section>}

      {d.mats.length>0&&<section><h2>Materiais / peças</h2><table><tbody>{d.mats.map((m:any)=><tr key={m.id}><td>{String(m.quantidade).replace(".",",")} × {m.descricao}</td><td>{moeda(m.valor_total)}</td></tr>)}</tbody><tfoot><tr><td><b>Total de materiais</b></td><td><b>{moeda(totalMateriais)}</b></td></tr></tfoot></table></section>}

      {d.fotos.length>0&&<section><h2>Registro fotográfico</h2><div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12}}>{d.fotos.map((f:any)=><figure style={{margin:0}} key={f.id}><img style={{width:"100%",aspectRatio:"4 / 3",objectFit:"cover",borderRadius:10,border:"1px solid #ddd"}} src={fotoUrl(f.storage_path)} alt={f.legenda||"Foto do serviço"}/><figcaption style={{fontSize:12,color:"#666",marginTop:4}}>{f.tipo==="diagnostico"?"Diagnóstico":"Execução"}</figcaption></figure>)}</div></section>}

      <section><h2>Conclusão</h2><p><b>Situação:</b> {d.os.situacao_final||"—"}<br/><b>Recomendações:</b> {d.os.recomendacoes||"—"}<br/><b>Pendências:</b> {d.os.pendencias||"—"}</p></section>

      <section><h2>Financeiro</h2><p><b>Serviço:</b> {moeda(d.os.valor_servico)}<br/><b>Materiais registrados:</b> {moeda(totalMateriais)}<br/><b>Forma de pagamento:</b> {d.os.forma_pagamento||"—"}</p></section>

      <footer className="report-footer"><div><span>Responsável pelo cliente</span><strong>{d.os.responsavel_cliente||"________________________"}</strong></div><div><span>Técnico responsável</span><strong>RM Ar Condicionado</strong></div></footer>
    </article>
  </div>
}
