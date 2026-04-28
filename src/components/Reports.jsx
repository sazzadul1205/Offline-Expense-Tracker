// src/components/Reports.jsx

// React
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Database
import { db } from '../db/database';

// Utils
import { useDataRefresh } from '../utils/refresh';
import { formatCurrency } from '../utils/currency';

// Icons
import { MdShowChart, MdInsights } from 'react-icons/md';
import { FiCalendar, FiTrendingDown, FiTrendingUp, FiPieChart, FiBarChart2, FiAlertCircle, FiCheckCircle, FiDollarSign, FiArrowUp, FiArrowDown, FiActivity } from 'react-icons/fi';

export default function Reports() {
  const location = useLocation();

  // State
  const [period, setPeriod] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState({
    totalExpenses: 0,
    totalIncome: 0,
    netCashflow: 0,
    savingsRate: 0,
    expenseRatio: 0,
    categoryBreakdown: [],
    topCategory: null,
  });

  useEffect(() => {
    loadReports();
  }, [period]);

  // Refresh when period changes or when returning to page
  useEffect(() => {
    loadReports();
  }, [location.key]);

  // Listen for data changes from other operations
  useDataRefresh(() => {
    loadReports();
  });

  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    if (period === 'week') start.setDate(now.getDate() - 7);
    else if (period === 'month') start.setMonth(now.getMonth() - 1);
    else if (period === 'year') start.setFullYear(now.getFullYear() - 1);
    return { start: start.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
  };

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const { start, end } = getDateRange();
      const transactions = await db.transactions
        .where('date')
        .between(start, end)
        .and(t => t.status === 'paid')
        .toArray();

      const expenses = transactions.filter(t => t.type === 'expense');
      const income = transactions.filter(t => t.type === 'income');

      const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
      const totalIncome = income.reduce((s, t) => s + t.amount, 0);
      const netCashflow = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? (netCashflow / totalIncome) * 100 : 0;
      const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

      // Preload categories for efficiency
      const allCategories = await db.categories.toArray();
      const categoryMap = new Map(allCategories.map(c => [c.id, c.name]));

      const catBreak = {};
      for (const exp of expenses) {
        const catName = exp.categoryId ? categoryMap.get(exp.categoryId) || 'Uncategorized' : 'Uncategorized';
        catBreak[catName] = (catBreak[catName] || 0) + exp.amount;
      }

      const categoryBreakdown = Object.entries(catBreak)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount);

      const topCategory = categoryBreakdown[0] || null;

      setReportData({ totalExpenses, totalIncome, netCashflow, savingsRate, expenseRatio, categoryBreakdown, topCategory });
    } catch (error) {
      console.error('Reports error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const periodOptions = [
    { id: 'week', label: 'Week', icon: FiCalendar },
    { id: 'month', label: 'Month', icon: FiBarChart2 },
    { id: 'year', label: 'Year', icon: MdShowChart },
  ];

  return (
    <div className="space-y-4 pb-4">
      {/* Period selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5">
        <div className="flex gap-1">
          {periodOptions.map(option => {
            const Icon = option.icon;
            const isActive = period === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setPeriod(option.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary cards (same as before, just using reportData) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-red-100 p-2 rounded-xl"><FiTrendingDown className="text-red-600" size={18} /></div>
            <span className="text-xs text-gray-400">Last {period}</span>
          </div>
          <div className="text-gray-600 text-xs mb-1">Total Expenses</div>
          <div className="text-xl font-bold text-red-600">{formatCurrency(reportData.totalExpenses)}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-green-100 p-2 rounded-xl"><FiTrendingUp className="text-green-600" size={18} /></div>
            <span className="text-xs text-gray-400">Last {period}</span>
          </div>
          <div className="text-gray-600 text-xs mb-1">Total Income</div>
          <div className="text-xl font-bold text-green-600">{formatCurrency(reportData.totalIncome)}</div>
        </div>
      </div>

      {/* Net cashflow */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className={`p-5 ${reportData.netCashflow >= 0 ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-rose-600'} text-white`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><FiActivity size={20} /><span>Net Cashflow</span></div>
            {reportData.netCashflow >= 0 ? <FiArrowUp /> : <FiArrowDown />}
          </div>
          <div className="text-3xl font-bold">{reportData.netCashflow >= 0 ? '+' : ''}{formatCurrency(Math.abs(reportData.netCashflow))}</div>
          <div className="text-xs mt-2 opacity-80">{reportData.netCashflow >= 0 ? 'Positive cash flow - Great job!' : 'Negative cash flow - Review spending'}</div>
        </div>
        <div className="p-4 flex justify-around border-t border-gray-100">
          <div className="text-center"><div className="text-xs text-gray-500">Savings Rate</div><div className="text-lg font-bold text-emerald-600">{reportData.savingsRate.toFixed(1)}%</div></div>
          <div className="w-px bg-gray-200" />
          <div className="text-center"><div className="text-xs text-gray-500">Expense Ratio</div><div className="text-lg font-bold text-blue-600">{reportData.expenseRatio.toFixed(1)}%</div></div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
          <div className="flex items-center gap-2"><FiPieChart className="text-purple-700" /><h2 className="font-semibold text-purple-800">Expense Breakdown</h2></div>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : reportData.categoryBreakdown.length ? (
            <div className="space-y-4">
              {reportData.categoryBreakdown.map((cat, idx) => {
                const percent = (cat.amount / reportData.totalExpenses) * 100;
                const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-green-500', 'bg-teal-500', 'bg-indigo-500', 'bg-yellow-500'];
                const bg = colors[idx % colors.length];
                return (
                  <div key={cat.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{cat.name}</span><span>{formatCurrency(cat.amount)} ({percent.toFixed(1)}%)</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className={`${bg} rounded-full h-2`} style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No expense data for this period</div>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="bg-blue-200 rounded-full p-2"><MdInsights className="text-blue-700" size={20} /></div>
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">Financial Insights</h3>
            {reportData.totalExpenses > reportData.totalIncome ? (
              <p className="text-amber-700 text-sm">⚠️ Expenses exceed income by {formatCurrency(reportData.totalExpenses - reportData.totalIncome)}.</p>
            ) : (
              <p className="text-emerald-700 text-sm">✅ Great! You saved {formatCurrency(reportData.netCashflow)} this period.</p>
            )}
            {reportData.topCategory && <p className="text-blue-700 text-sm mt-2">🏷️ Top category: {reportData.topCategory.name} ({formatCurrency(reportData.topCategory.amount)})</p>}
          </div>
        </div>
      </div>
    </div>
  );
}