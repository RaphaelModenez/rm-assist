"use client";
import {FormEvent,useRef,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import {getSupabase} from "@/lib/supabase";

export default function NovoLocal(){
 const {id}=useParams<{id:string}>();
 const r=useRouter();
 const trava=useRef(false);
 const [erro,setErro]=useState("");
 const [salvando,setSalvando]=useState(false);
 const [f,setF]=useState({nome:"",endereco:"",numero:"",bairro:"",cidade:"",estado:"SP",cep:"",referencia:""});

 function normal(v:any){return String(v||"").trim().toLocaleLowerCase("pt-BR")}

 async function save(e:FormEvent){
  e.preventDefault();
  if(trava.current)return;
  if(!f.nome.trim())return setErro("Informe o nome do local.");

  const s=getSupabase();
  if(!s)return setErro("Supabase não configurado.");

  trava.current=true;
  setSalvando(true);
  setErro("");

  try{
    // Evita duplicar o mesmo local caso haja toque duplo, lentidão de rede
    // ou tentativa de cadastrar novamente os mesmos dados.
    const {data:existentes,error:buscaErro}=await s.from("locais")
      .select("id,nome,endereco,numero,cidade")
      .eq("cliente_id",id);

    if(buscaErro)throw buscaErro;

    const duplicado=(existentes||[]).find((x:any)=>
      normal(x.nome)===normal(f.nome) &&
      normal(x.endereco)===normal(f.endereco) &&
      normal(x.numero)===normal(f.numero) &&
      normal(x.cidade)===normal(f.cidade)
    );

    if(duplicado){
      setErro("Este local já está cadastrado para este cliente.");
      return;
    }

    const {error}=await s.from("locais").insert({
      cliente_id:id,
      nome:f.nome.trim(),
      endereco:f.endereco||null,
      numero:f.numero||null,
      bairro:f.bairro||null,
      cidade:f.cidade||null,
      estado:f.estado||null,
      cep:f.cep||null,
      referencia:f.referencia||null
    });

    if(error)throw error;

    r.push(`/clientes/${id}`);
    r.refresh();
  }catch(e:any){
    setErro(e.message||"Não foi possível salvar o local.");
  }finally{
    setSalvando(false);
    trava.current=false;
  }
 }

 return <div className="page">
  <header className="simple-header"><div><p className="eyebrow">LOCAL</p><h1>Novo local</h1></div></header>
  <form className="form-card" onSubmit={save}>
   {[["nome","Nome do local *"],["endereco","Endereço"],["numero","Número"],["bairro","Bairro"],["cidade","Cidade"],["estado","Estado"],["cep","CEP"],["referencia","Referência"]].map(([k,l])=>
    <div className="field" key={k}><label>{l}</label><input disabled={salvando} value={(f as any)[k]} onChange={e=>setF({...f,[k]:e.target.value})}/></div>
   )}
   {erro&&<div className="error-box">{erro}</div>}
   <div className="form-actions">
    <button type="button" className="secondary-button" disabled={salvando} onClick={()=>r.back()}>Cancelar</button>
    <button className="primary-button" disabled={salvando}>{salvando?"Salvando...":"Salvar local"}</button>
   </div>
  </form>
 </div>
}
