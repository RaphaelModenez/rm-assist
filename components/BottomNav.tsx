"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Início", icon: "⌂" },
  { href: "/agenda", label: "Agenda", icon: "▣" },
  { href: "/servicos", label: "Serviços", icon: "⌁" },
  { href: "/clientes", label: "Clientes", icon: "♙" },
  { href: "/mais", label: "Mais", icon: "•••" }
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {items.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "nav-item active" : "nav-item"}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
