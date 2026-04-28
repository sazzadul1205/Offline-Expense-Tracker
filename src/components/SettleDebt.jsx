// src/components/SettleDebt.jsx

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../db/database';
import { formatCurrency } from '../utils/currency';
import { showToast, showErrorAlert, showConfirmAlert } from '../utils/alerts';
import { applyTransaction } from '../utils/accountingRules';
import { notifyDataChanged } from '../utils/refresh';
import { FiArrowLeft, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export default function SettleDebt() {
  const navigate = useNavigate();
  const location = useLocation();
  const { debt, direction } = location.state || {};

  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!debt || !direction) {
      navigate('/debt');
      return;
    }
    loadAccounts();
  }, [debt, direction, navigate]);

  const loadAccounts = async () => {
    const accs = await db.accounts.toArray();
    setAccounts(accs);
    if (accs.length > 0) setSelectedAccountId(accs[0].id);
  };

  const isReceiving = direction === 'owe_me';
  const isPaying = direction === 'i_owe';
  const { person, amount } = debt || { person: '', amount: 0 };

  const selectedAccount = accounts.find(a => a.id === parseInt(selectedAccountId));
  const newBalance = selectedAccount ? (isReceiving ? selectedAccount.balance + amount : selectedAccount.balance - amount) : 0;
  const isInsufficient = isPaying && selectedAccount && selectedAccount.balance < amount;

  const handleSettle = async () => {
    if (!selectedAccountId) {
      showErrorAlert('Error', 'Please select an account');
      return;
    }

    setIsProcessing(true);

    try {
      const pendingTxns = await db.transactions
        .where('person')
        .equals(person)
        .filter(t => t.status === 'pending')
        .toArray();

      if (pendingTxns.length === 0) {
        showErrorAlert('Error', 'No pending debt found for this person');
        setIsProcessing(false);
        return;
      }

      if (isPaying && selectedAccount.balance < amount) {
        const confirmed = await showConfirmAlert(
          'Insufficient Balance',
          `Your ${selectedAccount.name} account has ${formatCurrency(selectedAccount.balance)} but you need ${formatCurrency(amount)}. Continue anyway?`,
          'Continue',
          'Cancel'
        );
        if (!confirmed) {
          setIsProcessing(false);
          return;
        }
      }

      for (const t of pendingTxns) {
        await db.transactions.update(t.id, { status: 'paid' });
      }

      const settlementTransaction = {
        type: 'debt_settlement',
        amount: amount,
        status: 'paid',
        person: person,
        direction: direction,
        accountId: parseInt(selectedAccountId),
        timestamp: Date.now(),
        title: `Settlement - ${person}${isPaying ? ' (Payment made)' : ' (Payment received)'}`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
        details: `Settled ${formatCurrency(amount)} using ${selectedAccount.name}`
      };

      const newTxId = await db.transactions.add(settlementTransaction);
      await applyTransaction({ ...settlementTransaction, id: newTxId }, true);

      showToast(`Settled ${formatCurrency(amount)} with ${person}`, 'success');
      notifyDataChanged();
      navigate('/debt');
    } catch (error) {
      console.error('Settlement error:', error);
      showErrorAlert('Error', 'Failed to settle debt');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!debt || !direction) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto">
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate('/debt')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <FiArrowLeft size={22} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Settle Debt</h1>
      </div>

      <div className="px-5 py-6 pb-32 max-w-md mx-auto">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${isReceiving ? 'bg-emerald-100' : 'bg-rose-100'}`}>
              {isReceiving ? <FiCheckCircle size={40} className="text-emerald-600" /> : <FiAlertCircle size={40} className="text-rose-600" />}
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{person}</h2>
            <p className="text-gray-500 mt-1">{isReceiving ? 'owes you money' : 'you owe money to'}</p>
          </div>

          <div className={`rounded-2xl p-6 text-white ${isReceiving ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-rose-500 to-rose-600'}`}>
            <div className="text-center">
              <p className="text-sm opacity-80 mb-1">Amount to {isReceiving ? 'Receive' : 'Pay'}</p>
              <p className="text-4xl font-bold">{formatCurrency(amount)}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Select Account</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full rounded-xl px-4 py-3 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              >
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} — {formatCurrency(acc.balance)}</option>)}
              </select>
            </div>

            {selectedAccount && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current Balance:</span>
                  <span className="font-semibold">{formatCurrency(selectedAccount.balance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">After Transaction:</span>
                  <span className={`font-semibold ${newBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(newBalance)}</span>
                </div>
                {isInsufficient && (
                  <div className="bg-amber-50 rounded-lg p-2 mt-2">
                    <p className="text-xs text-amber-700 text-center">⚠️ Your account balance will become negative</p>
                  </div>
                )}
              </div>
            )}

            <div className={`rounded-xl p-3 ${isReceiving ? 'bg-emerald-50' : 'bg-blue-50'}`}>
              <p className={`text-xs text-center ${isReceiving ? 'text-emerald-700' : 'text-blue-700'}`}>
                {isReceiving
                  ? `💰 ${formatCurrency(amount)} will be added to your ${selectedAccount?.name || 'selected'} account`
                  : `💸 ${formatCurrency(amount)} will be deducted from your ${selectedAccount?.name || 'selected'} account`}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 pb-10">
            <button
              onClick={() => navigate('/debt')}
              className="flex-1 py-3 rounded-xl font-medium border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleSettle}
              disabled={isProcessing || !selectedAccountId}
              className={`flex-1 py-3 rounded-xl font-semibold text-white transition-all active:scale-95 disabled:opacity-50 ${isReceiving
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                isReceiving ? 'Confirm Receipt' : 'Confirm Payment'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}