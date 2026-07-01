'use client';

import { useEffect, useState } from 'react';

//const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000';
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://docehubapi.runasp.net/';


console.log('API Base URL:', apiBaseUrl);
export default function Home() {
  const [status, setStatus] = useState('Aguardando teste...');
  const [data, setData] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${apiBaseUrl}/`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((payload) => {
        setStatus('API conectada com sucesso');
        setData(JSON.stringify(payload, null, 2));
      })
      .catch((error) => {
        setStatus('Falha ao conectar com a API');
        setData(error.message);
      });
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
        <h1 className="text-3xl font-bold text-emerald-300">Doce Hub Frontend</h1>
        <p className="mt-4 text-slate-300">Teste simples de comunicação com a API.</p>

        <div className="mt-8 space-y-4">
          <div className="rounded-2xl bg-slate-800 p-6 shadow-inner shadow-slate-950/20">
            <h2 className="text-xl font-semibold text-white">Status da conexão.</h2>
            <p className="mt-2 text-slate-300">{status}</p>
          </div>

          <div className="rounded-2xl bg-slate-800 p-6 shadow-inner shadow-slate-950/20">
            <h2 className="text-xl font-semibold text-white">Resposta da API</h2>
            <pre className="mt-4 max-h-72 overflow-auto rounded-2xl bg-slate-950 p-4 text-sm text-emerald-200">
              {data ?? 'Aguardando resposta...'}
            </pre>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 p-5 text-slate-400">
          <p>API base configurada em:</p>
          <code className="block break-all text-sm text-slate-200">{apiBaseUrl}</code>
        </div>
      </div>
    </main>
  );
}
