// src/components/Dashboard.jsx

import { useState, useEffect } from 'react';
import { db } from '../db/database';

import { TfiWallet } from "react-icons/tfi";
import { MdOutlinePendingActions } from 'react-icons/md';
import {
  FiTrendingDown,
  FiTrendingUp,
  FiAlertCircle,
  FiArrowDown,
  FiArrowUp,
  FiRepeat,
  FiCreditCard,
  FiClock
} from 'react-icons/fi';

import { formatCurrency } from '../utils/currency';

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

    const transactions = await db.transactions
      .orderBy('timestamp')
      .reverse()
      .limit(20)
      .toArray();

    const paid = transactions.filter(t => t.status === 'paid');

    const totalExpenses = paid
      .filter(t => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);

    const totalIncome = paid
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);

    const pendingDebt = (await db.transactions
      .where('status')
      .equals('pending')
      .toArray())
      .reduce((s, t) => s + t.amount, 0);

    setStats({
      totalBalance,
      totalExpenses,
      totalIncome,
      pendingDebt,
      recentTransactions: transactions.slice(0, 10)
    });
  };

  const formatDateTime = (date, time) => {
    const d = new Date(date);
    return time
      ? `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${time}`
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTransactionIcon = (type) => {
    const map = {
      expense: <FiArrowDown className="text-red-500" size={18} />,
      income: <FiArrowUp className="text-emerald-500" size={18} />,
      transfer: <FiRepeat className="text-blue-500" size={18} />,
      credit: <FiCreditCard className="text-violet-500" size={18} />
    };
    return map[type] || <FiCreditCard className="text-gray-400" size={18} />;
  };

  const getTransactionColor = (type) => {
    const map = {
      expense: 'text-red-600',
      income: 'text-emerald-600',
      transfer: 'text-blue-600',
      credit: 'text-violet-600'
    };
    return map[type] || 'text-gray-600';
  };

  const Card = ({ children, className = "" }) => (
    <div className={`rounded-2xl shadow-sm border border-gray-100 bg-white ${className}`}>
      {children}
    </div>
  );

  return (
    <div className="space-y-5">

      {/* TOP GRID */}
      <div className="grid grid-cols-2 gap-4">

        <div className="rounded-2xl p-4 text-white bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md">
          <div className="flex justify-between items-center">
            <TfiWallet size={20} className="opacity-80" />
            <span className="text-xs opacity-70">Balance</span>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight">
            {formatCurrency(stats.totalBalance)}
          </div>
          <div className="text-xs opacity-70 mt-1">All accounts combined</div>
        </div>

        <div className="rounded-2xl p-4 text-white bg-gradient-to-br from-orange-500 to-amber-500 shadow-md">
          <div className="flex justify-between items-center">
            <MdOutlinePendingActions size={20} className="opacity-80" />
            <span className="text-xs opacity-70">Pending</span>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight">
            {formatCurrency(stats.pendingDebt)}
          </div>
          <div className="text-xs opacity-70 mt-1">Outstanding amount</div>
        </div>

        <Card className="p-4">
          <div className="flex justify-between items-center">
            <FiTrendingDown className="text-red-500" />
            <span className="text-xs text-gray-400">Expenses</span>
          </div>
          <div className="mt-3 text-lg font-semibold text-red-600">
            {formatCurrency(stats.totalExpenses)}
          </div>
          <div className="text-xs text-gray-400">Total spent</div>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center">
            <FiTrendingUp className="text-emerald-500" />
            <span className="text-xs text-gray-400">Income</span>
          </div>
          <div className="mt-3 text-lg font-semibold text-emerald-600">
            {formatCurrency(stats.totalIncome)}
          </div>
          <div className="text-xs text-gray-400">Total earned</div>
        </Card>

      </div>

      {/* SAVINGS */}
      {stats.totalIncome > 0 && (
        <Card className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-emerald-700 font-medium">
                Savings Rate
              </div>
              <div className="text-2xl font-bold text-emerald-800">
                {(((stats.totalIncome - stats.totalExpenses) / stats.totalIncome) * 100).toFixed(1)}%
              </div>
            </div>

            <div className="p-3 rounded-full bg-emerald-100">
              <TfiWallet className="text-emerald-700" size={22} />
            </div>
          </div>

          <div className="text-xs text-emerald-600 mt-2">
            Saved {formatCurrency(stats.totalIncome - stats.totalExpenses)} so far
          </div>
        </Card>
      )}

      {/* TRANSACTIONS */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between">
          <h2 className="font-semibold text-gray-800">Recent Activity</h2>
          <span className="text-xs text-gray-400">Latest 10</span>
        </div>

        <div className="divide-y divide-gray-50">
          {stats.recentTransactions.map(t => (
            <div key={t.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition">

              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-gray-50">
                  {getTransactionIcon(t.type)}
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {t.title || t.type}
                  </div>

                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <FiClock size={10} />
                    {formatDateTime(t.date, t.time)}
                  </div>
                </div>
              </div>

              <div className={`font-semibold text-sm ${getTransactionColor(t.type)}`}>
                {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}
                {formatCurrency(t.amount)}
              </div>

            </div>
          ))}

          {stats.recentTransactions.length === 0 && (
            <div className="py-14 text-center">
              <FiAlertCircle className="mx-auto text-gray-300" size={28} />
              <div className="mt-2 text-gray-500 font-medium">
                No transactions found
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Start by adding your first entry
              </div>
            </div>
          )}
        </div>
      </Card>

    </div>
  );
}