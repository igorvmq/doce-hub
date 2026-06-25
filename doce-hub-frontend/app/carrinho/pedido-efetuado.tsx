"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";
const CART_KEY = "docehub_cart";

interface PedidoItem {
  id: number;
  quantidade: number;
  precoUnitario: number;
  subtotalItem: number;
  observacao?: string;
  produto?: {
    nome: string;
  };
}

interface PedidoDetalhes {
  id: number;
  numeroPedido: string;
  criadoEm: string;
  entregarEm?: string | null;
  retiradaLocal: boolean;
  status: string;
  nomeCliente: string;
  endereco?: string | null;
  email?: string | null;
  telefoneWhatsapp?: string | null;
  valorTotal: number;
  itens: PedidoItem[];
}

function ItemRow({ item }: { item: PedidoItem }) {
  return (
    <div className="flex items-center gap-3 bg-white border border-zinc-100 rounded-2xl px-5 py-3.5 shadow-sm">
      <span className="text-xs font-semibold text-zinc-400 w-6 shrink-0">{item.quantidade}x</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-800 truncate">{item.produto?.nome ?? "Item"}</p>
        {item.observacao && <p className="text-xs text-zinc-500 mt-1">Obs: {item.observacao}</p>}
      </div>
      <span className="text-sm font-bold text-zinc-900">
        {`R$${item.subtotalItem.toFixed(2).replace(".", ",")}`}
      </span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-1 justify-center text-center">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm font-bold text-zinc-900">{value}</span>
    </div>
  );
}

export default function OrderConfirmedPage() {
  const searchParams = useSearchParams();
  const pedidoId = searchParams.get("pedidoId");
  const status = searchParams.get("status") ?? "approved";

  const [pedido, setPedido] = useState<PedidoDetalhes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pedidoId) {
      setError("Nenhum pedido informado.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/pedidos/${pedidoId}`);
        if (!response.ok) {
          throw new Error("Pedido não encontrado.");
        }
        const data = await response.json();
        setPedido(data as PedidoDetalhes);
      } catch (err: any) {
        setError(err?.message ?? "Erro ao carregar pedido.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [pedidoId]);

  useEffect(() => {
    if (typeof window !== "undefined" && pedidoId && status === "approved") {
      localStorage.removeItem(CART_KEY);
    }
  }, [pedidoId, status]);

  const formatMoney = (value: number) => `R$${value.toFixed(2).replace(".", ",")}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans flex items-center justify-center">
        <p className="text-zinc-500">Carregando confirmação do pedido...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans flex flex-col items-center justify-center px-4 text-center gap-4">
        <p className="text-red-500 font-semibold">{error}</p>
        <a href="/cardapio" className="px-4 py-3 rounded-xl bg-amber-400 text-zinc-900 font-bold">Voltar ao cardápio</a>
      </div>
    );
  }

  if (!pedido) {
    return null;
  }

  const createdAt = new Date(pedido.criadoEm).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
  const deliveryAt = pedido.entregarEm
    ? new Date(pedido.entregarEm).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "Sem data definida";

  const addressText = pedido.retiradaLocal
    ? "Retirada no local"
    : pedido.endereco ?? "Endereço não disponível";

  const statusText =
    status === "approved"
      ? "Pagamento aprovado"
      : status === "pending"
      ? "Pagamento pendente"
      : "Pagamento não aprovado";

  return (
    <div className="min-h-screen bg-zinc-50 font-sans flex flex-col">
      <header className="bg-white border-b border-zinc-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-5 flex justify-center">
          <span className="text-2xl font-black tracking-tight text-zinc-900 uppercase">Doce Hub</span>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-8 pb-32 flex flex-col gap-5">
        <h1 className="text-xl font-black text-zinc-900 uppercase tracking-tight text-center">
          Pedido Realizado!
        </h1>

        <div className="bg-white border border-zinc-100 rounded-2xl px-6 py-5 shadow-sm flex flex-col gap-2.5">
          <InfoRow label="Número do pedido:" value={`#${pedido.numeroPedido}`} />
          <InfoRow label="Status do pagamento:" value={statusText} />
          <div className="h-px bg-zinc-50" />
          <InfoRow label="Pedido realizado em:" value={createdAt} />
          <InfoRow label="Entrega prevista:" value={deliveryAt} />
          <InfoRow label="Forma de retirada:" value={addressText} />
          <InfoRow label="Cliente:" value={pedido.nomeCliente} />
          <InfoRow label="Contato:" value={pedido.telefoneWhatsapp ?? pedido.email ?? "-"} />
          <div className="h-px bg-zinc-100 my-0.5" />
          <InfoRow label="Valor pago:" value={formatMoney(pedido.valorTotal)} />
        </div>

        <div className="flex flex-col gap-2">
          {pedido.itens.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </div>
      </main>

      <footer className="fixed bottom-0 inset-x-0 z-30">
        <a
          href="/cardapio"
          className="block w-full bg-amber-400 hover:bg-amber-300 transition-colors duration-150 py-5 text-center"
        >
          <span className="text-sm font-black tracking-widest text-zinc-900 uppercase">
            Fazer Novo Pedido
          </span>
        </a>
      </footer>
    </div>
  );
}
