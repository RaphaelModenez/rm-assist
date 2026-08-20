"use client";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import {getSupabase} from "@/lib/supabase";

export default function OSPauseControl(){
  const pathname=usePathname();
  const match=pathname.match(/^\/os\/([^/]+)(?:\/equipamentos)?$/);
  const osId=match?.[1]||"";
  const [os,setOs]=useState<any>(null);
  const [erro,setErro]=useState("");
  const [salvando,setSalvando]=useState(false);

  useEffect(()=>{
    if(!osId){setOs(null);return}
    const s=getSupabase();if(!s)return;
    s.from("ordens_servico").select("id,numero,status,pausa_motivo,pausada_em,retomada_em,chamado_id").eq("id",osId).single().then(({data,error})=>{
      if(error)setErro(error.message);else setOs(data)
    })
  },[osId]);

  if(!osId||!os||os.status==="concluida"||os.status==="cancelada")return null;

  async function pausar(){
    if(salvando)return;
    const motivo=prompt("Motivo da pausa da OS:\n\nEx.: equipamento desinstalado para manutenção, aguardando peça, aguardando retorno do cliente.",os.pausa_motivo||"");
    if(motivo===null)return;
    if(!motivo.trim())return setErro("Informe o motivo da pausa.");
    const s=getSupabase();if(!s)return;
    setSalvando(true);setErro("");
    const agora=new Date().toISOString();
    const {error}=await s.from("ordens_servico").update({status:"pausada",pausa_motivo:motivo.trim(),pausada_em:agora,updated_at:agora}).eq("id",osId);
    setSalvando(false);
    if(error)return setErro(error.message);
    setOs({...os,status:"pausada",pausa_motivo:motivo.trim(),pausada_em:agora});
  }

  async function retomar(){
    if(salvando)return;
    const s=getSupabase();if(!s)return;
    setSalvando(true);setErro("");
    const agora=new Date().toISOString();
    const {error}=await s.from("ordens_servico").update({status:"em_atendimento",retomada_em:agora,updated_at:agora}).eq("id",osId);
    setSalvando(false);
    if(error)return setErro(error.message);
    setOs({...os,status:"em_atendimento",retomada_em:agora});
  }

  return <div style={{position:"fixed",left:"50%",transform:"translateX(-50%)",bottom:"calc(76px + env(safe-area-inset-bottom))",zIndex:50,width:"min(720px, calc(100% - 24px))",background:"#fff",border:"1px solid #dbe2ea",borderRadius:16,padding:12,boxShadow:"0 10px 30px rgba(15,23,42,.16)"}}>
    {erro&&<div className="error-box" style={{marginBottom:8}}>{erro}</div>}
    <div style={{display:"flex",gap:10,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}>
      <div style={{minWidth:0,flex:1}}>
        <strong>{os.status==="pausada"?"OS pausada":"OS em atendimento"}</strong>
        {os.status==="pausada"&&<small style={{display:"block",marginTop:3,color:"#64748b"}}>{os.pausa_motivo||"Pausa sem motivo informado"}</small>}
      </div>
      {os.status==="pausada"?
        <button type="button" className="primary-button" disabled={salvando} onClick={retomar}>{salvando?"Retomando...":"Retomar OS"}</button>:
        <button type="button" className="secondary-button" disabled={salvando} onClick={pausar} style={{color:"#9a6700",borderColor:"#e7c56f"}}>{salvando?"Pausando...":"Pausar OS"}</button>}
    </div>
  </div>
}
