"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

const items=[
  {href:"/",label:"Início",icon:"⌂",match:["/"]},
  {href:"/agenda",label:"Agenda",icon:"▣",match:["/agenda"]},
  {href:"/servicos",label:"Serviços",icon:"⌁",match:["/servicos","/chamados","/os"]},
  {href:"/clientes",label:"Clientes",icon:"♙",match:["/clientes"]},
  {href:"/mais",label:"Mais",icon:"•••",match:["/mais","/historico","/equipamentos","/relatorios","/orcamentos","/financeiro","/pmoc"]}
];

export default function BottomNav(){
  const pathname=usePathname();

  return <nav className="bottom-nav" aria-label="Navegação principal">
    {items.map(item=>{
      const active=item.match.some(prefix=>prefix==="/"?pathname==="/":pathname.startsWith(prefix));
      return <Link key={item.href} href={item.href} className={active?"nav-item active":"nav-item"} aria-current={active?"page":undefined}>
        <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
      </Link>
    })}
  </nav>;
}
