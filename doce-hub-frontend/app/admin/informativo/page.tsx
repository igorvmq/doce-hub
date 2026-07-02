"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

// ─── Types ────────────────────────────────────────────────────────────────────

type Periodo = string;

interface EstatisticaCategoria {
  label: string;
  receita: number;
  produtosVendidos: number;
  pedidos?: number;
}

interface DadosPeriodo {
  categorias: EstatisticaCategoria[];
  total: EstatisticaCategoria;
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
  parentId?: number | null;
  id_categoria_pai?: number | null;
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

// periodos: hoje, esta semana, este mês, seguido dos últimos 6 meses (YYYY-MM)
const periodos: Periodo[] = (() => {
  const base: Periodo[] = ["hoje", "semana", "mês"];
  const meses: Periodo[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    meses.push(key);
  }
  return [...base, ...meses];
})();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function labelPeriodo(p: Periodo) {
  if (p === "hoje") return "Hoje";
  if (p === "semana") return "Esta semana";
  if (p === "mês") return "Este mês";
  if (/^\d{4}-\d{2}$/.test(p)) {
    const [y, m] = p.split("-").map((v) => parseInt(v, 10));
    const d = new Date(y, m - 1, 1);
    return d.toLocaleString("pt-BR", { month: "short", year: "numeric" });
  }
  return p;
}

function obterIntervaloData(periodo: Periodo): { inicio: Date; fim: Date } {
  const fim = new Date();
  let inicio = new Date();

  if (periodo === "hoje") {
    inicio = new Date(fim);
    inicio.setHours(0, 0, 0, 0);
    fim.setHours(23, 59, 59, 999);
  } else if (periodo === "semana") {
    inicio = new Date(fim);
    inicio.setDate(fim.getDate() - 7);
    inicio.setHours(0, 0, 0, 0);
  } else if (periodo === "mês") {
    inicio = new Date(fim);
    inicio.setMonth(fim.getMonth() - 1);
    inicio.setHours(0, 0, 0, 0);
  } else if (/^\d{4}-\d{2}$/.test(periodo)) {
    const [y, m] = periodo.split("-").map((v) => parseInt(v, 10));
    inicio = new Date(y, m - 1, 1, 0, 0, 0, 0);
    fim.setFullYear(y, m - 1 + 1, 0); // last day of that month
    fim.setHours(23, 59, 59, 999);
  } else {
    // fallback: last 30 days
    inicio = new Date(fim);
    inicio.setDate(fim.getDate() - 30);
    inicio.setHours(0, 0, 0, 0);
  }

  return { inicio, fim };
}

function getRootCategoryId(catId: number, mapaCategoria: Map<number, Categoria>): number {
  let current = mapaCategoria.get(catId);
  let lastId = catId;
  const seen = new Set<number>();
  while (current) {
    const parent = (current as any).id_categoria_pai ?? current.parentId;
    if (parent == null || seen.has(parent)) break;
    seen.add(parent);
    lastId = parent;
    current = mapaCategoria.get(parent);
  }
  return lastId;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function CartaoEstatistica({
  label,
  receita,
  produtosVendidos,
  pedidos,
  destaque = false,
}: EstatisticaCategoria & { destaque?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 bg-white border rounded-2xl px-4 py-4 shadow-sm ${destaque ? "border-zinc-300" : "border-zinc-100"}`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
      <p className="text-xl font-black text-zinc-900 leading-tight">R${fmt(receita)}</p>
      <p className="text-xs text-zinc-400">
        {produtosVendidos} produtos vendidos
        {pedidos !== undefined ? ` em ${pedidos} pedidos` : ""}
      </p>
    </div>
  );
}

// ─── Chevron Icon ─────────────────────────────────────────────────────────────

function ChevronDown({ aberto }: { aberto: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform duration-200 ${aberto ? "rotate-180" : ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PaginaInformativoAdmin() {
  const router = useRouter();
  const pathname = usePathname();
  const [periodo, setPeriodo] = useState<Periodo>("hoje");
  const [menuAberto, setMenuAberto] = useState(false);
  const [ordenacao, setOrdenacao] = useState<"alfabetica" | "valor">("alfabetica");
  const [menuOrdenacaoAberto, setMenuOrdenacaoAberto] = useState(false);
  const [abaSelecionada, setAbaSelecionada] = useState<"pedidos" | "financeiro">(
    pathname?.includes("/admin/informativo") ? "financeiro" : "pedidos"
  );
  const [carregando, setCarregando] = useState(true);
  const inicialDados = periodos.reduce((acc, p) => {
    acc[p] = { categorias: [], total: { label: "Total", receita: 0, produtosVendidos: 0, pedidos: 0 } } as DadosPeriodo;
    return acc;
  }, {} as Record<Periodo, DadosPeriodo>);

  const [dados, setDados] = useState<Record<Periodo, DadosPeriodo>>(inicialDados);

  useEffect(() => {
    setAbaSelecionada(pathname?.includes("/admin/informativo") ? "financeiro" : "pedidos");
  }, [pathname]);

  useEffect(() => {
    const buscarDados = async () => {
      try {
        setCarregando(true);
        const [pedidosRes, produtosRes, categoriasRes] = await Promise.all([
          fetch(`${API_BASE}/pedidos`),
          fetch(`${API_BASE}/produtos`),
          fetch(`${API_BASE}/categorias`),
        ]);

        const pedidos: Pedido[] = await pedidosRes.json();
        const produtos: Produto[] = await produtosRes.json();
        const categorias: Categoria[] = await categoriasRes.json();

        // Mapear produtos para categorias
        const mapaProduto = new Map(produtos.map((p) => [p.id, p]));
        const mapaCategoria = new Map(categorias.map((c) => [c.id, c]));

        // Calcular estatísticas para cada período
        const novosDados: Record<Periodo, DadosPeriodo> = {} as Record<Periodo, DadosPeriodo>;

        for (const p of periodos) {
          const { inicio, fim } = obterIntervaloData(p);

          const pedidosFiltrados = pedidos.filter((pedido) => {
            const data = new Date(pedido.criadoEm);
            return data >= inicio && data <= fim;
          });

          const estatisticasCategoria = new Map<number, { receita: number; produtosVendidos: number; pedidos: Set<number> }>();

          let totalReceita = 0;
          let totalProdutosVendidos = 0;
          const totalPedidos = new Set<number>();

          pedidosFiltrados.forEach((pedido) => {
            totalPedidos.add(pedido.id);
            pedido.itens.forEach((item) => {
              const produto = mapaProduto.get(item.idProduto);
              if (produto) {
                const idCategoria = produto.idCategoria;
                const rootCatId = getRootCategoryId(idCategoria, mapaCategoria);
                if (!estatisticasCategoria.has(rootCatId)) {
                  estatisticasCategoria.set(rootCatId, { receita: 0, produtosVendidos: 0, pedidos: new Set() });
                }
                const estatistica = estatisticasCategoria.get(rootCatId)!;
                estatistica.receita += item.subtotalItem;
                estatistica.produtosVendidos += item.quantidade;
                estatistica.pedidos.add(pedido.id);
                totalReceita += item.subtotalItem;
                totalProdutosVendidos += item.quantidade;
              }
            });
          });

          // Build list including all categories (ignore subcategories when possible), filling zeros
          const listaCategoria: EstatisticaCategoria[] = categorias
            .filter((c: any) => {
              const hasParent = ("id_categoria_pai" in c) ? c.id_categoria_pai != null : (c.parentId != null);
              return !hasParent;
            })
            .map((cat) => {
              const est = estatisticasCategoria.get(cat.id);
              return {
                label: cat.nome,
                receita: est?.receita ?? 0,
                produtosVendidos: est?.produtosVendidos ?? 0,
                pedidos: est?.pedidos ? (est!.pedidos.size) : 0,
              } as EstatisticaCategoria;
            });

          novosDados[p] = {
            categorias: listaCategoria,
            total: {
              label: "Total",
              receita: totalReceita,
              produtosVendidos: totalProdutosVendidos,
              pedidos: totalPedidos.size,
            },
          };
        }

        setDados(novosDados);
      } catch (error) {
        console.error("Erro ao carregar dados financeiros:", error);
      } finally {
        setCarregando(false);
      }
    };

    buscarDados();
  }, []);

  const { categorias, total } = dados[periodo];

  const categoriasOrdenadas = [...(categorias || [])].sort((a, b) => {
    if (ordenacao === "valor") return b.receita - a.receita;
    return a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" });
  });

  if (carregando) {
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

        {/* Period selector + Ordenação */}
        <div className="flex justify-center gap-3">
          <div className="relative">
            <button
              onClick={() => setMenuAberto((p) => !p)}
              className="flex items-center gap-3 bg-white border border-zinc-200 rounded-xl px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 transition min-w-[140px] justify-between"
            >
              {labelPeriodo(periodo)}
              <ChevronDown aberto={menuAberto} />
            </button>

            {menuAberto && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-zinc-100 rounded-xl shadow-lg z-10 overflow-hidden">
                {periodos.map((p) => (
                  <button
                    key={p}
                    onClick={() => { setPeriodo(p); setMenuAberto(false); }}
                    className={`w-full text-left px-5 py-2.5 text-sm transition hover:bg-zinc-50 ${periodo === p ? "font-bold text-zinc-900" : "font-medium text-zinc-500"}`}
                  >
                    {labelPeriodo(p)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setMenuOrdenacaoAberto((p) => !p)}
              className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 transition"
            >
              Ordenar: {ordenacao === "alfabetica" ? "A–Z" : "Maior valor"}
              <ChevronDown aberto={menuOrdenacaoAberto} />
            </button>

            {menuOrdenacaoAberto && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-zinc-100 rounded-xl shadow-lg z-10 overflow-hidden">
                <button
                  onClick={() => { setOrdenacao("alfabetica"); setMenuOrdenacaoAberto(false); }}
                  className={`w-full text-left px-5 py-2.5 text-sm transition hover:bg-zinc-50 ${ordenacao === "alfabetica" ? "font-bold text-zinc-900" : "font-medium text-zinc-500"}`}
                >
                  Ordem alfabética
                </button>
                <button
                  onClick={() => { setOrdenacao("valor"); setMenuOrdenacaoAberto(false); }}
                  className={`w-full text-left px-5 py-2.5 text-sm transition hover:bg-zinc-50 ${ordenacao === "valor" ? "font-bold text-zinc-900" : "font-medium text-zinc-500"}`}
                >
                  Maior valor
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Total card — centered, half width (moved above categories) */}
        <div className="flex justify-center">
          <div className="w-1/2">
            <CartaoEstatistica label={"Total"} receita={total.receita} produtosVendidos={total.produtosVendidos} destaque />
          </div>
        </div>

        {/* Category cards — show all categories (ignore subcategories) */}
        {categoriasOrdenadas.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {categoriasOrdenadas.map((cat) => (
              <CartaoEstatistica key={cat.label} {...cat} />
            ))}
          </div>
        ) : (
          <div className="text-center text-zinc-400 text-sm py-8">Nenhum dado disponível para este período</div>
        )}
      </main>

      {/* ── Bottom Tab Bar ────────────────────────────────────────── */}
      <footer className="fixed bottom-0 inset-x-0 z-30">
        <div className="max-w-lg mx-auto flex">
          <button
            onClick={() => router.push("/admin/pedidos")}
            className={`flex-1 py-5 text-center transition-colors duration-150 ${
              abaSelecionada === "pedidos"
                ? "bg-amber-400 text-zinc-900"
                : "bg-white text-zinc-400 border-t border-zinc-100"
            }`}
          >
            <span className="text-xs font-black uppercase tracking-widest">Pedidos</span>
          </button>
          <button
            onClick={() => router.push("/admin/informativo")}
            className={`flex-1 py-5 text-center transition-colors duration-150 ${
              abaSelecionada === "financeiro"
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
