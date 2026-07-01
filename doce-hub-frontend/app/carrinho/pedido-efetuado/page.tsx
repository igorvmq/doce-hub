import { Suspense } from "react";
import OrderConfirmedPage from "../pedido-efetuado";

export default function PedidoEfetuadoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 font-sans flex items-center justify-center">Carregando confirmação...</div>}>
      <OrderConfirmedPage />
    </Suspense>
  );
}
