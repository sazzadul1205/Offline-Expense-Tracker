// src/components/Accounts.jsx

import { useState, useEffect } from 'react';
import { db } from '../db/database';

import {
  MdAccountBalance,
  MdSavings,
  MdAccountBalanceWallet,
  MdPhoneAndroid
} from 'react-icons/md';

import {
  FiPlus,
  FiTrash2,
  FiPhone,
  FiCreditCard,
  FiDollarSign
} from 'react-icons/fi';

// Utils
import { formatCurrency } from '../utils/currency';
import { notifyDataChanged } from '../utils/refresh';
import { showErrorAlert, showToast, showConfirmAlert } from '../utils/alerts';

export default function Accounts() {

  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);

  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'cash',
    balance: ''
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    const data = await db.accounts.toArray();
    setAccounts(data);

    const total = data.reduce((s, a) => s + (a.balance || 0), 0);
    setTotalBalance(total);
  };

  const handleAddAccount = async () => {
    if (!newAccount.name.trim()) {
      showErrorAlert('Error', 'Enter account name');
      return;
    }

    await db.accounts.add({
      ...newAccount,
      balance: parseFloat(newAccount.balance) || 0
    });

    setNewAccount({ name: '', type: 'cash', balance: '' });
    setShowForm(false);
    await loadAccounts();

    await loadAccounts();
    notifyDataChanged();
    showToast('Account created', 'success');
  };

  const handleDeleteAccount = async (id) => {
    // Check if account is used in any transaction
    const usedInTransactions = await db.transactions
      .where('accountId')
      .equals(id)
      .or('fromAccountId')
      .equals(id)
      .or('toAccountId')
      .equals(id)
      .count();

    if (usedInTransactions > 0) {
      showErrorAlert('Cannot Delete', 'This account has transaction history. Delete or reassign transactions first.');
      return;
    }

    const confirmed = await showConfirmAlert(
      'Delete account?',
      'This action cannot be undone',
      'Delete',
      'Cancel'
    );

    if (!confirmed) return;

    await db.accounts.delete(id);
    await loadAccounts();
    notifyDataChanged();
    showToast('Account removed', 'success');
  };

  const types = [
    { id: 'cash', label: 'Cash', icon: MdAccountBalanceWallet },
    { id: 'mobile', label: 'Mobile Banking', icon: MdPhoneAndroid },
    { id: 'card', label: 'Card', icon: FiCreditCard },
    { id: 'bank', label: 'Bank', icon: MdAccountBalance }
  ];

  const input =
    "w-full border border-gray-200 rounded-xl px-4 py-2.5 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500";

  return (
    <div className="space-y-4 pb-6">

      {/* TOTAL */}
      <div className="bg-blue-600 text-white rounded-2xl p-5">
        <div className="flex justify-between items-center">
          <div className="text-sm opacity-80">Total Balance</div>
          <FiDollarSign />
        </div>
        <div className="text-3xl font-bold mt-2">
          {formatCurrency(totalBalance)}
        </div>
        <div className="text-xs opacity-70 mt-1">
          {accounts.length} accounts
        </div>
      </div>

      {/* ADD BUTTON */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full border border-dashed border-blue-300 text-blue-600 rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-blue-50 transition"
      >
        <FiPlus />
        {showForm ? 'Cancel' : 'Add Account'}
      </button>

      {/* FORM */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">

          <input
            className={input}
            placeholder="Account name"
            value={newAccount.name}
            onChange={(e) =>
              setNewAccount({ ...newAccount, name: e.target.value })
            }
          />

          {/* TYPE */}
          <div className="grid grid-cols-4 gap-2">
            {types.map(t => {
              const Icon = t.icon;
              const active = newAccount.type === t.id;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    setNewAccount({ ...newAccount, type: t.id })
                  }
                  className={`py-2 rounded-xl flex flex-col items-center text-xs transition
                    ${active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}
                  `}
                >
                  <Icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </div>

          <input
            type="number"
            className={input}
            placeholder="Initial balance"
            value={newAccount.balance}
            onChange={(e) =>
              setNewAccount({
                ...newAccount,
                balance: e.target.value
              })
            }
          />

          <button
            onClick={handleAddAccount}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition"
          >
            Save Account
          </button>

        </div>
      )}

      {/* ACCOUNTS LIST */}
      <div className="space-y-3">

        {accounts.map(acc => {
          const Icon = types.find(t => t.id === acc.type)?.icon || MdAccountBalanceWallet;

          return (
            <div
              key={acc.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex justify-between items-center"
            >

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gray-100">
                  <Icon size={20} />
                </div>

                <div>
                  <div className="font-medium">{acc.name}</div>
                  <div className="text-xs text-gray-400 uppercase">
                    {acc.type === 'mobile' ? 'Mobile Banking' : acc.type}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-semibold">
                  {formatCurrency(acc.balance)}
                </div>

                <button
                  onClick={() => handleDeleteAccount(acc.id)}
                  className="text-xs text-red-500 mt-1"
                >
                  Delete
                </button>
              </div>

            </div>
          );
        })}

      </div>

      {/* EMPTY */}
      {accounts.length === 0 && !showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="text-gray-400 mb-2">
            No accounts found
          </div>
          <div className="text-sm text-gray-500">
            Create your first account to start tracking
          </div>
        </div>
      )}

    </div>
  );
} 