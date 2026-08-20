"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {getSupabase} from "@/lib/supabase";

export default function Relatorios(){
  const [items,setItems]=useState<any[]>([]);
  const [q,setQ]=useState("");
  const [periodo,setPeriodo]=useState("todos");
  const [erro,setErro]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{(async()=>{
    const s=getSupabase(); if(!s){setErro("Supabase não configurado.");setLoading(false);return}
    const {data,error}=await s.from("ordens_servico")
      .select(`id,numero,data_fim,situacao_final,tipo_servico,clientes(nome,nome_fantasia),ordem_servico_equipamentos(equipamento_id,equipamentos(ambiente,marca,modelo,tipo,capacidade_btu))`)
      .eq("status","concluida").order("data_fim",{ascending:false});
    if(error)setErro(error.message); else setItems(data||[]); setLoading(false);
  })()},[]);

  const lista=useMemo(()=>{
    const t=q.trim().toLowerCase();const agora=new Date();
    return items.filter((x:any)=>{
      if(periodo!=="todos"){
        if(!x.data_fim)return false;const d=new Date(x.data_fim);
        if(periodo==="mes"&&(d.getMonth()!==agora.getMonth()||d.getFullYear()!==agora.getFullYear()))return false;
        if(periodo==="ano"&&d.getFullYear()!==agora.getFullYear())return false;
      }
      const eqs=(x.ordem_servico_equipamentos||[]).map((r:any)=>r.equipamentos).filter(Boolean);
      const texto=[x.numero,x.clientes?.nome,x.clientes?.nome_fantasia,x.tipo_servico,x.situacao_final,...eqs.flatMap((e:any)=>[e.ambiente,e.marca,e.modelo,e.tipo,e.capacidade_btu])].filter(Boolean).join(" ").toLowerCase();
      return !t||texto.includes(t);
    });
  },[items,q,periodo]);

  const resumo=(x:any)=>{const eqs=(x.ordem_servico_equipamentos||[]).map((r:any)=>r.equipamentos).filter(Boolean);if(eqs.length===1)return eqs[0].ambiente||eqs[0].tipo||"1 equipamento";return eqs.length?`${eqs.length} equipamentos`:""};

  return <div className="page"><header className="simple-header"><div><p className="eyebrow">RM ASSIST</p><h1>Relatórios</h1><p>Ordens de serviço concluídas e prontas para impressão.</p></div></header>
   <div className="field-grid" style={{marginBottom:14}}><div className="field"><label>Buscar</label><input placeholder="Cliente, OS, serviço, equipamento..." value={q} onChange={e=>setQ(e.target.value)}/></div><div className="field"><label>Período</label><select value={periodo} onChange={e=>setPeriodo(e.target.value)}><option value="todos">Todo o histórico</option><option value="mes">Este mês</option><option value="ano">Este ano</option></select></div></div>
   {erro&&<div className="error-box">{erro}</div>}
   {loading?<p className="muted">Carregando relatórios...</p>:lista.length?<><small className="muted" style={{display:"block",marginBottom:10}}>{lista.length} relatório{lista.length===1?"":"s"}</small><div className="service-list">{lista.map((x:any)=><Link className="service-card" href={`/os/${x.id}/relatorio`} key={x.id}><div><h3>OS #{String(x.numero).padStart(4,"0")} — {x.clientes?.nome_fantasia||x.clientes?.nome||"Cliente"}</h3><p>{x.situacao_final||x.tipo_servico||"Serviço concluído"}</p><small>{x.data_fim?new Date(x.data_fim).toLocaleDateString("pt-BR"):""}{resumo(x)?` • ${resumo(x)}`:""}</small></div><span className="chevron">›</span></Link>)}</div></>:<section className="empty-state"><h2>Nenhum relatório</h2><p>Ajuste os filtros ou conclua uma OS para gerar relatórios.</p></section>}
  </div>
}
