// src/components/DebtTracker.jsx

// React
import { useState, useEffect } from 'react';

// Database
import { db } from '../db/database';

// Icons
import { MdOutlinePendingActions, MdAccountBalance } from 'react-icons/md';
import { FiUsers, FiUserCheck, FiUserX, FiDollarSign, FiCheckCircle, FiAlertCircle, FiClock, FiTrendingUp, FiTrendingDown, FiSmile, FiFrown } from 'react-icons/fi';

export default function DebtTracker() {

  // State
  const [isSettling, setIsSettling] = useState(false);
  const [debts, setDebts] = useState({ oweMe: [], iOwe: [] });
  const [pendingTransactions, setPendingTransactions] = useState([]);

  // Effects
  useEffect(() => {
    loadDebts();
  }, []);

  // Load debts 
  const loadDebts = async () => {
    const pending = await db.transactions
      .where('status')
      .equals('pending')
      .toArray();

    setPendingTransactions(pending);

    const debtMap = {};
    pending.forEach(t => {
      if (!debtMap[t.person]) {
        debtMap[t.person] = { oweMe: 0, iOwe: 0, transactions: [] };
      }
      if (t.direction === 'owe_me') {
        debtMap[t.person].oweMe += t.amount;
      } else if (t.direction === 'i_owe') {
        debtMap[t.person].iOwe += t.amount;
      }
      debtMap[t.person].transactions.push(t);
    });

    const oweMe = [];
    const iOwe = [];

    Object.entries(debtMap).forEach(([person, amounts]) => {
      const net = amounts.oweMe - amounts.iOwe;
      if (net > 0) {
        oweMe.push({ person, amount: net, transactionCount: amounts.transactions.length });
      } else if (net < 0) {
        iOwe.push({ person, amount: Math.abs(net), transactionCount: amounts.transactions.length });
      }
    });

    setDebts({ oweMe, iOwe });
  };

  // Settle debt
  const settleDebt = async (person, amount, direction) => {
    setIsSettling(true);

    const relatedTx = pendingTransactions.find(t =>
      t.person === person &&
      ((direction === 'owe_me' && t.direction === 'owe_me') ||
        (direction === 'i_owe' && t.direction === 'i_owe'))
    );

    if (!relatedTx) {
      alert('No matching credit found');
      setIsSettling(false);
      return;
    }

    const accounts = await db.accounts.toArray();
    const defaultAccount = accounts[0]?.id;

    const settlement = {
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date().getTime(),
      type: 'debt_settlement',
      amount: amount,
      status: 'paid',
      person: person,
      direction: direction,
      settlesTransactionId: relatedTx.id,
      title: `Debt settlement for ${person}`,
      details: `Settled ${direction === 'owe_me' ? 'they owed' : 'I owed'} $${amount.toFixed(2)}`,
      accountId: defaultAccount
    };

    await db.transactions.add(settlement);
    await db.transactions.update(relatedTx.id, { status: 'paid' });

    alert('✓ Debt settled successfully!');
    loadDebts();
    setIsSettling(false);
  };

  // Calculate net balance
  const totalOweMe = debts.oweMe.reduce((sum, d) => sum + d.amount, 0);
  const totalIOwe = debts.iOwe.reduce((sum, d) => sum + d.amount, 0);
  const netBalance = totalOweMe - totalIOwe;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <FiUserCheck size={22} className="opacity-90" />
            <FiTrendingUp size={16} className="opacity-70" />
          </div>
          <div className="text-2xl font-bold">${formatCurrency(totalOweMe)}</div>
          <div className="text-xs mt-1 opacity-90">They owe me</div>
          <div className="text-xs opacity-75 mt-1">{debts.oweMe.length} person(s)</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <FiUserX size={22} className="opacity-90" />
            <FiTrendingDown size={16} className="opacity-70" />
          </div>
          <div className="text-2xl font-bold">${formatCurrency(totalIOwe)}</div>
          <div className="text-xs mt-1 opacity-90">I owe them</div>
          <div className="text-xs opacity-75 mt-1">{debts.iOwe.length} person(s)</div>
        </div>
      </div>

      {/* Net Position Card */}
      <div className={`rounded-2xl p-4 shadow-md ${netBalance > 0 ? 'bg-emerald-50 border border-emerald-200' :
        netBalance < 0 ? 'bg-rose-50 border border-rose-200' :
          'bg-gray-50 border border-gray-200'
        }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium mb-1">Your Net Position</div>
            <div className={`text-2xl font-bold ${netBalance > 0 ? 'text-emerald-700' :
              netBalance < 0 ? 'text-rose-700' :
                'text-gray-700'
              }`}>
              {netBalance > 0 ? '+' : ''}${formatCurrency(Math.abs(netBalance))}
            </div>
          </div>
          <div className={`rounded-full p-3 ${netBalance > 0 ? 'bg-emerald-200' :
            netBalance < 0 ? 'bg-rose-200' :
              'bg-gray-200'
            }`}>
            {netBalance > 0 ? (
              <FiSmile size={28} className="text-emerald-700" />
            ) : netBalance < 0 ? (
              <FiFrown size={28} className="text-rose-700" />
            ) : (
              <FiCheckCircle size={28} className="text-gray-700" />
            )}
          </div>
        </div>
        <div className="text-xs mt-2 opacity-75">
          {netBalance > 0 ? 'You are owed money overall' :
            netBalance < 0 ? 'You owe money overall' :
              'All debts are settled'}
        </div>
      </div>

      {/* They Owe Me Section */}
      {debts.oweMe.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
            <div className="flex items-center gap-2">
              <div className="bg-green-200 p-1.5 rounded-xl">
                <FiUserCheck className="text-green-700" size={18} />
              </div>
              <h2 className="font-semibold text-green-800">They Owe Me</h2>
              <span className="ml-auto bg-green-200 text-green-800 text-xs px-2 py-1 rounded-full">
                {debts.oweMe.length} pending
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {debts.oweMe.map(debt => (
              <div key={debt.person} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-gray-800 text-lg">{debt.person}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <FiClock size={12} />
                      <span>{debt.transactionCount} pending transaction(s)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">${formatCurrency(debt.amount)}</div>
                    <div className="text-xs text-gray-400 mt-1">Total owed</div>
                  </div>
                </div>
                <button
                  onClick={() => settleDebt(debt.person, debt.amount, 'owe_me')}
                  disabled={isSettling}
                  className="w-full mt-2 bg-green-600 text-white py-2.5 rounded-xl font-medium hover:bg-green-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <MdAccountBalance size={18} />
                  Mark as Settled
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* I Owe Them Section */}
      {debts.iOwe.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100">
            <div className="flex items-center gap-2">
              <div className="bg-red-200 p-1.5 rounded-xl">
                <FiUserX className="text-red-700" size={18} />
              </div>
              <h2 className="font-semibold text-red-800">I Owe Them</h2>
              <span className="ml-auto bg-red-200 text-red-800 text-xs px-2 py-1 rounded-full">
                {debts.iOwe.length} pending
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {debts.iOwe.map(debt => (
              <div key={debt.person} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-gray-800 text-lg">{debt.person}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <FiClock size={12} />
                      <span>{debt.transactionCount} pending transaction(s)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-red-600">${formatCurrency(debt.amount)}</div>
                    <div className="text-xs text-gray-400 mt-1">Total owed</div>
                  </div>
                </div>
                <button
                  onClick={() => settleDebt(debt.person, debt.amount, 'i_owe')}
                  disabled={isSettling}
                  className="w-full mt-2 bg-red-600 text-white py-2.5 rounded-xl font-medium hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <FiDollarSign size={18} />
                  Pay & Settle
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {debts.oweMe.length === 0 && debts.iOwe.length === 0 && (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center">
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="text-green-600" size={36} />
          </div>
          <div className="text-gray-800 font-semibold text-lg mb-1">All Clear!</div>
          <div className="text-gray-500 text-sm">No pending debts. All transactions are settled.</div>
          <div className="text-xs text-gray-400 mt-3">Good financial health! 🎉</div>
        </div>
      )}

      {/* Loading Overlay */}
      {isSettling && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <div className="text-gray-700 font-medium">Processing settlement...</div>
          </div>
        </div>
      )}
    </div>
  );
}