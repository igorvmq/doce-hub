"use client";

import { useEffect, useState } from "react";

// Tipos adaptados ao backend (PT-BR)
interface ProdutoAPI {
  id: number;
  idCategoria: number;
  nome: string;
  descricao?: string;
  preco: number;
  imagemUrl?: string | null;
  desabilitado?: boolean;
}

interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  imagemUrl?: string | null;
  categoria?: string; // nome da categoria (ex: doce, salgado)
  idCategoria?: number;
}

interface CartItem extends Produto {
  quantidade: number;
  observacao: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";
const CART_KEY = "docehub_cart";

function formatPrice(v: number) {
  return `R$${v.toFixed(2).replace('.', ',')}`;
}

function ProdutoCard({
  produto,
  cartItem,
  onAdd,
  onRemove,
  onObservacaoChange,
}: {
  produto: Produto;
  cartItem?: CartItem;
  onAdd: (produto: Produto) => void;
  onRemove: (produto: Produto) => void;
  onObservacaoChange: (produto: Produto, observacao: string) => void;
}) {
  const qty = cartItem?.quantidade ?? 0;
  const note = cartItem?.observacao ?? "";

  return (
    <div className="flex gap-4 bg-white border border-zinc-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="w-24 h-24 shrink-0 rounded-xl bg-zinc-100 overflow-hidden">
        {produto.imagemUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={produto.imagemUrl} alt={produto.nome} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-300 text-3xl select-none">🍰</div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div>
          <h3 className="font-semibold text-zinc-900 text-sm leading-tight">{produto.nome}</h3>
          <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed line-clamp-2">{produto.descricao}</p>
        </div>

        <input
          type="text"
          placeholder="adicione uma observação..."
          value={note}
          onChange={(e) => onObservacaoChange(produto, e.target.value)}
          className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-1.5 text-zinc-700 placeholder:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-zinc-50 transition"
        />

        <div className="flex items-center justify-between mt-auto">
          <span className="font-bold text-zinc-900 text-sm">{formatPrice(produto.preco)}</span>

          <div className="flex items-center gap-2">
            {qty > 0 ? (
              <>
                <button onClick={() => onRemove(produto)} className="w-7 h-7 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 text-base font-medium transition">−</button>
                <span className="w-5 text-center text-sm font-semibold text-zinc-800">{qty}</span>
                <button onClick={() => onAdd(produto)} className="h-7 px-3 rounded-full bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 transition flex items-center gap-1">+ <span className="hidden sm:inline">carrinho</span></button>
              </>
            ) : (
              <button onClick={() => onAdd(produto)} className="h-7 px-3 rounded-full bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 transition">+ carrinho</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Cardapio() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Array<{ id: number; idCategoriaPai: number | null; nome: string }>>([]);
  const [categoriasMap, setCategoriasMap] = useState<Record<number, string>>({});
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'todos' | null>('todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) {
        setCart(JSON.parse(raw) as CartItem[]);
      }
    } catch {
      setCart([]);
    }
  }, []);

  useEffect(() => {
    const abort = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [catsRes, prodsRes] = await Promise.all([
          fetch(`${API_BASE}/categorias`, { signal: abort.signal }),
          fetch(`${API_BASE}/produtos`, { signal: abort.signal }),
        ]);

        if (!catsRes.ok) throw new Error(`Falha ao obter categorias: ${catsRes.status}`);
        if (!prodsRes.ok) throw new Error(`Falha ao obter produtos: ${prodsRes.status}`);

        const cats = await catsRes.json();
        const prods = await prodsRes.json();

        const normalizedCats = (cats as any[]).map((c) => ({
          id: c.id ?? c.Id,
          idCategoriaPai: c.idCategoriaPai ?? c.IdCategoriaPai ?? null,
          nome: (c.nome ?? c.Nome ?? "").toString(),
        }));

        const map: Record<number, string> = {};
        normalizedCats.forEach((c) => (map[c.id] = c.nome));

        const mapped: Produto[] = (prods as any[]).map((p: ProdutoAPI) => ({
          id: p.id,
          nome: p.nome,
          descricao: p.descricao ?? "",
          preco: Number(p.preco ?? 0),
          imagemUrl: p.imagemUrl ?? null,
          idCategoria: p.idCategoria ?? p.idCategoria,
          categoria: map[p.idCategoria ?? p.idCategoria] ? map[p.idCategoria ?? p.idCategoria].toLowerCase() : "outro",
        }));

        setCategorias(normalizedCats);
        setCategoriasMap(map);
        setProdutos(mapped);
      } catch (err: any) {
        if (err.name !== 'AbortError') setError(err.message ?? String(err));
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => abort.abort();
  }, []);

  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
  }, [cart]);

