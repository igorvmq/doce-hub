"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = "pendente" | "em andamento" | "concluido" | "cancelado";

interface PedidoApi {
  id: number;
  numeroPedido: string;
  status: string;
  nomeCliente: string;
  email: string;
  telefoneWhatsapp: string;
  endereco?: string;
  retiradaLocal: boolean;
  valorTotal: number;
  criadoEm: string;
  entregarEm?: string;
  itens: Array<{
    idProduto: number;
    quantidade: number;
    precoUnitario: number;
    observacao?: string;
    produto?: {
      nome: string;
      descricao?: string;
    };
  }>;
}

interface OrderProduct {
  id: number;
  name: string;
  quantity: number;
  price: number;
  note?: string;
}

interface Order {
  id: number;
  number: string;
  deliveryDate: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  customer: {
    name: string;
    email: string;
    whatsapp: string;
  };
  address: string;
  products: OrderProduct[];
}

// ─── Status Config ────────────────────────────────────────────────────────────

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  pendente: { label: "pendente", color: "text-zinc-500" },
  "em andamento": { label: "em andamento", color: "text-amber-500" },
  concluido: { label: "concluído", color: "text-emerald-600" },
  cancelado: { label: "cancelado", color: "text-red-500" },
};

const sortOptions = ["status", "data de entrega", "valor", "número"];

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({
  order,
  onStatusChange,
}: {
  order: Order;
  onStatusChange: (id: number, status: OrderStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[order.status];

  return (
    <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all duration-200 ${expanded ? "border-zinc-300" : "border-zinc-100"}`}>
      {/* ── Summary row ── */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full px-5 py-4 flex items-start gap-2 text-left hover:bg-zinc-50 transition-colors"
      >
        <div className="grid grid-cols-4 flex-1 gap-2">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Nº pedido</p>
            <p className="text-sm font-semibold text-zinc-900">{order.number}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Entregar em</p>
            <p className="text-xs text-zinc-700">{order.deliveryDate}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Valor</p>
            <p className="text-sm font-bold text-zinc-900">R${order.total.toFixed(2).replace(".", ",")}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Status</p>
            <p className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</p>
          </div>
        </div>
        <ChevronDown className={`shrink-0 mt-1 text-zinc-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
      </button>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="px-5 pb-5 pt-1 border-t border-zinc-100 flex flex-col gap-4">

          {/* Meta */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Solicitado em</p>
              <p className="text-xs text-zinc-700 mt-0.5">{order.createdAt}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Cliente</p>
              <p className="text-xs text-zinc-700 mt-0.5">{order.customer.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Endereço</p>
              <p className="text-xs text-zinc-700 mt-0.5">{order.address || "Retirada no local"}</p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-black text-zinc-900 uppercase tracking-wide mb-2">Contato</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Email</p>
                <p className="text-xs text-zinc-700 mt-0.5 break-all">{order.customer.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Telefone / WhatsApp</p>
                <p className="text-xs text-zinc-700 mt-0.5">{order.customer.whatsapp}</p>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <p className="text-xs font-black text-zinc-900 uppercase tracking-wide mb-2">Produtos</p>
            <div className="rounded-xl border border-zinc-100 overflow-hidden">
              <div className="grid grid-cols-4 gap-2 px-3 py-1.5 bg-zinc-50">
                {["Qtd", "Produto", "Valor", "Obs"].map((h) => (
                  <p key={h} className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">{h}</p>
                ))}
              </div>
              {order.products.map((p) => (
                <div key={p.id} className="grid grid-cols-4 gap-2 px-3 py-2 border-t border-zinc-50">
                  <p className="text-xs text-zinc-600">{p.quantity}x</p>
                  <p className="text-xs text-zinc-800 font-medium">{p.name}</p>
                  <p className="text-xs text-zinc-800 font-bold">R${(p.price * p.quantity).toFixed(2).replace(".", ",")}</p>
                  <p className="text-xs text-zinc-500 italic">{p.note || "—"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <span className="text-xs text-zinc-400 mr-auto">alterar pedido</span>
            <button
              onClick={() => onStatusChange(order.id, "concluido")}
              disabled={order.status === "concluido"}
              className="px-4 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-900 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              concluir
            </button>
            <button
              onClick={() => onStatusChange(order.id, "cancelado")}
              disabled={order.status === "cancelado"}
              className="px-4 py-1.5 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-600 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("status");
  const [sortOpen, setSortOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"pedidos" | "financeiro">("pedidos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/pedidos`);
        const pedidos: PedidoApi[] = await response.json();

        const mapped: Order[] = pedidos.map((p) => ({
          id: p.id,
          number: p.numeroPedido,
          deliveryDate: p.entregarEm
            ? new Date(p.entregarEm).toLocaleDateString("pt-BR")
            : new Date(p.criadoEm).toLocaleDateString("pt-BR"),
          total: p.valorTotal,
          status: p.status.toLowerCase() === "pendente" || p.status.toLowerCase() === "iniciada" ? "pendente" : (p.status.toLowerCase() as OrderStatus),
          createdAt: new Date(p.criadoEm).toLocaleString("pt-BR"),
          customer: {
            name: p.nomeCliente,
            email: p.email,
            whatsapp: p.telefoneWhatsapp,
          },
          address: p.retiradaLocal ? "Retirada no local" : (p.endereco || "Não informado"),
          products: p.itens.map((item, idx) => ({
            id: item.idProduto,
            name: item.produto?.nome || `Produto ${item.idProduto}`,
            quantity: item.quantidade,
            price: item.precoUnitario,
            note: item.observacao,
          })),
        }));

        setOrders(mapped);
      } catch (error) {
        console.error("Erro ao carregar pedidos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleStatusChange = async (id: number, status: OrderStatus) => {
    try {
      const statusMap: Record<OrderStatus, string> = {
        pendente: "pendente",
        "em andamento": "em andamento",
        concluido: "concluído",
        cancelado: "cancelado",
      };

      const response = await fetch(`${API_BASE}/pedidos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusMap[status] }),
      });

      if (response.ok) {
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const filtered = orders
    .filter((o) =>
      o.number.includes(search) ||
      o.customer.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "status") return a.status.localeCompare(b.status);
      if (sortBy === "valor") return b.total - a.total;
      if (sortBy === "número") return a.number.localeCompare(b.number);
      return a.deliveryDate.localeCompare(b.deliveryDate);
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans flex flex-col items-center justify-center">
        <p className="text-zinc-400">Carregando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans flex flex-col">
      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="bg-white border-b border-zinc-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-5 flex justify-center">
          <span className="text-2xl font-black tracking-tight text-zinc-900 uppercase">Doce Hub</span>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────────── */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-6 pb-32 flex flex-col gap-4">
        <h1 className="text-lg font-black text-zinc-900 uppercase tracking-tight text-center">
          Pedidos em Aberto
        </h1>

        {/* Search + Sort */}
        <div className="flex gap-2">
          {/* Search */}
          <div className="flex-1 flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-2 shadow-sm">
            <SearchIcon />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="buscar pedido ou cliente..."
              className="flex-1 text-xs text-zinc-700 placeholder:text-zinc-300 focus:outline-none bg-transparent"
            />
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen((p) => !p)}
              className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 transition whitespace-nowrap"
            >
              Ordenar: {sortBy}
              <ChevronDown className={`transition-transform duration-150 ${sortOpen ? "rotate-180" : ""}`} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-zinc-100 rounded-xl shadow-lg z-10 overflow-hidden min-w-[160px]">
                {sortOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setSortBy(opt); setSortOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-medium transition hover:bg-zinc-50 ${sortBy === opt ? "text-zinc-900 font-bold" : "text-zinc-500"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Orders */}
        <div className="flex flex-col gap-3">
          {filtered.length > 0 ? (
            filtered.map((order) => (
              <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
            ))
          ) : (
            <p className="text-zinc-300 text-sm text-center py-16">Nenhum pedido encontrado.</p>
          )}
        </div>

        {/* FAB */}
        <div className="flex justify-center pt-2">
          <button className="w-12 h-12 rounded-full bg-zinc-200 hover:bg-zinc-300 flex items-center justify-center text-zinc-500 transition shadow-sm">
            <PlusIcon />
          </button>
        </div>
      </main>

      {/* ── Bottom Tab Bar ────────────────────────────────────────── */}
      <footer className="fixed bottom-0 inset-x-0 z-30">
        <div className="max-w-lg mx-auto flex">
          <button
            onClick={() => setActiveTab("pedidos")}
            className={`flex-1 py-5 text-center transition-colors duration-150 ${activeTab === "pedidos" ? "bg-amber-400 text-zinc-900" : "bg-white text-zinc-400 border-t border-zinc-100"}`}
          >
            <span className="text-xs font-black uppercase tracking-widest">Pedidos</span>
          </button>
          <button
            onClick={() => setActiveTab("financeiro")}
            className={`flex-1 py-5 text-center transition-colors duration-150 ${activeTab === "financeiro" ? "bg-amber-400 text-zinc-900" : "bg-white text-zinc-400 border-t border-zinc-100"}`}
          >
            <span className="text-xs font-black uppercase tracking-widest">Financeiro</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
