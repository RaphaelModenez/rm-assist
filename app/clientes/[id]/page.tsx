"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import {getSupabase} from "@/lib/supabase";

export default function Detalhe(){
 const {id}=useParams<{id:string}>();
 const r=useRouter();
 const [c,setC]=useState<any>();
 const [locais,setLocais]=useState<any[]>([]);
 const [eqs,setEqs]=useState<any[]>([]);
 const [erro,setErro]=useState("");
 const [apagando,setApagando]=useState("");

 async function load(){
  const s=getSupabase();if(!s)return setErro("Supabase não configurado.");
  const [{data:cli,error:e1},{data:loc,error:e2},{data:eq,error:e3}]=await Promise.all([
   s.from("clientes").select("*").eq("id",id).single(),
   s.from("locais").select("*").eq("cliente_id",id).order("nome"),
   s.from("equipamentos").select("*").eq("cliente_id",id).order("ambiente")
  ]);
  if(e1||e2||e3)setErro(e1?.message||e2?.message||e3?.message||"");
  setC(cli);setLocais(loc||[]);setEqs(eq||[]);
 }

 useEffect(()=>{load()},[id]);

 async function apagarLocal(local:any){
  if(apagando)return;
  if(!confirm(`Apagar o local "${local.nome}"?\n\nIsso só será permitido se ele ainda não estiver ligado a equipamentos, chamados ou ordens de serviço.`))return;

  const s=getSupabase();if(!s)return;
  setApagando(local.id);setErro("");

  try{
   const [{count:eq},{count:ch},{count:os}]=await Promise.all([
    s.from("equipamentos").select("*",{count:"exact",head:true}).eq("local_id",local.id),
    s.from("chamados").select("*",{count:"exact",head:true}).eq("local_id",local.id),
    s.from("ordens_servico").select("*",{count:"exact",head:true}).eq("local_id",local.id)
   ]);

   if((eq||0)+(ch||0)+(os||0)>0){
    setErro("Este local já está sendo usado em equipamento, chamado ou OS. Para preservar o histórico, ele não pode ser apagado.");
    return;
   }

   const {error}=await s.from("locais").delete().eq("id",local.id).eq("cliente_id",id);
   if(error)throw error;
   setLocais(v=>v.filter(x=>x.id!==local.id));
  }catch(e:any){
   setErro(e.message||"Não foi possível apagar o local.");
  }finally{
   setApagando("");
  }
 }

 async function apagarCliente(){
  if(apagando)return;
  if(!confirm(`Apagar definitivamente o cliente "${c.nome_fantasia||c.nome}"?\n\nUse esta opção somente para cadastros feitos por engano. Clientes com histórico de atendimento não poderão ser apagados.`))return;

  const s=getSupabase();if(!s)return;
  setApagando("cliente");setErro("");

  try{
   const [{count:loc},{count:eq},{count:ch},{count:os},{count:orc},{count:pmoc}]=await Promise.all([
    s.from("locais").select("*",{count:"exact",head:true}).eq("cliente_id",id),
    s.from("equipamentos").select("*",{count:"exact",head:true}).eq("cliente_id",id),
    s.from("chamados").select("*",{count:"exact",head:true}).eq("cliente_id",id),
    s.from("ordens_servico").select("*",{count:"exact",head:true}).eq("cliente_id",id),
    s.from("orcamentos").select("*",{count:"exact",head:true}).eq("cliente_id",id),
    s.from("pmoc_contratos").select("*",{count:"exact",head:true}).eq("cliente_id",id)
   ]);

   const dependencias=(loc||0)+(eq||0)+(ch||0)+(os||0)+(orc||0)+(pmoc||0);
   if(dependencias>0){
    setErro("Este cliente possui locais, equipamentos, chamados, OS, orçamentos ou PMOC. Apague primeiro cadastros sem uso; se houver histórico, mantenha o cliente e marque-o como inativo.");
    return;
   }

   const {error}=await s.from("clientes").delete().eq("id",id);
   if(error)throw error;
   r.push("/clientes");
   r.refresh();
  }catch(e:any){
   setErro(e.message||"Não foi possível apagar o cliente.");
  }finally{
   setApagando("");
  }
 }

 if(erro&&!c)return <div className="page"><div className="error-box">{erro}</div></div>;
 if(!c)return <div className="page">Carregando...</div>;

 return <div className="page">
  <header className="simple-header">
   <div><p className="eyebrow">CLIENTE</p><h1>{c.nome_fantasia||c.nome}</h1><p>{c.nome_fantasia?c.nome:c.cpf_cnpj||"Cadastro do cliente"}{!c.ativo?" • Inativo":""}</p></div>
   <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
    <Link href={`/clientes/${id}/editar`} className="secondary-button">Editar</Link>
    {c.ativo&&<Link href={`/chamados/novo?cliente=${id}`} className="primary-button">+ Chamado</Link>}
   </div>
  </header>

  {erro&&<div className="error-box">{erro}</div>}

  <section className="detail-grid">
   <article className="info-card"><h3>Contato</h3><p><b>Telefone:</b> {c.telefone||"—"}</p><p><b>WhatsApp:</b> {c.whatsapp||"—"}</p><p><b>E-mail:</b> {c.email||"—"}</p></article>
   <article className="info-card"><h3>Resumo</h3><p><b>Locais:</b> {locais.length}</p><p><b>Equipamentos ativos:</b> {eqs.filter((x:any)=>x.ativo).length}</p><p><b>Status:</b> {c.ativo?"Ativo":"Inativo"}</p></article>
  </section>

  <section className="section-block">
   <div className="section-heading"><h3>Locais</h3>{c.ativo&&<Link href={`/clientes/${id}/locais/novo`}>+ Adicionar</Link>}</div>
   {locais.length?<div className="mini-list">{locais.map(x=><div className="mini-card" key={x.id}>
    <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}>
     <div><strong>{x.nome}</strong><span>{[x.endereco,x.numero,x.cidade].filter(Boolean).join(", ")}</span></div>
     <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      <Link href={`/clientes/${id}/locais/${x.id}/editar`} className="secondary-button">Editar</Link>
      <button type="button" className="secondary-button" disabled={!!apagando} onClick={()=>apagarLocal(x)} style={{color:"#b42318"}}>
       {apagando===x.id?"Apagando...":"Apagar"}
      </button>
     </div>
    </div>
   </div>)}</div>:<p className="muted">Nenhum local.</p>}
  </section>

  <section className="section-block">
   <div className="section-heading"><h3>Equipamentos</h3>{c.ativo&&<Link href={`/clientes/${id}/equipamentos/novo`}>+ Adicionar</Link>}</div>
   {eqs.length?<div className="mini-list">{eqs.map(x=><div className="mini-card" key={x.id}>
    <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}>
     <div style={{minWidth:0}}><strong>{x.ambiente||x.tipo}{!x.ativo?" • Inativo":""}</strong><span>{[x.marca,x.modelo,x.capacidade_btu?x.capacidade_btu+" BTU":null,x.refrigerante].filter(Boolean).join(" • ")}</span></div>
     <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      {c.ativo&&x.ativo&&<Link href={`/chamados/novo?cliente=${id}&equipamento=${x.id}`} className="primary-button">+ Chamado</Link>}
      <Link href={`/clientes/${id}/equipamentos/${x.id}/historico`} className="secondary-button">Histórico</Link>
      <Link href={`/clientes/${id}/equipamentos/${x.id}/editar`} className="secondary-button">Editar</Link>
     </div>
    </div>
   </div>)}</div>:<p className="muted">Nenhum equipamento.</p>}
  </section>

  <section className="section-block">
   <h3>Excluir cadastro</h3>
   <p className="muted">Use somente para cliente cadastrado por engano e sem histórico. Se já houver atendimentos, prefira deixar o cliente inativo.</p>
   <button type="button" className="secondary-button" disabled={!!apagando} onClick={apagarCliente} style={{color:"#b42318",borderColor:"#f3b8b2"}}>
    {apagando==="cliente"?"Apagando cliente...":"Apagar cliente"}
   </button>
  </section>
 </div>
}
