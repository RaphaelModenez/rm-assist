"use client";

import Image from "next/image";
import {FormEvent,useEffect,useState} from "react";
import {getSupabase} from "@/lib/supabase";

export default function AuthGate({children}:{children:React.ReactNode}){
  const [loading,setLoading]=useState(true);
  const [autenticado,setAutenticado]=useState(false);
  const [modo,setModo]=useState<"entrar"|"criar">("entrar");
  const [email,setEmail]=useState("");
  const [senha,setSenha]=useState("");
  const [erro,setErro]=useState("");
  const [mensagem,setMensagem]=useState("");
  const [enviando,setEnviando]=useState(false);

  useEffect(()=>{
    const s=getSupabase();
    if(!s){setErro("Supabase não configurado.");setLoading(false);return}
    s.auth.getSession().then(({data})=>{
      setAutenticado(!!data.session);
      setLoading(false);
    });
    const {data:listener}=s.auth.onAuthStateChange((_event,session)=>{
      setAutenticado(!!session);
      setLoading(false);
    });
    return ()=>listener.subscription.unsubscribe();
  },[]);

  async function enviar(e:FormEvent){
    e.preventDefault();
    if(!email.trim()||!senha)return setErro("Informe e-mail e senha.");
    if(senha.length<6)return setErro("A senha precisa ter pelo menos 6 caracteres.");
    const s=getSupabase();if(!s)return setErro("Supabase não configurado.");
    setEnviando(true);setErro("");setMensagem("");

    if(modo==="entrar"){
      const {error}=await s.auth.signInWithPassword({email:email.trim(),password:senha});
      setEnviando(false);
      if(error)return setErro(error.message==="Invalid login credentials"?"E-mail ou senha incorretos.":error.message);
      return;
    }

    const {data,error}=await s.auth.signUp({email:email.trim(),password:senha});
    setEnviando(false);
    if(error)return setErro(error.message);
    if(data.session){
      setMensagem("Acesso criado com sucesso.");
    }else{
      setMensagem("Acesso criado. Verifique seu e-mail para confirmar a conta e depois entre no RM Assist.");
      setModo("entrar");
    }
  }

  if(loading)return <div className="auth-screen"><div className="auth-card"><p>Carregando RM Assist...</p></div></div>;
  if(autenticado)return <>{children}</>;

  return <div className="auth-screen">
    <form className="auth-card" onSubmit={enviar}>
      <Image src="/icons/rm-assist-logo.png" alt="RM Assist" width={78} height={78} className="auth-logo"/>
      <p className="eyebrow">RM ASSIST</p>
      <h1>{modo==="entrar"?"Acesso protegido":"Criar acesso"}</h1>
      <p className="muted">{modo==="entrar"?"Entre com seu e-mail e senha para acessar seus clientes e ordens de serviço.":"Crie o primeiro acesso do aplicativo. Depois vamos bloquear novos cadastros."}</p>

      <div className="field"><label>E-mail</label><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com"/></div>
      <div className="field"><label>Senha</label><input type="password" autoComplete={modo==="entrar"?"current-password":"new-password"} value={senha} onChange={e=>setSenha(e.target.value)} placeholder="Mínimo 6 caracteres"/></div>
      {erro&&<div className="error-box">{erro}</div>}
      {mensagem&&<div className="success-box">{mensagem}</div>}
      <button className="primary-button auth-submit" disabled={enviando}>{enviando?"Aguarde...":modo==="entrar"?"Entrar":"Criar meu acesso"}</button>
      <button type="button" className="auth-link" onClick={()=>{setModo(modo==="entrar"?"criar":"entrar");setErro("");setMensagem("")}}>{modo==="entrar"?"Primeiro acesso? Criar conta":"Já tenho acesso"}</button>
    </form>
  </div>
}
