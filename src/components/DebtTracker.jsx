// src/components/DebtTracker.jsx

import { useState, useEffect } from 'react';
import { db } from '../db/database';

import { formatCurrency } from '../utils/currency';
import { showErrorAlert, showToast, showConfirmAlert } from '../utils/alerts';

import {
  FiUserCheck,
  FiUserX,
  FiClock,
  FiDollarSign,
  FiCheckCircle,
  FiSmile,
  FiFrown,
  FiInfo
} from 'react-icons/fi';

import { MdAccountBalance } from 'react-icons/md';

export default function DebtTracker() {

  const [isSettling, setIsSettling] = useState(false);
  const [debts, setDebts] = useState({ oweMe: [], iOwe: [] });
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);

  // Settlement modal state
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [settlementDirection, setSettlementDirection] = useState('');

  useEffect(() => {
    loadDebts();
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    const accs = await db.accounts.toArray();
    setAccounts(accs);
  };

  const loadDebts = async () => {
    const pending = await db.transactions
      .where('status')
      .equals('pending')
      .toArray();

    setPendingTransactions(pending);

    const map = {};

    pending.forEach(t => {
      if (!map[t.person]) {
        map[t.person] = { oweMe: 0, iOwe: 0, count: 0 };
      }

      map[t.person].count++;

      if (t.direction === 'owe_me') map[t.person].oweMe += t.amount;
      if (t.direction === 'i_owe') map[t.person].iOwe += t.amount;
    });

    const oweMe = [];
    const iOwe = [];

    Object.entries(map).forEach(([person, d]) => {
      const net = d.oweMe - d.iOwe;

      if (net > 0) oweMe.push({ person, amount: net, count: d.count });
      if (net < 0) iOwe.push({ person, amount: Math.abs(net), count: d.count });
    });

    setDebts({ oweMe, iOwe });
  };

  // Open settlement modal
  const openSettleModal = (debt, direction) => {
    if (accounts.length === 0) {
      showErrorAlert('No Accounts', 'Please create an account first in the Accounts tab');
      return;
    }
    setSelectedDebt(debt);
    setSettlementDirection(direction);
    setSelectedAccountId(accounts[0]?.id || '');
    setShowSettleModal(true);
  };

  // Close modal
  const closeSettleModal = () => {
    setShowSettleModal(false);
    setSelectedDebt(null);
    setSelectedAccountId('');
    setSettlementDirection('');
  };

  // Execute settlement
  const executeSettlement = async () => {
    if (!selectedAccountId) {
      showErrorAlert('Error', 'Please select an account');
      return;
    }

    setIsSettling(true);
    closeSettleModal();

    try {
      const { person, amount } = selectedDebt;

      // Get ALL pending transactions for this person
      const pendingTxns = await db.transactions
        .where('person')
        .equals(person)
        .filter(t => t.status === 'pending')
        .toArray();

      if (pendingTxns.length === 0) {
        showErrorAlert('Error', 'No pending debt found for this person');
        setIsSettling(false);
        return;
      }

      // Get the selected account details
      const selectedAccount = accounts.find(a => a.id === parseInt(selectedAccountId));
      if (!selectedAccount) {
        showErrorAlert('Error', 'Selected account not found');
        setIsSettling(false);
        return;
      }

      // For "I owe them" (paying someone), check if account has sufficient balance
      if (settlementDirection === 'i_owe' && selectedAccount.balance < amount) {
        const confirmed = await showConfirmAlert(
          'Insufficient Balance',
          `Your ${selectedAccount.name} account has ${formatCurrency(selectedAccount.balance)} but you need ${formatCurrency(amount)}. Continue anyway? (This may result in negative balance)`,
          'Continue',
          'Cancel'
        );
        if (!confirmed) {
          setIsSettling(false);
          return;
        }
      }

      // Mark ALL pending transactions as paid
      for (const t of pendingTxns) {
        await db.transactions.update(t.id, { status: 'paid' });
      }

      // Create settlement transaction with selected account
      await db.transactions.add({
        type: 'debt_settlement',
        amount: amount,
        status: 'paid',
        person: person,
        direction: settlementDirection,
        accountId: parseInt(selectedAccountId),
        timestamp: Date.now(),
        title: `Settlement - ${person}${settlementDirection === 'i_owe' ? ' (Payment made)' : ' (Payment received)'}`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
        details: `Settled ${formatCurrency(amount)} using ${selectedAccount.name}`
      });

      // Update account balance via accounting rules
      // Fetch the recently added transaction to apply balance change
      const newTxns = await db.transactions
        .where('person')
        .equals(person)
        .filter(t => t.type === 'debt_settlement' && t.status === 'paid')
        .reverse()
        .first();

      if (newTxns) {
        const { applyTransaction } = await import('../utils/accountingRules');
        await applyTransaction(newTxns, true);
      }

      showToast(`Settled ${formatCurrency(amount)} with ${person} using ${selectedAccount.name}`, 'success');
      await loadDebts();
      await loadAccounts(); // Refresh account balances
    } catch (error) {
      console.error('Settlement error:', error);
      showErrorAlert('Error', 'Failed to settle debt');
    } finally {
      setIsSettling(false);
    }
  };

  const totalOweMe = debts.oweMe.reduce((s, d) => s + d.amount, 0);
  const totalIOwe = debts.iOwe.reduce((s, d) => s + d.amount, 0);
  const net = totalOweMe - totalIOwe;

  const Card = ({ children }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      {children}
    </div>
  );

  // Settlement Modal Component
  const SettlementModal = () => {
    if (!showSettleModal || !selectedDebt) return null;

    const isReceiving = settlementDirection === 'owe_me'; // They owe me -> I receive money
    const isPaying = settlementDirection === 'i_owe'; // I owe them -> I pay money

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md animate-slide-up">
          {/* Header */}
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">
              {isReceiving ? 'Receive Payment' : 'Make Payment'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {isReceiving
                ? `${selectedDebt.person} owes you ${formatCurrency(selectedDebt.amount)}`
                : `You owe ${selectedDebt.person} ${formatCurrency(selectedDebt.amount)}`
              }
            </p>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {/* Account Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Account {isReceiving ? 'to receive money' : 'to pay from'}
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full rounded-xl px-4 py-3 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(acc.balance)})
                  </option>
                ))}
              </select>
              {isPaying && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <FiInfo size={12} />
                  This amount will be deducted from the selected account
                </p>
              )}
              {isReceiving && (
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <FiInfo size={12} />
                  This amount will be added to the selected account
                </p>
              )}
            </div>

            {/* Amount Summary */}
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount to {isReceiving ? 'receive' : 'pay'}:</span>
                <span className="font-semibold text-gray-800">
                  {formatCurrency(selectedDebt.amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">From/To:</span>
                <span className="text-gray-800">{selectedDebt.person}</span>
              </div>
            </div>

            {/* Warning for low balance */}
            {isPaying && selectedAccountId && (
              (() => {
                const acc = accounts.find(a => a.id === parseInt(selectedAccountId));
                if (acc && acc.balance < selectedDebt.amount) {
                  return (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <p className="text-xs text-amber-700">
                        ⚠️ Warning: Your {acc.name} account has only {formatCurrency(acc.balance)}.
                        You'll have {formatCurrency(acc.balance - selectedDebt.amount)} after this transaction.
                      </p>
                    </div>
                  );
                }
                return null;
              })()
            )}
          </div>

          {/* Actions */}
          <div className="p-5 border-t border-gray-100 flex gap-3">
            <button
              onClick={closeSettleModal}
              className="flex-1 py-3 rounded-xl font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={executeSettlement}
              disabled={isSettling || !selectedAccountId}
              className={`flex-1 py-3 rounded-xl font-semibold text-white transition ${isReceiving
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-blue-600 hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSettling ? 'Processing...' : isReceiving ? 'Confirm Receipt' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-6">

      {/* SUMMARY */}
      <div className="grid grid-cols-2 gap-3">

        <div className="bg-emerald-600 text-white rounded-2xl p-4">
          <div className="flex justify-between">
            <FiUserCheck />
            <span className="text-xs opacity-70">Incoming</span>
          </div>
          <div className="text-xl font-bold mt-2">
            {formatCurrency(totalOweMe)}
          </div>
          <div className="text-xs opacity-80">
            {debts.oweMe.length} people
          </div>
        </div>

        <div className="bg-rose-600 text-white rounded-2xl p-4">
          <div className="flex justify-between">
            <FiUserX />
            <span className="text-xs opacity-70">Outgoing</span>
          </div>
          <div className="text-xl font-bold mt-2">
            {formatCurrency(totalIOwe)}
          </div>
          <div className="text-xs opacity-80">
            {debts.iOwe.length} people
          </div>
        </div>

      </div>

      {/* NET POSITION */}
      <Card>
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-500">Net Position</div>
            <div className={`text-2xl font-bold mt-1 ${net > 0 ? 'text-emerald-600' :
              net < 0 ? 'text-rose-600' :
                'text-gray-700'
              }`}>
              {net > 0 ? '+' : ''}{formatCurrency(Math.abs(net))}
            </div>
          </div>

          <div className={`p-3 rounded-full ${net > 0 ? 'bg-emerald-100' :
            net < 0 ? 'bg-rose-100' :
              'bg-gray-100'
            }`}>
            {net > 0 ? (
              <FiSmile className="text-emerald-600" />
            ) : net < 0 ? (
              <FiFrown className="text-rose-600" />
            ) : (
              <FiCheckCircle className="text-gray-600" />
            )}
          </div>
        </div>
      </Card>

      {/* THEY OWE ME */}
      {debts.oweMe.length > 0 && (
        <Card>
          <div className="font-semibold mb-3 text-emerald-700">
            They owe me
          </div>

          <div className="space-y-3">
            {debts.oweMe.map(d => (
              <div key={d.person} className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{d.person}</div>
                  <div className="text-xs text-gray-400">
                    {d.count} transaction{d.count !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-emerald-600">
                    {formatCurrency(d.amount)}
                  </div>

                  <button
                    onClick={() => openSettleModal(d, 'owe_me')}
                    disabled={isSettling || accounts.length === 0}
                    className="text-xs mt-1 text-emerald-600 font-medium hover:text-emerald-700"
                  >
                    Receive
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* I OWE THEM */}
      {debts.iOwe.length > 0 && (
        <Card>
          <div className="font-semibold mb-3 text-rose-700">
            I owe them
          </div>

          <div className="space-y-3">
            {debts.iOwe.map(d => (
              <div key={d.person} className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{d.person}</div>
                  <div className="text-xs text-gray-400">
                    {d.count} transaction{d.count !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-rose-600">
                    {formatCurrency(d.amount)}
                  </div>

                  <button
                    onClick={() => openSettleModal(d, 'i_owe')}
                    disabled={isSettling || accounts.length === 0}
                    className="text-xs mt-1 text-rose-600 font-medium hover:text-rose-700"
                  >
                    Pay
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* EMPTY */}
      {debts.oweMe.length === 0 && debts.iOwe.length === 0 && (
        <Card>
          <div className="text-center py-6">
            <FiCheckCircle className="mx-auto text-green-500 mb-2" size={28} />
            <div className="font-semibold">All clear</div>
            <div className="text-xs text-gray-500 mt-1">
              No pending debts
            </div>
          </div>
        </Card>
      )}

      {/* Warning when no accounts */}
      {accounts.length === 0 && (debts.oweMe.length > 0 || debts.iOwe.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-start gap-2">
            <FiInfo className="text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-700">
              Please create an account in the Accounts tab to settle debts.
            </div>
          </div>
        </div>
      )}

      {/* Settlement Modal */}
      <SettlementModal />

      {/* Add animation CSS */}
      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}