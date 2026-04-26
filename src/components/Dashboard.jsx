import { useState, useEffect } from 'react';
import { db } from '../db/database';
import Layout from './Layout';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalExpenses: 0,
    totalIncome: 0,
    pendingDebt: 0,
    recentTransactions: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const accounts = await db.accounts.toArray();
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    const transactions = await db.transactions.orderBy('date').reverse().limit(20).toArray();

    const expenses = transactions.filter(t => t.type === 'expense' && t.status === 'paid');
    const income = transactions.filter(t => t.type === 'income' && t.status === 'paid');

    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

    const pendingCredits = await db.transactions
      .where('status')
      .equals('pending')
      .toArray();
    const pendingDebt = pendingCredits.reduce((sum, t) => sum + t.amount, 0);

    setStats({
      totalBalance,
      totalExpenses,
      totalIncome,
      pendingDebt,
      recentTransactions: transactions.slice(0, 10)
    });
  };

  const getTransactionIcon = (type) => {
    const icons = { expense: '🔴', income: '🟢', transfer: '🔄', credit: '💳' };
    return icons[type] || '📝';
  };

  return (
    <Layout title="Dashboard">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">Total Balance</div>
          <div className="text-2xl font-bold text-blue-600">${stats.totalBalance.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">Expenses</div>
          <div className="text-2xl font-bold text-red-600">${stats.totalExpenses.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">Income</div>
          <div className="text-2xl font-bold text-green-600">${stats.totalIncome.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">Pending Debt</div>
          <div className="text-2xl font-bold text-orange-600">${stats.pendingDebt.toFixed(2)}</div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">Recent Transactions</h2>
        </div>
        <div className="divide-y">
          {stats.recentTransactions.map((t) => (
            <div key={t.id} className="p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getTransactionIcon(t.type)}</span>
                <div>
                  <div className="font-medium">{t.title || t.type}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(t.date).toLocaleDateString()}
                    {t.person && ` • ${t.person}`}
                  </div>
                </div>
              </div>
              <div className={`font-semibold ${t.type === 'expense' ? 'text-red-600' :
                  t.type === 'income' ? 'text-green-600' : 'text-blue-600'
                }`}>
                {t.type === 'expense' ? '-' : '+'}${t.amount.toFixed(2)}
              </div>
            </div>
          ))}
          {stats.recentTransactions.length === 0 && (
            <div className="p-8 text-center text-gray-500">No transactions yet</div>
          )}
        </div>
      </div>
    </Layout>
  );
}