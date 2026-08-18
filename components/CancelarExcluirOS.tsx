"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {getSupabase} from "@/lib/supabase";

export default function CancelarExcluirOS({
  osId,
  status,
  chamadoId
}:{osId:string,status:string,chamadoId?:string|null}){
  const r=useRouter();
  const [processando,setProcessando]=useState(false);
  const [erro,setErro]=useState("");

  async function executar(){
    if(processando)return;

    const concluida=status==="concluida";
    const texto=concluida
      ?"Excluir definitivamente esta ordem de serviço?\n\nUse esta opção somente se a OS foi criada/concluída por engano. Todos os dados desta OS serão apagados."
      :"Cancelar o início deste atendimento?\n\nA OS será removida e o chamado voltará para Agendado ou Aberto.";

    if(!confirm(texto))return;
    if(concluida&&!confirm("Confirme novamente: deseja realmente excluir esta OS e todo o histórico dela?"))return;

    const s=getSupabase();
    if(!s)return setErro("Supabase não configurado.");

    setProcessando(true);
    setErro("");

    try{
      let novoStatus:"agendado"|"aberto"="aberto";

      if(chamadoId){
        const {data:ch,error:eCh}=await s.from("chamados")
          .select("data_agendada")
          .eq("id",chamadoId)
          .single();
        if(eCh)throw eCh;
        novoStatus=ch?.data_agendada?"agendado":"aberto";
      }

      const {data:fotos,error:eFotos}=await s.from("fotos_servico")
        .select("storage_path")
        .eq("ordem_servico_id",osId);
      if(eFotos)throw eFotos;

      const caminhos=(fotos||[]).map((x:any)=>x.storage_path).filter(Boolean);
      if(caminhos.length){
        const {error:eStorage}=await s.storage.from("fotos-servico").remove(caminhos);
        if(eStorage)throw eStorage;
      }

      for(const tabela of [
        "fotos_servico",
        "checklist_itens",
        "medicoes",
        "materiais_servico",
        "os_equipamento_execucao",
        "ordem_servico_equipamentos"
      ]){
        const {error}=await s.from(tabela).delete().eq("ordem_servico_id",osId);
        if(error)throw error;
      }

      const {error:eDel}=await s.from("ordens_servico").delete().eq("id",osId);
      if(eDel)throw eDel;

      if(chamadoId){
        const {error:eVoltar}=await s.from("chamados").update({
          status:novoStatus,
          updated_at:new Date().toISOString()
        }).eq("id",chamadoId);
        if(eVoltar)throw eVoltar;
      }

      r.refresh();
      window.location.href=chamadoId&&novoStatus==="agendado"?"/agenda":"/servicos";
    }catch(e:any){
      setErro(e?.message||"Não foi possível cancelar/excluir a OS.");
      setProcessando(false);
    }
  }

  return <div style={{display:"grid",gap:6}}>
    {erro&&<small style={{color:"#b42318",maxWidth:260}}>{erro}</small>}
    <button
      type="button"
      className="secondary-button"
      disabled={processando}
      onClick={executar}
      style={{color:"#b42318",borderColor:"#f3b8b2"}}
    >
      {processando
        ?"Processando..."
        :status==="concluida"
          ?"Excluir OS"
          :"Cancelar início"}
    </button>
  </div>
}
