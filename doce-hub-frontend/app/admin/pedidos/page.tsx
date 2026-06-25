"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusPedido = "pendente" | "em andamento" | "concluido" | "cancelado";

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

interface ProdutoPedido {
  id: number;
  nome: string;
  quantidade: number;
  preco: number;
  nota?: string;
}

interface Pedido {
  id: number;
  numero: string;
  dataEntrega: string;
  total: number;
  status: StatusPedido;
  dataCriacao: string;
  cliente: {
    nome: string;
    email: string;
    whatsapp: string;
  };
  endereco: string;
  produtos: ProdutoPedido[];
}

// ─── Status Config ────────────────────────────────────────────────────────────

const statusConfig: Record<StatusPedido, { label: string; color: string }> = {
  pendente: { label: "pendente", color: "text-zinc-500" },
  "em andamento": { label: "em andamento", color: "text-amber-500" },
  concluido: { label: "concluído", color: "text-emerald-600" },
  cancelado: { label: "cancelado", color: "text-red-500" },
};

const opcoeOrdenacao = ["status", "data de entrega", "valor", "número"];

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

function CartaoPedido({
  pedido,
  aoMudarStatus,
}: {
  pedido: Pedido;
  aoMudarStatus: (id: number, status: StatusPedido) => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const cfg = statusConfig[pedido.status];

  return (
    <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all duration-200 ${expandido ? "border-zinc-300" : "border-zinc-100"}`}>
      {/* ── Summary row ── */}
      <button
        onClick={() => setExpandido((p) => !p)}
        className="w-full px-5 py-4 flex items-start gap-2 text-left hover:bg-zinc-50 transition-colors"
      >
        <div className="grid grid-cols-4 flex-1 gap-2">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Nº pedido</p>
            <p className="text-sm font-semibold text-zinc-900">{pedido.numero}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Entregar em</p>
            <p className="text-xs text-zinc-700">{pedido.dataEntrega}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Valor</p>
            <p className="text-sm font-bold text-zinc-900">R${pedido.total.toFixed(2).replace(".", ",")}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Status</p>
            <p className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</p>
          </div>
        </div>
        <ChevronDown className={`shrink-0 mt-1 text-zinc-400 transition-transform duration-200 ${expandido ? "rotate-180" : ""}`} />
      </button>

      {/* ── Expanded detail ── */}
      {expandido && (
        <div className="px-5 pb-5 pt-1 border-t border-zinc-100 flex flex-col gap-4">

          {/* Meta */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Solicitado em</p>
              <p className="text-xs text-zinc-700 mt-0.5">{pedido.dataCriacao}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Cliente</p>
              <p className="text-xs text-zinc-700 mt-0.5">{pedido.cliente.nome}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Endereço</p>
              <p className="text-xs text-zinc-700 mt-0.5">{pedido.endereco || "Retirada no local"}</p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-black text-zinc-900 uppercase tracking-wide mb-2">Contato</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Email</p>
                <p className="text-xs text-zinc-700 mt-0.5 break-all">{pedido.cliente.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Telefone / WhatsApp</p>
                <p className="text-xs text-zinc-700 mt-0.5">{pedido.cliente.whatsapp}</p>
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
              {pedido.produtos.map((p) => (
                <div key={p.id} className="grid grid-cols-4 gap-2 px-3 py-2 border-t border-zinc-50">
                  <p className="text-xs text-zinc-600">{p.quantidade}x</p>
                  <p className="text-xs text-zinc-800 font-medium">{p.nome}</p>
                  <p className="text-xs text-zinc-800 font-bold">R${(p.preco * p.quantidade).toFixed(2).replace(".", ",")}</p>
                  <p className="text-xs text-zinc-500 italic">{p.nota || "—"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <span className="text-xs text-zinc-400 mr-auto">alterar pedido</span>
            <button
              onClick={() => aoMudarStatus(pedido.id, "concluido")}
              disabled={pedido.status === "concluido"}
              className="px-4 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-900 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              concluir
            </button>
            <button
              onClick={() => aoMudarStatus(pedido.id, "cancelado")}
              disabled={pedido.status === "cancelado"}
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

export default function PaginaPedidosAdmin() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [busca, setBusca] = useState("");
  const [ordenarPor, setOrdenarPor] = useState("status");
  const [menuOrdenacaoAberto, setMenuOrdenacaoAberto] = useState(false);
  const [abaSelecionada, setAbaSelecionada] = useState<"pedidos" | "financeiro">("pedidos");
  const [carregando, setCarregando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const PAGE_SIZE = 15;
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [temMais, setTemMais] = useState(true);
  const mapStatus = (apiStatus: string): StatusPedido => {
    const lower = apiStatus.toLowerCase().trim();
    if (lower === "em andamento") return "em andamento";
    if (lower === "concluido" || lower === "concluída") return "concluido";
    if (lower === "cancelado" || lower === "cancelada") return "cancelado";
    return "pendente"; // default
  };

  const buscarPagina = async (page: number) => {
    try {
      if (page === 1) setCarregando(true);
      else setCarregandoMais(true);

      const response = await fetch(`${API_BASE}/pedidos?page=${page}&pageSize=${PAGE_SIZE}`);
      const pedidosApi: PedidoApi[] = await response.json();

      const mapeados: Pedido[] = pedidosApi.map((p) => ({
        id: p.id,
        numero: p.numeroPedido,
        dataEntrega: p.entregarEm
          ? new Date(p.entregarEm).toLocaleDateString("pt-BR")
          : new Date(p.criadoEm).toLocaleDateString("pt-BR"),
        total: p.valorTotal,
        status: mapStatus(p.status),
        dataCriacao: new Date(p.criadoEm).toLocaleString("pt-BR"),
        cliente: {
          nome: p.nomeCliente,
          email: p.email,
          whatsapp: p.telefoneWhatsapp,
        },
        endereco: p.retiradaLocal ? "Retirada no local" : (p.endereco || "Não informado"),
        produtos: p.itens.map((item) => ({
          id: item.idProduto,
          nome: item.produto?.nome || `Produto ${item.idProduto}`,
          quantidade: item.quantidade,
          preco: item.precoUnitario,
          nota: item.observacao,
        })),
      }));

      setPedidos((prev) => (page === 1 ? mapeados : [...prev, ...mapeados]));
      setTemMais(mapeados.length === PAGE_SIZE);
      setPagina(page);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      setCarregando(false);
      setCarregandoMais(false);
    }
  };

  useEffect(() => {
    buscarPagina(1);
  }, []);

  const tratarMudancaStatus = async (id: number, status: StatusPedido) => {
    try {
      const mapeamentoStatus: Record<StatusPedido, string> = {
        pendente: "pendente",
        "em andamento": "em andamento",
        concluido: "concluído",
        cancelado: "cancelado",
      };

      const response = await fetch(`${API_BASE}/pedidos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: mapeamentoStatus[status] }),
      });

      if (response.ok) {
        setPedidos((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const carregarMais = () => {
    if (carregandoMais || !temMais) return;
    buscarPagina(pagina + 1);
  };

  const filtrado = pedidos
    .filter((o) =>
      o.numero.includes(busca) ||
      o.cliente.nome.toLowerCase().includes(busca.toLowerCase())
    )
    .sort((a, b) => {
      if (ordenarPor === "status") {
        const ordem = ["pendente", "em andamento", "concluido", "cancelado"] as StatusPedido[];
        const ia = ordem.indexOf(a.status);
        const ib = ordem.indexOf(b.status);
        if (ia !== ib) return ia - ib;
        return a.numero.localeCompare(b.numero);
      }
      if (ordenarPor === "valor") return b.total - a.total;
      if (ordenarPor === "número") return a.numero.localeCompare(b.numero);
      return a.dataEntrega.localeCompare(b.dataEntrega);
    });

  if (carregando) {
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
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="buscar pedido ou cliente..."
              className="flex-1 text-xs text-zinc-700 placeholder:text-zinc-300 focus:outline-none bg-transparent"
            />
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOrdenacaoAberto((p) => !p)}
              className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 transition whitespace-nowrap"
            >
              Ordenar: {ordenarPor}
              <ChevronDown className={`transition-transform duration-150 ${menuOrdenacaoAberto ? "rotate-180" : ""}`} />
            </button>
            {menuOrdenacaoAberto && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-zinc-100 rounded-xl shadow-lg z-10 overflow-hidden min-w-[160px]">
                {opcoeOrdenacao.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setOrdenarPor(opt); setMenuOrdenacaoAberto(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-medium transition hover:bg-zinc-50 ${ordenarPor === opt ? "text-zinc-900 font-bold" : "text-zinc-500"}`}
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
          {filtrado.length > 0 ? (
            filtrado.map((pedido) => (
              <CartaoPedido key={pedido.id} pedido={pedido} aoMudarStatus={tratarMudancaStatus} />
            ))
          ) : (
            <p className="text-zinc-300 text-sm text-center py-16">Nenhum pedido encontrado.</p>
          )}
        </div>

        {/* FAB */}
        <div className="flex justify-center pt-2">
          <button
            onClick={carregarMais}
            disabled={!temMais || carregandoMais}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-zinc-500 transition shadow-sm ${(!temMais || carregandoMais) ? "bg-zinc-100 cursor-not-allowed opacity-60" : "bg-zinc-200 hover:bg-zinc-300"}`}
            aria-label="Carregar mais pedidos"
          >
            {carregandoMais ? (
              <svg className="w-5 h-5 animate-spin text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" strokeOpacity="0.2" />
                <path d="M22 12a10 10 0 0 1-10 10" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <PlusIcon />
            )}
          </button>
        </div>
      </main>

      {/* ── Bottom Tab Bar ────────────────────────────────────────── */}
      <footer className="fixed bottom-0 inset-x-0 z-30">
        <div className="max-w-lg mx-auto flex">
          <button
            onClick={() => setAbaSelecionada("pedidos")}
            className={`flex-1 py-5 text-center transition-colors duration-150 ${abaSelecionada === "pedidos" ? "bg-amber-400 text-zinc-900" : "bg-white text-zinc-400 border-t border-zinc-100"}`}
          >
            <span className="text-xs font-black uppercase tracking-widest">Pedidos</span>
          </button>
          <button
            onClick={() => setAbaSelecionada("financeiro")}
            className={`flex-1 py-5 text-center transition-colors duration-150 ${abaSelecionada === "financeiro" ? "bg-amber-400 text-zinc-900" : "bg-white text-zinc-400 border-t border-zinc-100"}`}
          >
            <span className="text-xs font-black uppercase tracking-widest">Financeiro</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
