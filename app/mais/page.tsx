import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default function Mais(){
  const itens=[
    ["/historico","Histórico de serviços"],
    ["/equipamentos","Equipamentos"],
    ["/relatorios","Relatórios"],
    ["/orcamentos","Orçamentos"],
    ["/financeiro","Financeiro"],
    ["/pmoc","PMOC"]
  ];
  return <div className="page"><header className="simple-header"><div><p className="eyebrow">RM ASSIST</p><h1>Mais</h1><p>Recursos adicionais.</p></div></header><div className="menu-list">{itens.map(([h,l])=><Link href={h} className="menu-item" key={h}><span>{l}</span><span>›</span></Link>)}<LogoutButton/></div></div>
}
