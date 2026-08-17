"use client";
import { useEffect, useState } from "react";
import { readStore } from "@/lib/local-store";

export default function ClientPicker({value,onChange}:{value:string,onChange:(v:string)=>void}) {
  const [items,setItems]=useState<any[]>([]);
  useEffect(()=>setItems(readStore("clientes")),[]);
  return <select value={value} onChange={e=>onChange(e.target.value)}>
    <option value="">Selecione o cliente</option>
    {items.map(c=><option key={c.id} value={c.id}>{c.nome_fantasia||c.nome}</option>)}
  </select>;
}
