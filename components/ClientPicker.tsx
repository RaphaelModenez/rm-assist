"use client";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

export default function ClientPicker({value,onChange}:{value:string,onChange:(v:string)=>void}) {
  const [items,setItems]=useState<any[]>([]);
  useEffect(()=>{
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.from("clientes").select("id,nome,nome_fantasia").order("nome").then(({data})=>setItems(data||[]));
  },[]);
  return <select value={value} onChange={e=>onChange(e.target.value)}>
    <option value="">Selecione o cliente</option>
    {items.map(c=><option key={c.id} value={c.id}>{c.nome_fantasia||c.nome}</option>)}
  </select>;
}
