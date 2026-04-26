// src/components/Dashboard.jsx

// React
import { useState, useEffect } from 'react';

// Database
import { db } from '../db/database';

// Icons
import { TfiWallet } from "react-icons/tfi";
import { MdOutlinePendingActions } from 'react-icons/md';
import { FiTrendingDown, FiTrendingUp, FiAlertCircle, FiArrowDown, FiArrowUp, FiRepeat, FiCreditCard, FiClock } from 'react-icons/fi';

// Utils
import { formatCurrency } from '../utils/currency';

export default function Dashboard() {

  // State
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalExpenses: 0,
    totalIncome: 0,
    pendingDebt: 0,
    recentTransactions: []
  });

  // Lifecycle
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load Dashboard Data
  const loadDashboardData = async () => {
    const accounts = await db.accounts.toArray();
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    const transactions = await db.transactions.orderBy('timestamp').reverse().limit(20).toArray();

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

  // Format date and time
  const formatDateTime = (date, time) => {
    if (time) {
      return `${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${time}`;
    }
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get Transaction Icon
  const getTransactionIcon = (type) => {
    const icons = {
      expense: <FiArrowDown className="text-red-500" size={20} />,
      income: <FiArrowUp className="text-green-500" size={20} />,
      transfer: <FiRepeat className="text-blue-500" size={20} />,
      credit: <FiCreditCard className="text-purple-500" size={20} />
    };
    return icons[type] || <FiCreditCard className="text-gray-500" size={20} />;
  };

  // Get Transaction Color
  const getTransactionColor = (type) => {
    const colors = {
      expense: 'text-red-600',
      income: 'text-green-600',
      transfer: 'text-blue-600',
      credit: 'text-purple-600'
    };
    return colors[type] || 'text-gray-600';
  };

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Balance Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TfiWallet size={20} className="opacity-80" />
            <span className="text-xs opacity-80">Balance</span>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalBalance)}</div>
          <div className="text-xs mt-1 opacity-75">Total across all accounts</div>
        </div>

        {/* Pending Debt Card */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <MdOutlinePendingActions size={20} className="opacity-80" />
            <span className="text-xs opacity-80">Pending</span>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(stats.pendingDebt)}</div>
          <div className="text-xs mt-1 opacity-75">Active debts</div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-red-100 p-2 rounded-xl">
              <FiTrendingDown className="text-red-600" size={18} />
            </div>
            <span className="text-xs text-gray-500">Expenses</span>
          </div>
          <div className="text-xl font-bold text-red-600">{formatCurrency(stats.totalExpenses)}</div>
          <div className="text-xs text-gray-400 mt-1">Total spent</div>
        </div>

        {/* Income Card */}
        <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-green-100 p-2 rounded-xl">
              <FiTrendingUp className="text-green-600" size={18} />
            </div>
            <span className="text-xs text-gray-500">Income</span>
          </div>
          <div className="text-xl font-bold text-green-600">{formatCurrency(stats.totalIncome)}</div>
          <div className="text-xs text-gray-400 mt-1">Total earned</div>
        </div>
      </div>

      {/* Savings Insight */}
      {stats.totalIncome > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-emerald-700 font-medium">Savings Rate</div>
              <div className="text-2xl font-bold text-emerald-800">
                {((stats.totalIncome - stats.totalExpenses) / stats.totalIncome * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-emerald-200 rounded-full p-3">
              <TfiWallet className="text-emerald-700" size={24} />
            </div>
          </div>
          <div className="text-xs text-emerald-600 mt-2">
            You've saved {formatCurrency(stats.totalIncome - stats.totalExpenses)} this period
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">Recent Transactions</h2>
          <span className="text-xs text-gray-400">Last 10</span>
        </div>
        <div className="divide-y divide-gray-50">
          {stats.recentTransactions.map((t) => (
            <div key={t.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-xl ${t.type === 'expense' ? 'bg-red-50' :
                    t.type === 'income' ? 'bg-green-50' :
                      t.type === 'transfer' ? 'bg-blue-50' : 'bg-purple-50'
                    }`}>
                    {getTransactionIcon(t.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate">
                      {t.title || t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <FiClock size={10} />
                      <span>{formatDateTime(t.date, t.time)}</span>
                      {t.person && (
                        <>
                          <span>•</span>
                          <span className="truncate">{t.person}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`font-semibold ${getTransactionColor(t.type)} ml-2`}>
                  {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}
                  {formatCurrency(t.amount)}
                </div>
              </div>
            </div>
          ))}
          {stats.recentTransactions.length === 0 && (
            <div className="px-5 py-12 text-center">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <FiAlertCircle className="text-gray-400" size={24} />
              </div>
              <div className="text-gray-500 font-medium">No transactions yet</div>
              <div className="text-sm text-gray-400 mt-1">Tap + to add your first transaction</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}