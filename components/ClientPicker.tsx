"use client";
import {useEffect,useState} from "react";
import {getSupabase} from "@/lib/supabase";

export default function ClientPicker({value,onChange}:{value:string,onChange:(v:string)=>void}) {
  const [items,setItems]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [erro,setErro]=useState("");

  useEffect(()=>{
    (async()=>{
      const supabase=getSupabase();
      if(!supabase){setErro("Supabase não configurado.");setLoading(false);return}
      const {data,error}=await supabase.from("clientes").select("id,nome,nome_fantasia").eq("ativo",true).order("nome");
      if(error)setErro(error.message); else setItems(data||[]);
      setLoading(false);
    })()
  },[]);

  return <div>
    <select value={value} onChange={e=>onChange(e.target.value)} disabled={loading}>
      <option value="">{loading?"Carregando clientes...":"Selecione o cliente"}</option>
      {items.map(c=><option key={c.id} value={c.id}>{c.nome_fantasia||c.nome}</option>)}
    </select>
    {!loading&&!erro&&items.length===0&&<small className="muted">Nenhum cliente cadastrado.</small>}
    {erro&&<small style={{color:"#b42318"}}>{erro}</small>}
  </div>;
}
