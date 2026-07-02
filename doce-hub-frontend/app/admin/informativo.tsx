"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "hoje" | "semana" | "mês" | "ano";

interface CategoryStat {
  label: string;
  revenue: number;
  productsSold: number;
  orders?: number;
}

interface PeriodData {
  categories: CategoryStat[];
  total: CategoryStat;
}

interface Produto {
  id: number;
  nome: string;
  preco: number;
  idCategoria: number;
}

interface Categoria {
  id: number;
  nome: string;
}

interface PedidoProduto {
  idProduto: number;
  quantidade: number;
  precoUnitario: number;
  subtotalItem: number;
}

interface Pedido {
  id: number;
  valorTotal: number;
  status: string;
  criadoEm: string;
  itens: PedidoProduto[];
}

const periods: Period[] = ["hoje", "semana", "mês", "ano"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getDateRange(period: Period): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  if (period === "hoje") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === "semana") {
    start.setDate(end.getDate() - 7);
    start.setHours(0, 0, 0, 0);
  } else if (period === "mês") {
    start.setMonth(end.getMonth() - 1);
    start.setHours(0, 0, 0, 0);
  } else if (period === "ano") {
    start.setFullYear(end.getFullYear() - 1);
    start.setHours(0, 0, 0, 0);
  }

  return { start, end };
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  revenue,
  productsSold,
  orders,
  highlight = false,
}: CategoryStat & { highlight?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 bg-white border rounded-2xl px-4 py-4 shadow-sm ${highlight ? "border-zinc-300" : "border-zinc-100"}`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
      <p className="text-xl font-black text-zinc-900 leading-tight">R${fmt(revenue)}</p>
      <p className="text-xs text-zinc-400">
        {productsSold} produtos vendidos
        {orders !== undefined ? ` em ${orders} pedidos` : ""}
      </p>
    </div>
  );
}

// ─── Chevron Icon ─────────────────────────────────────────────────────────────

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FinancialPage() {
  const [period, setPeriod] = useState<Period>("hoje");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"pedidos" | "financeiro">("financeiro");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Record<Period, PeriodData>>({
    hoje: { categories: [], total: { label: "Total", revenue: 0, productsSold: 0, orders: 0 } },
    semana: { categories: [], total: { label: "Total", revenue: 0, productsSold: 0, orders: 0 } },
    mês: { categories: [], total: { label: "Total", revenue: 0, productsSold: 0, orders: 0 } },
    ano: { categories: [], total: { label: "Total", revenue: 0, productsSold: 0, orders: 0 } },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [pedidosRes, produtosRes, categoriasRes] = await Promise.all([
          fetch(`${API_BASE}/pedidos`),
          fetch(`${API_BASE}/produtos`),
          fetch(`${API_BASE}/categorias`),
        ]);

        const pedidos: Pedido[] = await pedidosRes.json();
        const produtos: Produto[] = await produtosRes.json();
        const categorias: Categoria[] = await categoriasRes.json();

        // Mapear produtos para categorias
        const produtoMap = new Map(produtos.map((p) => [p.id, p]));
        const categoriaMap = new Map(categorias.map((c) => [c.id, c]));

        // Calcular estatísticas para cada período
        const newData: Record<Period, PeriodData> = {} as Record<Period, PeriodData>;

        for (const p of periods) {
          const { start, end } = getDateRange(p);

          const pedidosFiltrados = pedidos.filter((pedido) => {
            const data = new Date(pedido.criadoEm);
            return data >= start && data <= end;
          });

          const categoryStats = new Map<number, { revenue: number; productsSold: number; orders: Set<number> }>();

          let totalRevenue = 0;
          let totalProductsSold = 0;
          const totalOrders = new Set<number>();

          pedidosFiltrados.forEach((pedido) => {
            totalOrders.add(pedido.id);
            pedido.itens.forEach((item) => {
              const produto = produtoMap.get(item.idProduto);
              if (produto) {
                const catId = produto.idCategoria;
                if (!categoryStats.has(catId)) {
                  categoryStats.set(catId, { revenue: 0, productsSold: 0, orders: new Set() });
                }
                const stats = categoryStats.get(catId)!;
                stats.revenue += item.subtotalItem;
                stats.productsSold += item.quantidade;
                stats.orders.add(pedido.id);
                totalRevenue += item.subtotalItem;
                totalProductsSold += item.quantidade;
              }
            });
          });

          const categoryList: CategoryStat[] = Array.from(categoryStats.entries())
            .map(([catId, stats]) => ({
              label: categoriaMap.get(catId)?.nome || `Categoria ${catId}`,
              revenue: stats.revenue,
              productsSold: stats.productsSold,
            }))
            .sort((a, b) => b.revenue - a.revenue);

          newData[p] = {
            categories: categoryList,
            total: {
              label: "Total",
              revenue: totalRevenue,
              productsSold: totalProductsSold,
              orders: totalOrders.size,
            },
          };
        }

        setData(newData);
      } catch (error) {
        console.error("Erro ao carregar dados financeiros:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const { categories, total } = data[period];

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans flex flex-col items-center justify-center">
        <p className="text-zinc-400">Carregando dados financeiros...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans flex flex-col">
      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="bg-white border-b border-zinc-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-5 flex justify-center">
          <img src="/logo-doce-hub.png" alt="Doce Hub" className="h-12 w-auto object-contain" />
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────────── */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-6 pb-32 flex flex-col gap-6">
        <h1 className="text-lg font-black text-zinc-900 uppercase tracking-tight text-center">
          Informações Financeiras
        </h1>

        {/* Period selector */}
        <div className="flex justify-center">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((p) => !p)}
              className="flex items-center gap-3 bg-white border border-zinc-200 rounded-xl px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 transition min-w-[140px] justify-between"
            >
              {period}
              <ChevronDown open={dropdownOpen} />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-zinc-100 rounded-xl shadow-lg z-10 overflow-hidden">
                {periods.map((p) => (
                  <button
                    key={p}
                    onClick={() => { setPeriod(p); setDropdownOpen(false); }}
                    className={`w-full text-left px-5 py-2.5 text-sm transition hover:bg-zinc-50 ${period === p ? "font-bold text-zinc-900" : "font-medium text-zinc-500"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category cards — 3 columns */}
        {categories.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {categories.slice(0, 3).map((cat) => (
              <StatCard key={cat.label} {...cat} />
            ))}
          </div>
        ) : (
          <div className="text-center text-zinc-400 text-sm py-8">Nenhum dado disponível para este período</div>
        )}

        {/* Total card — centered, half width */}
        <div className="flex justify-center">
          <div className="w-1/2">
            <StatCard {...total} highlight />
          </div>
        </div>
      </main>

      {/* ── Bottom Tab Bar ────────────────────────────────────────── */}
      <footer className="fixed bottom-0 inset-x-0 z-30">
        <div className="max-w-lg mx-auto flex">
          <button
            onClick={() => setActiveTab("pedidos")}
            className={`flex-1 py-5 text-center transition-colors duration-150 ${
              activeTab === "pedidos"
                ? "bg-amber-400 text-zinc-900"
                : "bg-white text-zinc-400 border-t border-zinc-100"
            }`}
          >
            <span className="text-xs font-black uppercase tracking-widest">Pedidos</span>
          </button>
          <button
            onClick={() => setActiveTab("financeiro")}
            className={`flex-1 py-5 text-center transition-colors duration-150 ${
              activeTab === "financeiro"
                ? "bg-amber-400 text-zinc-900"
                : "bg-white text-zinc-400 border-t border-zinc-100"
            }`}
          >
            <span className="text-xs font-black uppercase tracking-widest">Financeiro</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
