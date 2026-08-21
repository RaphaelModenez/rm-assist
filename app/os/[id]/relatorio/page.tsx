"use client";
import {useEffect,useMemo,useState} from "react";
import {useParams} from "next/navigation";
import {getSupabase} from "@/lib/supabase";
import {moeda} from "@/lib/domain";

const preenchido=(v:any)=>v!==null&&v!==undefined&&String(v).trim()!=="";
const texto=(v:any)=>preenchido(v)?String(v):"—";
const n=(v:any,s="")=>preenchido(v)?`${String(v).replace(".",",")}${s}`:"";
const stat=(v:string)=>v==="conforme"?"Conforme":v==="nao_conforme"?"Não conforme":v==="na"?"N/A":"—";

export default function Relatorio(){
 const {id}=useParams<{id:string}>();
 const [d,setD]=useState<any>({});
 const [erro,setErro]=useState("");
 const [urls,setUrls]=useState<Record<string,string>>({});
 const [incluirValores,setIncluirValores]=useState(true);

 useEffect(()=>{document.body.classList.add("report-screen-active");return()=>document.body.classList.remove("report-screen-active")},[]);
 useEffect(()=>{(async()=>{
  const s=getSupabase();if(!s)return setErro("Supabase não configurado.");
  const {data:os,error}=await s.from("ordens_servico").select("*").eq("id",id).single();if(error)return setErro(error.message);
  const [{data:cliente},{data:local},{data:rels},{data:execs},{data:check},{data:med},{data:mats},{data:fotos}]=await Promise.all([
   s.from("clientes").select("*").eq("id",os.cliente_id).single(),os.local_id?s.from("locais").select("*").eq("id",os.local_id).single():Promise.resolve({data:null} as any),
   s.from("ordem_servico_equipamentos").select("equipamento_id").eq("ordem_servico_id",id),s.from("os_equipamento_execucao").select("*").eq("ordem_servico_id",id),
   s.from("checklist_itens").select("*").eq("ordem_servico_id",id).order("created_at"),s.from("medicoes").select("*").eq("ordem_servico_id",id).order("created_at"),
   s.from("materiais_servico").select("*").eq("ordem_servico_id",id).order("created_at"),s.from("fotos_servico").select("*").eq("ordem_servico_id",id).order("created_at")]);
  let ids=(rels||[]).map((x:any)=>x.equipamento_id);if(!ids.length&&os.equipamento_id)ids=[os.equipamento_id];
  const {data:eq}=ids.length?await s.from("equipamentos").select("*").in("id",ids):({data:[]} as any);const ordem=new Map(ids.map((v:string,i:number)=>[v,i]));
  const equipamentos=[...(eq||[])].sort((a:any,b:any)=>(ordem.get(a.id)??999)-(ordem.get(b.id)??999));
  setD({os,cliente,local,eq:equipamentos,execs:execs||[],check:check||[],med:med||[],mats:mats||[],fotos:fotos||[]});
  const u:Record<string,string>={};await Promise.all((fotos||[]).map(async(f:any)=>{const {data}=await s.storage.from("fotos-servico").createSignedUrl(f.storage_path,3600);if(data?.signedUrl)u[f.storage_path]=data.signedUrl}));setUrls(u);
 })()},[id]);

 const totalMateriais=useMemo(()=>d.mats?.reduce((s:number,m:any)=>s+Number(m.valor_total||0),0)||0,[d.mats]);
 const totalGeral=Number(d.os?.valor_servico||0)+totalMateriais;
 if(erro)return <div className="page"><div className="error-box">{erro}</div></div>;if(!d.os)return <div className="page">Carregando relatório...</div>;
 const dataInicio=d.os.data_inicio?new Date(d.os.data_inicio):null,dataFim=d.os.data_fim?new Date(d.os.data_fim):null;
 const finais=d.eq.map((eq:any)=>d.execs.find((x:any)=>x.equipamento_id===eq.id)?.situacao_final).filter(preenchido);
 const normais=finais.filter((x:any)=>String(x).toLowerCase().includes("normal")).length;
 const pendentes=d.eq.filter((eq:any)=>preenchido(d.execs.find((x:any)=>x.equipamento_id===eq.id)?.pendencias)).length;

 return <div className="report-wrap"><div className="report-actions no-print">
  <button className="secondary-button" onClick={()=>history.back()}>Voltar</button>
  <label style={{display:"flex",alignItems:"center",gap:7}}><input type="checkbox" checked={incluirValores} onChange={e=>setIncluirValores(e.target.checked)}/> Incluir valores</label>
  <button className="primary-button" onClick={()=>window.print()}>Imprimir / Salvar PDF</button>
 </div><article className="report">
  <header className="report-header report-company-header"><div className="report-company"><img src="/logo-rm-ar-condicionado.jpg" alt="RM Ar Condicionado" className="report-company-logo"/><div className="report-company-data"><h1>RM Ar Condicionado</h1><p><b>CNPJ:</b> 40.899.752/0001-50</p><p>Rua Luis Trevizolli, 214 — Balneário Riviera</p><p>Americana/SP</p><p><b>Tel.:</b> (19) 99606-7086</p><p><b>E-mail:</b> rmarcondicionado@gmail.com</p></div></div><div className="report-document-id"><span>RELATÓRIO TÉCNICO</span><strong>OS #{String(d.os.numero).padStart(4,"0")}</strong><p>{(dataFim||new Date()).toLocaleDateString("pt-BR")}</p><small>Relatório de Atendimento</small></div></header>
  <section><h2>Resumo do atendimento</h2><div className="report-grid"><p><b>{d.eq.length}</b> equipamento{d.eq.length===1?"":"s"} atendido{d.eq.length===1?"":"s"}</p><p><b>{normais}</b> operando normalmente</p><p><b>{pendentes}</b> com pendência{pendentes===1?"":"s"}</p><p><b>Serviço:</b><br/>{d.os.tipo_servico||"—"}</p></div></section>
  <section><h2>Dados do atendimento</h2><div className="report-grid"><p><b>Cliente:</b><br/>{d.cliente?.nome_fantasia||d.cliente?.nome||"—"}</p><p><b>Local:</b><br/>{d.local?.nome||"—"}</p>{dataInicio&&<p><b>Início:</b><br/>{dataInicio.toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})}</p>}{dataFim&&<p><b>Conclusão:</b><br/>{dataFim.toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})}</p>}</div>{(d.local?.endereco||d.local?.cidade)&&<p><b>Endereço:</b> {[d.local?.endereco,d.local?.numero,d.local?.bairro,d.local?.cidade,d.local?.estado].filter(Boolean).join(", ")}</p>}</section>
  {d.eq.map((eq:any,i:number)=>{const ex=d.execs.find((x:any)=>x.equipamento_id===eq.id)||{},ck=d.check.filter((x:any)=>x.equipamento_id===eq.id),mm=[...d.med].reverse().find((x:any)=>x.equipamento_id===eq.id),fs=d.fotos.filter((x:any)=>x.equipamento_id===eq.id);const conformes=ck.filter((x:any)=>x.status==="conforme").length,nao=ck.filter((x:any)=>x.status==="nao_conforme"),observados=ck.filter((x:any)=>preenchido(x.observacao)),detalhar=nao.length>0||observados.length>0;
   const medicoes=mm?[ ["Retorno",mm.retorno," °C"],["Insuflamento",mm.insuflamento," °C"],["ΔT",mm.delta_t," °C"],["Tensão",mm.tensao," V"],["Corrente",mm.corrente," A"],["Pressão sucção",mm.pressao_succao," psi"],["Pressão descarga",mm.pressao_descarga," psi"],["Superaquecimento",mm.superaquecimento," °C"],["Sub-resfriamento",mm.subresfriamento," °C"]].filter((x:any)=>preenchido(x[1])):[];
   return <section key={eq.id} style={{borderTop:"3px solid #ddd",paddingTop:16,marginTop:18}}><div style={{display:"flex",justifyContent:"space-between",gap:12}}><div><h2 style={{marginBottom:4}}>Equipamento {i+1} — {eq.ambiente||eq.tipo||"Equipamento"}</h2><p style={{marginTop:0}}>{[eq.tipo,eq.marca,eq.modelo].filter(Boolean).join(" • ")||"—"}</p></div><strong>{eq.capacidade_btu?`${eq.capacidade_btu} BTU`:""}</strong></div>
   <div className="report-grid">{eq.numero_serie&&<p><b>Nº de série:</b><br/>{eq.numero_serie}</p>}{eq.refrigerante&&<p><b>Refrigerante:</b><br/>{eq.refrigerante}</p>}{eq.patrimonio&&<p><b>Patrimônio:</b><br/>{eq.patrimonio}</p>}</div>
   {preenchido(ex.diagnostico)&&<><h3>Condição encontrada / diagnóstico</h3><p style={{whiteSpace:"pre-wrap"}}>{ex.diagnostico}</p></>}{preenchido(ex.servico_executado)&&<><h3>Serviço executado</h3><p style={{whiteSpace:"pre-wrap"}}>{ex.servico_executado}</p></>}
   {ck.length>0&&<><h3>Checklist</h3><p><b>{ck.length} itens verificados</b> — {conformes} conforme{conformes===1?"":"s"}{nao.length?` • ${nao.length} não conforme${nao.length===1?"":"s"}`:""}</p>{detalhar&&<table><thead><tr><th>Item com observação / não conformidade</th><th>Situação</th><th>Observação</th></tr></thead><tbody>{ck.filter((x:any)=>x.status==="nao_conforme"||preenchido(x.observacao)).map((x:any)=><tr key={x.id}><td>{x.categoria?`${x.categoria} — `:""}{x.item||x.descricao}</td><td>{stat(x.status)}</td><td>{x.observacao||"—"}</td></tr>)}</tbody></table>}</>}
   {medicoes.length>0&&<><h3>Medições técnicas</h3><div className="report-grid">{medicoes.map((x:any)=><p key={x[0]}>{x[0]}: <b>{n(x[1],x[2])}</b></p>)}</div>{mm.observacoes&&<p><b>Observações das medições:</b> {mm.observacoes}</p>}</>}
   {fs.length>0&&<><h3>Registro fotográfico</h3><div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12}}>{fs.map((f:any)=>{const tipo=String(f.tipo||"").toLowerCase();const rotulo=tipo.includes("antes")||tipo==="diagnostico"?"Antes":tipo.includes("durante")?"Durante":tipo.includes("depois")||tipo.includes("final")?"Depois":"Registro";return <figure key={f.id} style={{margin:0,breakInside:"avoid"}}><img src={urls[f.storage_path]||""} alt="" style={{width:"100%",aspectRatio:"4 / 3",objectFit:"cover",borderRadius:10}}/><figcaption style={{paddingTop:5}}><b>{rotulo}</b>{f.legenda?<><br/>{f.legenda}</>:null}</figcaption></figure>})}</div></>}
   <h3>Conclusão deste equipamento</h3>{preenchido(ex.situacao_final)&&<p><b>Situação final:</b> {ex.situacao_final}</p>}{preenchido(ex.recomendacoes)&&<p><b>Recomendações:</b> {ex.recomendacoes}</p>}{preenchido(ex.pendencias)&&<p><b>Pendências:</b> {ex.pendencias}</p>}</section>})}
  {d.mats.length>0&&<section><h2>Materiais / peças utilizados</h2><table><thead><tr><th>Descrição</th><th>Qtd.</th>{incluirValores&&<th>Valor</th>}</tr></thead><tbody>{d.mats.map((m:any)=><tr key={m.id}><td>{m.descricao}</td><td>{String(m.quantidade).replace(".",",")}</td>{incluirValores&&<td>{moeda(m.valor_total)}</td>}</tr>)}</tbody></table></section>}
  {incluirValores&&<section><h2>Resumo financeiro</h2><table><tbody><tr><td>Serviço</td><td><b>{moeda(d.os.valor_servico)}</b></td></tr><tr><td>Materiais / peças</td><td><b>{moeda(totalMateriais)}</b></td></tr><tr><td>Total do atendimento</td><td><b>{moeda(totalGeral)}</b></td></tr></tbody></table>{preenchido(d.os.forma_pagamento)&&<p><b>Forma de pagamento:</b> {d.os.forma_pagamento}</p>}</section>}
  {d.os.observacoes&&<section><h2>Observações gerais</h2><p style={{whiteSpace:"pre-wrap"}}>{d.os.observacoes}</p></section>}
  <footer className="report-footer" style={{marginTop:45}}><div><span>Responsável pelo cliente</span><strong>{d.os.responsavel_cliente||"________________________"}</strong>{dataFim&&<small>{dataFim.toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})}</small>}</div><div><span>Técnico responsável</span><strong>RM Ar Condicionado</strong></div></footer>
  <div style={{marginTop:28,paddingTop:10,borderTop:"1px solid #ddd",textAlign:"center",fontSize:11,color:"#666"}}>RM Ar Condicionado • CNPJ 40.899.752/0001-50 • (19) 99606-7086 • rmarcondicionado@gmail.com</div>
 </article></div>
}
