"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {getSupabase} from "@/lib/supabase";
import {moeda} from "@/lib/domain";

export default function Historico(){
  const [items,setItems]=useState<any[]>([]);
  const [q,setQ]=useState("");
  const [periodo,setPeriodo]=useState("todos");
  const [erro,setErro]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{(async()=>{
    const s=getSupabase();
    if(!s){setErro("Supabase não configurado.");setLoading(false);return}
    const {data,error}=await s.from("ordens_servico")
      .select("*, clientes(nome,nome_fantasia), equipamentos(ambiente,marca,modelo)")
      .eq("status","concluida")
      .order("data_fim",{ascending:false});
    if(error)setErro(error.message); else setItems(data||[]);
    setLoading(false);
  })()},[]);

  const lista=useMemo(()=>{
    const termo=q.trim().toLowerCase();
    const agora=new Date();

    return items.filter((x:any)=>{
      if(periodo!=="todos"){
        if(!x.data_fim)return false;
        const d=new Date(x.data_fim);
        if(periodo==="mes"&&(d.getMonth()!==agora.getMonth()||d.getFullYear()!==agora.getFullYear()))return false;
        if(periodo==="ano"&&d.getFullYear()!==agora.getFullYear())return false;
      }

      if(!termo)return true;
      const texto=[
        x.numero,x.clientes?.nome,x.clientes?.nome_fantasia,x.tipo_servico,x.situacao_final,
        x.equipamentos?.ambiente,x.equipamentos?.marca,x.equipamentos?.modelo
      ].filter(Boolean).join(" ").toLowerCase();
      return texto.includes(termo);
    });
  },[items,q,periodo]);

  const totalPeriodo=useMemo(
    ()=>lista.reduce((s:number,x:any)=>s+Number(x.valor_servico||0),0),
    [lista]
  );

  return <div className="page">
    <header className="simple-header"><div><p className="eyebrow">RM ASSIST</p><h1>Histórico</h1><p>Ordens de serviço concluídas.</p></div></header>

    <input className="search-input" placeholder="Buscar por cliente, OS, serviço ou equipamento..." value={q} onChange={e=>setQ(e.target.value)}/>

    <div className="field" style={{marginBottom:14}}>
      <label>Período</label>
      <select value={periodo} onChange={e=>setPeriodo(e.target.value)}>
        <option value="todos">Todo o histórico</option>
        <option value="mes">Este mês</option>
        <option value="ano">Este ano</option>
      </select>
    </div>

    <div className="stat-grid" style={{marginBottom:14}}>
      <article className="stat-card"><strong>{lista.length}</strong><span>OS encontradas</span></article>
      <article className="stat-card"><strong>{moeda(totalPeriodo)}</strong><span>Valor de serviços</span></article>
    </div>

    {erro&&<div className="error-box">{erro}</div>}

    {loading?<p className="muted">Carregando histórico...</p>:lista.length===0?
      <section className="empty-state"><h2>Nenhuma OS encontrada</h2><p>Ajuste a busca ou o período selecionado.</p></section>:
      <div className="service-list">{lista.map((o:any)=><article className="service-card" key={o.id}>
        <div>
          <span className="status-chip concluida">concluída</span>
          <h3>OS #{String(o.numero).padStart(4,"0")} — {o.clientes?.nome_fantasia||o.clientes?.nome||"Cliente"}</h3>
          <p>{o.tipo_servico||"Serviço"}{o.equipamentos?.ambiente?` • ${o.equipamentos.ambiente}`:""}</p>
          {o.situacao_final&&<small>{o.situacao_final}</small>}
          <small style={{display:"block",marginTop:4}}>
            {o.data_fim?new Date(o.data_fim).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"}):""}
            {o.valor_servico!==null&&o.valor_servico!==undefined?` • ${moeda(o.valor_servico)}`:""}
          </small>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <Link href={`/os/${o.id}`} className="secondary-button">Abrir OS</Link>
          <Link href={`/os/${o.id}/relatorio`} className="primary-button">Relatório</Link>
        </div>
      </article>)}</div>}
  </div>
}
