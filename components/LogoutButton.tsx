"use client";
import {useState} from "react";
import {getSupabase} from "@/lib/supabase";

export default function LogoutButton(){
  const [saindo,setSaindo]=useState(false);
  async function sair(){
    const s=getSupabase();if(!s)return;
    setSaindo(true);
    await s.auth.signOut();
    setSaindo(false);
  }
  return <button className="menu-item logout-item" onClick={sair} disabled={saindo}><span>{saindo?"Saindo...":"Sair do RM Assist"}</span><span>↗</span></button>
}
