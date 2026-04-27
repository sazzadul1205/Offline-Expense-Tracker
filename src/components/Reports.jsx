// src/components/Reports.jsx

// React
import { useState, useEffect } from 'react';

// Database
import { db } from '../db/database';

// Utils
import { formatCurrency } from '../utils/currency';

// Icons
import { MdShowChart, MdInsights } from 'react-icons/md';
import { FiCalendar, FiTrendingDown, FiTrendingUp, FiPieChart, FiBarChart2, FiAlertCircle, FiCheckCircle, FiDollarSign, FiArrowUp, FiArrowDown, FiActivity } from 'react-icons/fi';

export default function Reports() {

  // Reports
  const [period, setPeriod] = useState('month');
  const [isLoading, setIsLoading] = useState(true);

  // Report data
  const [reportData, setReportData] = useState({
    totalExpenses: 0,
    totalIncome: 0,
    netCashflow: 0,
    savingsRate: 0,
    expenseRatio: 0,
    categoryBreakdown: [],
    topCategory: null
  });

  // Load reports
  useEffect(() => {
    loadReports();
  }, [period]);

  // Get date range
  const getDateRange = () => {
    const now = new Date();
    const start = new Date();

    if (period === 'week') {
      start.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      start.setMonth(now.getMonth() - 1);
    } else if (period === 'year') {
      start.setFullYear(now.getFullYear() - 1);
    }

    return { start: start.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
  };

  // Load reports
  const loadReports = async () => {
    setIsLoading(true);
    try {
      const { start, end } = getDateRange();

      const transactions = await db.transactions
        .where('date')
        .between(start, end)
        .and(t => t.status === 'paid')
        .toArray();

      const paidTransactions = transactions.filter(t => t.status === 'paid');
      const expenses = paidTransactions.filter(t => t.type === 'expense');
      const income = paidTransactions.filter(t => t.type === 'income');

      const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
      const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
      const netCashflow = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? (netCashflow / totalIncome) * 100 : 0;
      const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

      // Category breakdown
      const categoryMap = {};
      for (const exp of expenses) {
        if (exp.categoryId) {
          try {
            const category = await db.categories.get(exp.categoryId);
            const catName = category?.name || 'Uncategorized';
            categoryMap[catName] = (categoryMap[catName] || 0) + exp.amount;
          } catch (err) {
            console.error('Error fetching category:', err);
            categoryMap['Uncategorized'] = (categoryMap['Uncategorized'] || 0) + exp.amount;
          }
        } else {
          categoryMap['Uncategorized'] = (categoryMap['Uncategorized'] || 0) + exp.amount;
        }
      }

      const categoryBreakdown = Object.entries(categoryMap)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount);

      const topCategory = categoryBreakdown[0] || null;

      setReportData({
        totalExpenses,
        totalIncome,
        netCashflow,
        savingsRate,
        expenseRatio,
        categoryBreakdown,
        topCategory
      });
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get period label
  const getPeriodLabel = () => {
    const labels = { week: 'Last 7 Days', month: 'Last 30 Days', year: 'Last 12 Months' };
    return labels[period];
  };

  // Period options
  const periodOptions = [
    { id: 'week', label: 'Week', icon: FiCalendar },
    { id: 'month', label: 'Month', icon: FiBarChart2 },
    { id: 'year', label: 'Year', icon: MdShowChart }
  ];

  return (
    <div className="space-y-4 pb-4">
      {/* Period Selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5">
        <div className="flex gap-1">
          {periodOptions.map(option => {
            const Icon = option.icon;
            const isActive = period === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setPeriod(option.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all duration-200 ${isActive
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-red-100 p-2 rounded-xl">
              <FiTrendingDown className="text-red-600" size={18} />
            </div>
            <span className="text-xs text-gray-400">{getPeriodLabel()}</span>
          </div>
          <div className="text-gray-600 text-xs mb-1">Total Expenses</div>
          <div className="text-xl font-bold text-red-600">{formatCurrency(reportData.totalExpenses)}</div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-green-100 p-2 rounded-xl">
              <FiTrendingUp className="text-green-600" size={18} />
            </div>
            <span className="text-xs text-gray-400">{getPeriodLabel()}</span>
          </div>
          <div className="text-gray-600 text-xs mb-1">Total Income</div>
          <div className="text-xl font-bold text-green-600">{formatCurrency(reportData.totalIncome)}</div>
        </div>
      </div>

      {/* Net Cashflow & Metrics */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className={`p-5 ${reportData.netCashflow >= 0
          ? 'bg-gradient-to-r from-emerald-500 to-green-600'
          : 'bg-gradient-to-r from-red-500 to-rose-600'
          } text-white`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FiActivity size={20} className="opacity-90" />
              <span className="text-sm font-medium opacity-90">Net Cashflow</span>
            </div>
            {reportData.netCashflow >= 0 ? (
              <FiArrowUp size={18} className="opacity-90" />
            ) : (
              <FiArrowDown size={18} className="opacity-90" />
            )}
          </div>
          <div className="text-3xl font-bold">
            {reportData.netCashflow >= 0 ? '+' : ''}{formatCurrency(Math.abs(reportData.netCashflow))}
          </div>
          <div className="text-xs mt-2 opacity-80">
            {reportData.netCashflow >= 0
              ? 'Positive cash flow - Great job!'
              : 'Negative cash flow - Review spending'}
          </div>
        </div>

        <div className="p-4 flex justify-around border-t border-gray-100">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Savings Rate</div>
            <div className="text-lg font-bold text-emerald-600">{reportData.savingsRate.toFixed(1)}%</div>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Expense Ratio</div>
            <div className="text-lg font-bold text-blue-600">{reportData.expenseRatio.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
          <div className="flex items-center gap-2">
            <div className="bg-purple-200 p-1.5 rounded-xl">
              <FiPieChart className="text-purple-700" size={18} />
            </div>
            <h2 className="font-semibold text-purple-800">Expense Breakdown</h2>
            <span className="ml-auto text-xs text-purple-600">{getPeriodLabel()}</span>
          </div>
          <p className="text-xs text-purple-600 mt-1 ml-1">Where your money goes</p>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : reportData.categoryBreakdown.length > 0 ? (
            <div className="space-y-4">
              {reportData.categoryBreakdown.map((cat, index) => {
                const percentage = (cat.amount / reportData.totalExpenses) * 100;
                let bgColor, fromColor, toColor;
                switch (index % 8) {
                  case 0:
                    bgColor = 'bg-blue-500';
                    fromColor = 'from-blue-500';
                    toColor = 'to-blue-600';
                    break;
                  case 1:
                    bgColor = 'bg-purple-500';
                    fromColor = 'from-purple-500';
                    toColor = 'to-purple-600';
                    break;
                  case 2:
                    bgColor = 'bg-pink-500';
                    fromColor = 'from-pink-500';
                    toColor = 'to-pink-600';
                    break;
                  case 3:
                    bgColor = 'bg-orange-500';
                    fromColor = 'from-orange-500';
                    toColor = 'to-orange-600';
                    break;
                  case 4:
                    bgColor = 'bg-green-500';
                    fromColor = 'from-green-500';
                    toColor = 'to-green-600';
                    break;
                  case 5:
                    bgColor = 'bg-teal-500';
                    fromColor = 'from-teal-500';
                    toColor = 'to-teal-600';
                    break;
                  case 6:
                    bgColor = 'bg-indigo-500';
                    fromColor = 'from-indigo-500';
                    toColor = 'to-indigo-600';
                    break;
                  default:
                    bgColor = 'bg-yellow-500';
                    fromColor = 'from-yellow-500';
                    toColor = 'to-yellow-600';
                }

                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${bgColor}`} />
                        <span className="text-gray-700 font-medium">{cat.name}</span>
                      </div>
                      <div className="text-gray-600">
                        {formatCurrency(cat.amount)} <span className="text-gray-400">({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`bg-gradient-to-r ${fromColor} ${toColor} rounded-full h-2 transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <FiPieChart className="text-gray-400" size={28} />
              </div>
              <div className="text-gray-500 font-medium">No expense data</div>
              <div className="text-sm text-gray-400 mt-1">Add expenses to see breakdown</div>
            </div>
          )}
        </div>
      </div>

      {/* Insights Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="bg-blue-200 rounded-full p-2">
            <MdInsights className="text-blue-700" size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              Financial Insights
              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                {getPeriodLabel()}
              </span>
            </h3>
            <div className="space-y-2 text-sm">
              {reportData.totalExpenses > reportData.totalIncome ? (
                <div className="flex items-start gap-2 text-amber-700">
                  <FiAlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <p>Your expenses exceed your income by {formatCurrency(reportData.totalExpenses - reportData.totalIncome)}. Consider reducing spending.</p>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-emerald-700">
                  <FiCheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <p>Great! Your income exceeds expenses by {formatCurrency(reportData.netCashflow)}.</p>
                </div>
              )}

              {reportData.topCategory && (
                <div className="flex items-start gap-2 text-blue-700">
                  <FiBarChart2 size={16} className="mt-0.5 flex-shrink-0" />
                  <p>Your highest expense category is "{reportData.topCategory.name}" at {formatCurrency(reportData.topCategory.amount)}.</p>
                </div>
              )}

              {reportData.savingsRate > 20 && (
                <div className="flex items-start gap-2 text-purple-700">
                  <FiDollarSign size={16} className="mt-0.5 flex-shrink-0" />
                  <p>Excellent savings rate of {reportData.savingsRate.toFixed(1)}%! Keep it up! 🎉</p>
                </div>
              )}

              {reportData.expenseRatio > 80 && reportData.totalIncome > 0 && (
                <div className="flex items-start gap-2 text-orange-700">
                  <FiAlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <p>High expense ratio ({reportData.expenseRatio.toFixed(1)}%). Try to save more.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tip Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 text-gray-600">
          <FiCalendar size={16} />
          <span className="text-xs text-gray-500">
            Reporting period: {getPeriodLabel()} • Updates in real-time
          </span>
        </div>
      </div>
    </div>
  );
}