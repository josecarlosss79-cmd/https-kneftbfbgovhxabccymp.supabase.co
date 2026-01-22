
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ICONS } from '../constants';
import { useMaintenance } from '../context/MaintenanceContext';

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user'|'ai', content: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const { equipments, occurrences } = useMaintenance();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const contextStr = `
        Dados Atuais do Hospital:
        - Total Equipamentos: ${equipments.length}
        - Ocorrências Registradas: ${occurrences.length}
        - Equipamentos Recém Cadastrados: ${JSON.stringify(equipments.slice(0, 3).map(e => ({n: e.name, s: e.status})))}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${contextStr}\nPergunta do Usuário (Engenheiro Clínico): ${userMsg}`,
        config: {
          systemInstruction: 'Você é o MedAI, o assistente inteligente do sistema MedMaintain. Sua função é analisar dados de manutenção hospitalar, sugerir planos preventivos e ajudar técnicos com diagnósticos baseados nas normas ISO 13485 e RDC 509 da Anvisa. Seja conciso e profissional.'
        }
      });

      setMessages(prev => [...prev, { role: 'ai', content: response.text || 'Desculpe, tive um problema na análise.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Erro de conexão com o motor de IA.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 md:bottom-8 right-6 z-50">
      {isOpen ? (
        <div className="bg-white w-[90vw] md:w-96 h-[500px] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
          <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                {ICONS.Intelligence}
              </div>
              <span className="font-bold text-sm">MedAI Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-xl">&times;</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-10 space-y-2">
                <p className="text-xs text-slate-400 font-medium">Como posso ajudar na sua engenharia hoje?</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Qual o MTBF médio?', 'Prever falhas?', 'Resumo da RDC 509'].map(q => (
                    <button key={q} onClick={() => setInput(q)} className="text-[10px] px-3 py-1.5 bg-slate-100 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-all">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 shadow-sm'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-[10px] text-slate-400 animate-pulse italic">MedAI está analisando dados...</div>}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleAsk} className="p-3 border-t bg-slate-50 flex gap-2">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Pergunte ao MedAI..."
              className="flex-1 px-4 py-2 bg-white border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100">
              {ICONS.NextAction}
            </button>
          </form>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all group relative"
        >
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-[10px] flex items-center justify-center rounded-full font-bold border-2 border-white animate-bounce">
            IA
          </div>
          {ICONS.Intelligence}
        </button>
      )}
    </div>
  );
};

export default AIAssistant;