  const handleAdd = (produto: Produto) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === produto.id);
      if (existing) return prev.map((i) => i.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      return [...prev, { ...produto, quantidade: 1, observacao: "" } as CartItem];
    });
  };

  const handleRemove = (produto: Produto) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === produto.id);
      if (!existing) return prev;
      if (existing.quantidade === 1) return prev.filter((i) => i.id !== produto.id);
      return prev.map((i) => i.id === produto.id ? { ...i, quantidade: i.quantidade - 1 } : i);
    });
  };

  const handleObservacaoChange = (produto: Produto, observacao: string) => {
    setCart((prev) => prev.map((i) => i.id === produto.id ? { ...i, observacao } : i));
  };

  const total = cart.reduce((sum, i) => sum + i.preco * i.quantidade, 0);

  const visibleProducts = produtos.filter((p) => {
    if (selectedCategoryId === 'todos' || selectedCategoryId === null) return true;
    return (p.idCategoria ?? -1) === selectedCategoryId;
  });

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-zinc-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 pt-5 pb-3 flex flex-col items-center gap-3">
          <img src="/logo-doce-hub.png" alt="Doce Hub" className="h-12 w-auto object-contain" />

          <div className="flex gap-2 flex-wrap justify-center">
            <button onClick={() => { setSelectedCategoryId('todos'); setSelectedParentId(null); }} className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${selectedCategoryId === 'todos' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'}`}>Todos</button>
            {categorias.filter(c => c.idCategoriaPai === null).map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategoryId(cat.id); setSelectedParentId(cat.id); }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${selectedCategoryId === cat.id ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'}`}
              >
                {cat.nome}
              </button>
            ))}
          </div>
          {selectedParentId !== null && (
            <div className="max-w-lg mx-auto px-4 pb-3 flex gap-2 flex-wrap justify-center">
              {categorias.filter(c => c.idCategoriaPai === selectedParentId).map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedCategoryId(sub.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 ${selectedCategoryId === sub.id ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'}`}
                >
                  {sub.nome}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 pb-32">
        {loading && <p className="text-center text-zinc-500">Carregando produtos...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        <div className="flex flex-col gap-3">
          {visibleProducts.length > 0 ? (
            visibleProducts.map((produto) => (
              <ProdutoCard
                key={produto.id}
                produto={produto}
                cartItem={cart.find((i) => i.id === produto.id)}
                onAdd={handleAdd}
                onRemove={handleRemove}
                onObservacaoChange={handleObservacaoChange}
              />
            ))
          ) : (
            <p className="text-zinc-300 text-sm text-center py-16">Nenhum item disponível.</p>
          )}
        </div>
      </main>

      {total > 0 && (
        <footer className="fixed bottom-0 inset-x-0 z-30">
          <div className="max-w-lg mx-auto px-4 pb-6">
            <div className="flex items-center justify-between bg-zinc-900 text-white rounded-2xl px-5 py-4 shadow-xl">
              <div>
                <p className="text-xs text-zinc-400 font-medium">total</p>
                <p className="text-lg font-bold tracking-tight">{formatPrice(total)}</p>
              </div>
              <a href="/carrinho" className="bg-amber-400 hover:bg-amber-300 text-zinc-900 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors duration-150">IR PARA O CARRINHO</a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
