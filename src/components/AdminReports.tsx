import { useState, useMemo } from 'react';
import { useOrders } from '../hooks/useOrders';
import { formatCurrency } from '../utils/formatCurrency';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function AdminReports() {
  const { orders } = useOrders();
  const [dateFilter, setDateFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  const completedOrders = orders.filter(order => order.status === 'Entregue');

  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      
      const dayTotal = completedOrders
        .filter(order => new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) === dateStr)
        .reduce((sum, order) => sum + order.total, 0);
        
      data.push({ name: dateStr, total: dayTotal });
    }
    return data;
  }, [completedOrders]);

  const reportData = useMemo(() => {
    let salesTotal = 0;
    let orderCount = completedOrders.length;
    let itemsSold = 0;

    const groupedData: Record<string, number> = {};

    completedOrders.forEach(order => {
      const date = new Date(order.createdAt);
      let key = '';
      
      if (dateFilter === 'daily') {
        key = date.toLocaleDateString();
      } else if (dateFilter === 'weekly') {
        const firstDay = new Date(date.setDate(date.getDate() - date.getDay())).toLocaleDateString();
        key = `Semana de ${firstDay}`;
      } else if (dateFilter === 'monthly') {
        key = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      }

      if (!groupedData[key]) {
        groupedData[key] = 0;
      }
      groupedData[key] += order.subtotal; // Use subtotal or total? Usually total for revenue
      salesTotal += order.total;
      
      order.items.forEach(item => {
        itemsSold += item.quantity;
      });
    });

    return {
      salesTotal,
      orderCount,
      itemsSold,
      groupedData
    };
  }, [completedOrders, dateFilter]);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-lg text-gray-900 tracking-tight uppercase">Dashboard de Vendas</h3>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setDateFilter('daily')} className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-colors ${dateFilter === 'daily' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Diário</button>
          <button onClick={() => setDateFilter('weekly')} className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-colors ${dateFilter === 'weekly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Semanal</button>
          <button onClick={() => setDateFilter('monthly')} className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-colors ${dateFilter === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Mensal</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-1">Faturamento Total</div>
          <div className="font-black text-2xl text-green-600">{formatCurrency(reportData.salesTotal)}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-1">Pedidos Concluídos</div>
          <div className="font-black text-2xl text-gray-900">{reportData.orderCount}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-1">Itens Vendidos</div>
          <div className="font-black text-2xl text-brand-red">{reportData.itemsSold}</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h4 className="font-bold text-sm uppercase tracking-widest text-gray-700 mb-4">Faturamento Últimos 7 Dias</h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <Line type="monotone" dataKey="total" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <CartesianGrid stroke="#f3f4f6" strokeDasharray="5 5" vertical={false} />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis 
                 stroke="#9ca3af" 
                 fontSize={12} 
                 tickLine={false} 
                 axisLine={false} 
                 tickFormatter={(value) => `R$${value}`}
              />
              <Tooltip 
                 formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h4 className="font-bold text-sm uppercase tracking-widest text-gray-700 mb-4">Vendas por {dateFilter === 'daily' ? 'Dia' : dateFilter === 'weekly' ? 'Semana' : 'Mês'}</h4>
        <div className="space-y-3">
          {Object.entries(reportData.groupedData).sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime()).map(([date, total]) => (
             <div key={date} className="flex items-center justify-between p-3 border-b border-gray-50 hover:bg-gray-50 rounded transition-colors">
               <span className="text-sm font-medium text-gray-800 capitalize">{date}</span>
               <span className="font-bold text-green-600 font-mono">{formatCurrency(total as number)}</span>
             </div>
          ))}
          {Object.keys(reportData.groupedData).length === 0 && (
             <div className="text-center text-sm text-gray-400 py-4">Nenhum dado encontrado para o período.</div>
          )}
        </div>
      </div>
    </div>
  );
}
