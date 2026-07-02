"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";
const CART_KEY = "docehub_cart";
const FRETE = 12;

interface CartItem {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  quantidade: number;
  observacao?: string;
}

interface CustomerData {
  nome: string;
  email: string;
  whatsapp: string;
}

interface EntregaData {
  retiradaNoLocal: boolean;
  rua: string;
  numero: string;
  bairro: string;
  complemento: string;
}

function formatMoney(value: number) {
  return `R$${value.toFixed(2).replace(".", ",")}`;
}

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveCart(cart: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    // ignore
  }
}

function CartItemRow({
  item,
  onAdd,
  onRemove,
  onDelete,
}: {
  item: CartItem;
  onAdd: (id: number) => void;
  onRemove: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-zinc-100 last:border-0">
      <div className="w-16 h-16 shrink-0 rounded-xl bg-zinc-100 flex items-center justify-center text-2xl select-none">
        🍰
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-900 truncate">{item.nome}</p>
        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
          {item.observacao ? `Obs: ${item.observacao}` : item.descricao}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onRemove(item.id)}
          className="w-6 h-6 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 text-sm transition"
        >
          −
        </button>
        <span className="w-5 text-center text-sm font-semibold text-zinc-800">{item.quantidade}</span>
        <button
          onClick={() => onAdd(item.id)}
          className="w-6 h-6 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 text-sm transition"
        >
          +
        </button>

        <span className="w-14 text-right text-sm font-bold text-zinc-900">
          {formatMoney(item.preco * item.quantidade)}
        </span>

        <button
          onClick={() => onDelete(item.id)}
          className="ml-1 text-zinc-300 hover:text-red-400 transition"
          aria-label="Remover item"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  className = "",
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-zinc-50 transition"
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-3">{title}</h2>
      <div className="bg-white border border-zinc-100 rounded-2xl p-4 shadow-sm">{children}</div>
    </section>
  );
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [customer, setCustomer] = useState<CustomerData>({ nome: "", email: "", whatsapp: "" });
  const [entrega, setEntrega] = useState<EntregaData>({
    retiradaNoLocal: false,
    rua: "",
    numero: "",
    bairro: "",
    complemento: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCart(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveCart(cart);
  }, [cart, hydrated]);

  const subtotal = cart.reduce((sum, item) => sum + item.preco * item.quantidade, 0);
  const frete = entrega.retiradaNoLocal ? 0 : FRETE;
  const total = subtotal + frete;

  const handleAdd = (id: number) =>
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, quantidade: item.quantidade + 1 } : item)));

  const handleRemove = (id: number) =>
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantidade: Math.max(1, item.quantidade - 1) } : item))
    );

  const handleDelete = (id: number) =>
    setCart((prev) => prev.filter((item) => item.id !== id));

  const setEntregaField = (field: keyof EntregaData) => (value: string) =>
    setEntrega((prev) => ({ ...prev, [field]: value }));

  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidPhone(phone: string) {
    const digits = phone.replace(/\D/g, "");
    return digits.length === 10 || digits.length === 11;
  }

  const validate = () => {
    if (cart.length === 0) return "Seu carrinho está vazio.";
    if (!customer.nome.trim()) return "Informe seu nome.";
    if (!customer.email.trim() || !isValidEmail(customer.email)) return "Informe um email válido.";
    if (!customer.whatsapp.trim() || !isValidPhone(customer.whatsapp)) return "Informe um WhatsApp válido.";
    if (!entrega.retiradaNoLocal) {
      if (!entrega.rua.trim() || !entrega.numero.trim() || !entrega.bairro.trim()) {
        return "Preencha o endereço de entrega completo.";
      }
    }
    return null;
  };

  const handleCheckout = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const body = {
        idUsuario: 0,
        nomeCliente: customer.nome.trim(),
        email: customer.email.trim(),
        telefoneWhatsapp: customer.whatsapp.trim(),
        retiradaLocal: entrega.retiradaNoLocal,
        endereco: entrega.retiradaNoLocal
          ? null
          : `${entrega.rua.trim()}, ${entrega.numero.trim()}, ${entrega.bairro.trim()}${entrega.complemento ? ` - ${entrega.complemento.trim()}` : ""}`,
        itens: cart.map((item) => ({
          idProduto: item.id,
          quantidade: item.quantidade,
          observacao: item.observacao ?? "",
        })),
        successUrlBase: `${window.location.origin}/carrinho/pedido-efetuado`,
        failureUrlBase: `${window.location.origin}/carrinho/pedido-efetuado?status=failed`,
        pendingUrlBase: `${window.location.origin}/carrinho/pedido-efetuado?status=pending`,
      };

      const response = await fetch(`${API_BASE}/checkout/mercadopago`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.Error || data?.error || "Falha ao iniciar o checkout.");
      }

      if (!data.checkoutUrl) {
        throw new Error("URL de pagamento não retornada.");
      }

      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      setError(err?.message ?? "Erro ao iniciar o pagamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <header className="bg-white border-b border-zinc-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-5 flex justify-center">
          <img src="/logo-doce-hub.png" alt="Doce Hub" className="h-12 w-auto object-contain" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 pb-36 flex flex-col gap-6">
        <Section title="Carrinho">
          {!hydrated ? (
            <p className="text-zinc-400 text-sm text-center py-8">Carregando carrinho...</p>
          ) : cart.length > 0 ? (
            cart.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onAdd={handleAdd}
                onRemove={handleRemove}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <p className="text-zinc-300 text-sm text-center py-8">Seu carrinho está vazio.</p>
          )}
        </Section>

        <Section title="Seus Dados">
          <div className="flex flex-col gap-3">
            <Field label="Nome" value={customer.nome} onChange={(v) => setCustomer((p) => ({ ...p, nome: v }))} placeholder="Seu nome completo" />
            <Field label="Email" type="email" value={customer.email} onChange={(v) => setCustomer((p) => ({ ...p, email: v }))} placeholder="seu@email.com" />
            <Field label="WhatsApp" type="tel" value={customer.whatsapp} onChange={(v) => setCustomer((p) => ({ ...p, whatsapp: v }))} placeholder="(51) 99999-9999" />
          </div>
        </Section>

        <Section title="Informações de Entrega">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-700">Retirada no local</span>
              <button
                onClick={() => setEntrega((p) => ({ ...p, retiradaNoLocal: !p.retiradaNoLocal }))}
                className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${entrega.retiradaNoLocal ? "bg-zinc-900" : "bg-zinc-200"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${entrega.retiradaNoLocal ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
            </div>

            {!entrega.retiradaNoLocal && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Rua" value={entrega.rua} onChange={setEntregaField("rua")} placeholder="Nome da rua" className="col-span-2 sm:col-span-1" />
                  <Field label="Nº" value={entrega.numero} onChange={setEntregaField("numero")} placeholder="123" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Bairro" value={entrega.bairro} onChange={setEntregaField("bairro")} placeholder="Seu bairro" />
                  <Field label="Complemento" value={entrega.complemento} onChange={setEntregaField("complemento")} placeholder="Apto, bloco..." />
                </div>
              </div>
            )}
          </div>
        </Section>

        <div className="bg-white border border-zinc-100 rounded-2xl px-5 py-4 shadow-sm flex items-center justify-between">
          <span className="text-sm text-zinc-500">{entrega.retiradaNoLocal ? "Grátis" : "Frete"}</span>
          <span className="text-sm font-bold text-zinc-900">{formatMoney(frete)}</span>
        </div>

        <div className="bg-white border border-zinc-100 rounded-2xl px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between text-sm text-zinc-500 mb-3">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm font-bold text-zinc-900">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      </main>

      <footer className="fixed bottom-0 inset-x-0 z-30">
        <div className="max-w-lg mx-auto px-4 pb-6">
          <div className="flex items-center justify-between bg-zinc-900 text-white rounded-2xl px-5 py-4 shadow-xl gap-3">
            <div className="shrink-0">
              <p className="text-xs text-zinc-400 font-medium">Total</p>
              <p className="text-lg font-bold tracking-tight">{formatMoney(total)}</p>
            </div>
            <div className="flex gap-2 ml-auto">
              <a
                href="/cardapio"
                className="px-4 py-2.5 rounded-xl border border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition text-center leading-tight"
              >
                CONTINUAR<br />COMPRANDO
              </a>
              <button
                onClick={handleCheckout}
                disabled={loading || cart.length === 0}
                className="bg-amber-400 hover:bg-amber-300 disabled:opacity-60 disabled:cursor-not-allowed text-zinc-900 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors duration-150 text-center leading-tight"
              >
                FINALIZAR<br />
                <span className="font-normal text-zinc-700">(Mercado Pago)</span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
