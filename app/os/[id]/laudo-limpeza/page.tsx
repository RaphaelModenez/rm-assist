"use client";
import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
import {getSupabase} from "@/lib/supabase";

export default function LaudoLimpeza(){
 const {id}=useParams<{id:string}>();
 const [d,setD]=useState<any>({});const [erro,setErro]=useState("");
 useEffect(()=>{document.body.classList.add("report-screen-active");return()=>document.body.classList.remove("report-screen-active")},[]);
 useEffect(()=>{(async()=>{const s=getSupabase();if(!s)return setErro("Supabase não configurado.");
  const {data:os,error}=await s.from("ordens_servico").select("*").eq("id",id).single();if(error)return setErro(error.message);
  const [{data:cliente},{data:local},{data:rels}]=await Promise.all([s.from("clientes").select("*").eq("id",os.cliente_id).single(),os.local_id?s.from("locais").select("*").eq("id",os.local_id).single():Promise.resolve({data:null} as any),s.from("ordem_servico_equipamentos").select("equipamento_id").eq("ordem_servico_id",id)]);
  let ids=(rels||[]).map((x:any)=>x.equipamento_id);if(!ids.length&&os.equipamento_id)ids=[os.equipamento_id];const {data:eq}=ids.length?await s.from("equipamentos").select("*").in("id",ids):({data:[]} as any);setD({os,cliente,local,eq:eq||[]});
 })()},[id]);
 if(erro)return <div className="page"><div className="error-box">{erro}</div></div>;if(!d.os)return <div className="page">Carregando laudo...</div>;
 const data=d.os.data_fim?new Date(d.os.data_fim):new Date();const endereco=[d.local?.endereco,d.local?.numero,d.local?.bairro,d.local?.cidade,d.local?.estado,d.local?.cep].filter(Boolean).join(", ");
 return <div className="report-wrap"><div className="report-actions no-print"><button className="secondary-button" onClick={()=>history.back()}>Voltar</button><button className="primary-button" onClick={()=>window.print()}>Imprimir / Salvar PDF</button></div><article className="report">
  <header className="report-header report-company-header"><div className="report-company"><img src="/logo-rm-ar-condicionado.jpg" alt="RM Ar Condicionado" className="report-company-logo"/><div className="report-company-data"><h1>RM Ar Condicionado</h1><p><b>CNPJ:</b> 40.899.752/0001-50</p><p>Rua Luis Trevizolli, 214 — Balneário Riviera</p><p>Americana/SP</p><p><b>Tel.:</b> (19) 99606-7086</p><p><b>E-mail:</b> rmarcondicionado@gmail.com</p></div></div><div className="report-document-id"><span>LAUDO LIMPEZA</span><strong>OS #{String(d.os.numero).padStart(4,"0")}</strong><p>{data.toLocaleDateString("pt-BR")}</p><small>Limpeza e Higienização</small></div></header>
  <section><h2>Laudo de Limpeza e Higienização — Ar Condicionado</h2><p style={{lineHeight:1.65,textAlign:"justify"}}>Declaramos que foram realizados os serviços de limpeza e higienização dos equipamentos de ar-condicionado relacionados neste laudo, incluindo aplicação de bactericida/desinfetante à base de quaternário de amônio, conforme o procedimento de limpeza executado.</p></section>
  <section><h2>Cliente</h2><div className="report-grid"><p><b>Cliente:</b><br/>{d.cliente?.nome_fantasia||d.cliente?.nome||"—"}</p>{d.cliente?.cpf_cnpj&&<p><b>CPF/CNPJ:</b><br/>{d.cliente.cpf_cnpj}</p>}{d.local?.nome&&<p><b>Local:</b><br/>{d.local.nome}</p>}</div>{endereco&&<p><b>Endereço:</b> {endereco}</p>}</section>
  <section><h2>Equipamentos higienizados</h2>{d.eq.length===0?<p>Equipamento não identificado no cadastro.</p>:<table><thead><tr><th>Equipamento</th><th>Modelo</th><th>Nº de série</th><th>Ambiente</th></tr></thead><tbody>{d.eq.map((e:any)=><tr key={e.id}><td>{[e.tipo,e.marca].filter(Boolean).join(" — ")||"Ar-condicionado"}</td><td>{e.modelo||"—"}</td><td>{e.numero_serie||"—"}</td><td>{e.ambiente||"—"}</td></tr>)}</tbody></table>}</section>
  <section><h2>Validade do laudo</h2><p><b>12 meses</b></p></section>
  <section style={{marginTop:42,textAlign:"right"}}><p>Americana, {data.toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"})}</p></section>
  <footer className="report-footer" style={{marginTop:60}}><div></div><div><span>Técnico responsável</span><strong>Raphael Boschi Modenez</strong></div></footer>
  <div style={{marginTop:28,paddingTop:10,borderTop:"1px solid #ddd",textAlign:"center",fontSize:11,color:"#666"}}>RM Ar Condicionado • CNPJ 40.899.752/0001-50 • (19) 99606-7086 • rmarcondicionado@gmail.com</div>
 </article></div>
}