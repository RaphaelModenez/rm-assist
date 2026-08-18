"use client";

import {useState} from "react";
import {getSupabase} from "@/lib/supabase";

export default function CancelarChamado({
  chamadoId,
  status,
  onCancelado
}:{chamadoId:string,status:string,onCancelado?:()=>void}){
  const [processando,setProcessando]=useState(false);
  const [erro,setErro]=useState("");

  async function cancelar(){
    if(processando)return;

    if(status==="em_atendimento"){
      setErro("Cancele primeiro o início do atendimento/OS.");
      return;
    }

    if(!confirm("Cancelar este chamado?\n\nO chamado será mantido no histórico com status Cancelado. Nenhum cliente, local ou equipamento será apagado."))return;

    const s=getSupabase();
    if(!s)return setErro("Supabase não configurado.");

    setProcessando(true);
    setErro("");

    const {error}=await s.from("chamados").update({
      status:"cancelado",
      updated_at:new Date().toISOString()
    }).eq("id",chamadoId);

    setProcessando(false);

    if(error)return setErro(error.message);

    onCancelado?.();
  }

  return <div style={{display:"grid",gap:5}}>
    {erro&&<small style={{color:"#b42318",maxWidth:240}}>{erro}</small>}
    <button
      type="button"
      className="secondary-button"
      disabled={processando}
      onClick={cancelar}
      style={{color:"#b42318",borderColor:"#f3b8b2"}}
    >
      {processando?"Cancelando...":"Cancelar chamado"}
    </button>
  </div>
}
