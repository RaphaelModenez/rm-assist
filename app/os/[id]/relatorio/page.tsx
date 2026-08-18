"use client";
import {useEffect,useMemo,useState} from "react";
import {useParams} from "next/navigation";
import {getSupabase} from "@/lib/supabase";
import {moeda} from "@/lib/domain";

export default function Relatorio(){
 const {id}=useParams<{id:string}>();
 const [d,setD]=useState<any>({});const [erro,setErro]=useState("");const [urls,setUrls]=useState<Record<string,string>>({});
 useEffect(()=>{(async()=>{
  const s=getSupabase();if(!s)return setErro("Supabase não configurado.");
  const {data:os,error}=await s.from("ordens_servico").select("*").eq("id",id).single();if(error)return setErro(error.message);
  const [{data:cliente},{data:local},{data:rels},{data:execs},{data:check},{data:med},{data:mats},{data:fotos}]=await Promise.all([
   s.from("clientes").select("*").eq("id",os.cliente_id).single(),
   os.local_id?s.from("locais").select("*").eq("id",os.local_id).single():Promise.resolve({data:null} as any),
   s.from("ordem_servico_equipamentos").select("equipamento_id").eq("ordem_servico_id",id),
   s.from("os_equipamento_execucao").select("*").eq("ordem_servico_id",id),
   s.from("checklist_itens").select("*").eq("ordem_servico_id",id).order("created_at"),
   s.from("medicoes").select("*").eq("ordem_servico_id",id).order("created_at"),
   s.from("materiais_servico").select("*").eq("ordem_servico_id",id).order("created_at"),
   s.from("fotos_servico").select("*").eq("ordem_servico_id",id).order("created_at")
  ]);
  let ids=(rels||[]).map((x:any)=>x.equipamento_id);if(!ids.length&&os.equipamento_id)ids=[os.equipamento_id];
  const {data:eq}=ids.length?await s.from("equipamentos").select("*").in("id",ids):({data:[]} as any);
  setD({os,cliente,local,eq:eq||[],execs:execs||[],check:check||[],med:med||[],mats:mats||[],fotos:fotos||[]});
  const u:Record<string,string>={};await Promise.all((fotos||[]).map(async(f:any)=>{const {data}=await s.storage.from("fotos-servico").createSignedUrl(f.storage_path,3600);if(data?.signedUrl)u[f.storage_path]=data.signedUrl}));setUrls(u);
 })()},[id]);
 const total=useMemo(()=>d.mats?.reduce((s:number,m:any)=>s+Number(m.valor_total||0),0)||0,[d.mats]);
 const stat=(v:string)=>v==="conforme"?"Conforme":v==="nao_conforme"?"Não conforme":v==="na"?"N/A":"—";
 const n=(v:any,s="")=>v===null||v===undefined||v===""?"—":`${String(v).replace(".",",")}${s}`;
 if(erro)return <div className="page"><div className="error-box">{erro}</div></div>;if(!d.os)return <div className="page">Carregando relatório...</div>;
 return <div className="report-wrap"><div className="report-actions no-print"><button className="secondary-button" onClick={()=>history.back()}>Voltar</button><button className="primary-button" onClick={()=>window.print()}>Imprimir / Salvar PDF</button></div><article className="report">
  <header className="report-header"><div><h1>RM Assist</h1><p>Relatório de Ordem de Serviço</p></div><div><strong>OS #{String(d.os.numero).padStart(4,"0")}</strong><p>{new Date(d.os.data_fim||Date.now()).toLocaleDateString("pt-BR")}</p></div></header>
  <section><h2>Cliente</h2><p><b>{d.cliente?.nome_fantasia||d.cliente?.nome}</b><br/>{d.local?.nome||""} {[d.local?.endereco,d.local?.numero,d.local?.cidade].filter(Boolean).join(", ")}</p><p><b>Equipamentos atendidos:</b> {d.eq.length}</p></section>
  {d.eq.map((eq:any,i:number)=>{const ex=d.execs.find((x:any)=>x.equipamento_id===eq.id)||{};const ck=d.check.filter((x:any)=>x.equipamento_id===eq.id);const mm=[...d.med].reverse().find((x:any)=>x.equipamento_id===eq.id);const fs=d.fotos.filter((x:any)=>x.equipamento_id===eq.id);return <section key={eq.id} style={{borderTop:"3px solid #ddd",paddingTop:16,marginTop:18}}>
   <h2>Equipamento {i+1} — {eq.ambiente||eq.tipo}</h2><p>{[eq.tipo,eq.marca,eq.modelo,eq.capacidade_btu?eq.capacidade_btu+" BTU":null,eq.refrigerante].filter(Boolean).join(" • ")}</p>{eq.numero_serie&&<p><b>Nº de série:</b> {eq.numero_serie}</p>}
   <h3>Diagnóstico</h3><p>{ex.diagnostico||"—"}</p><h3>Serviço executado</h3><p>{ex.servico_executado||"—"}</p>
   {ck.length>0&&<><h3>Checklist</h3><table><tbody>{ck.map((x:any)=><tr key={x.id}><td>{x.categoria?`${x.categoria} — `:""}{x.item||x.descricao}</td><td>{stat(x.status)}</td></tr>)}</tbody></table></>}
   {mm&&<><h3>Medições</h3><div className="report-grid"><p>Retorno: <b>{n(mm.retorno," °C")}</b></p><p>Insuflamento: <b>{n(mm.insuflamento," °C")}</b></p><p>ΔT: <b>{n(mm.delta_t," °C")}</b></p><p>Tensão: <b>{n(mm.tensao," V")}</b></p><p>Corrente: <b>{n(mm.corrente," A")}</b></p></div></>}
   {fs.length>0&&<><h3>Registro fotográfico</h3><div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12}}>{fs.map((f:any)=><figure key={f.id} style={{margin:0}}><img src={urls[f.storage_path]||""} alt="" style={{width:"100%",aspectRatio:"4 / 3",objectFit:"cover",borderRadius:10}}/><figcaption><b>{f.tipo==="diagnostico"?"Antes / diagnóstico":"Durante / depois"}</b>{f.legenda?<><br/>{f.legenda}</>:null}</figcaption></figure>)}</div></>}
   <p><b>Situação final:</b> {ex.situacao_final||"—"}<br/><b>Recomendações:</b> {ex.recomendacoes||"—"}<br/><b>Pendências:</b> {ex.pendencias||"—"}</p>
  </section>})}
  {d.mats.length>0&&<section><h2>Materiais / peças</h2><table><tbody>{d.mats.map((m:any)=><tr key={m.id}><td>{String(m.quantidade).replace(".",",")} × {m.descricao}</td><td>{moeda(m.valor_total)}</td></tr>)}</tbody></table></section>}
  <section><h2>Financeiro</h2><p><b>Serviço:</b> {moeda(d.os.valor_servico)}<br/><b>Materiais:</b> {moeda(total)}<br/><b>Forma de pagamento:</b> {d.os.forma_pagamento||"—"}</p></section>
  <footer className="report-footer"><div><span>Responsável pelo cliente</span><strong>{d.os.responsavel_cliente||"________________________"}</strong></div><div><span>Técnico responsável</span><strong>RM Ar Condicionado</strong></div></footer>
 </article></div>
}
