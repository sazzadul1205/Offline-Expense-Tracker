// src/components/Accounts.jsx

// React
import { useState, useEffect } from 'react';

// Database
import { db } from '../db/database';

// Icons
import { MdAccountBalance, MdSavings, MdAccountBalanceWallet } from 'react-icons/md';
import { FiPlus, FiTrash2, FiPhone, FiCreditCard, FiHome, FiDollarSign, FiAlertCircle, FiX } from 'react-icons/fi';

// Utils
import { formatCurrency, CURRENCY_SYMBOL } from '../utils/currency';
import { showErrorAlert, showToast, showConfirmAlert } from '../utils/alerts';

export default function Accounts() {

  // State
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);
  const [newAccount, setNewAccount] = useState({ name: '', type: 'cash', balance: 0 });

  // Effects
  useEffect(() => {
    loadAccounts();
  }, []);

  // Load accounts
  const loadAccounts = async () => {
    const acs = await db.accounts.toArray();
    setAccounts(acs);
    const total = acs.reduce((sum, acc) => sum + acc.balance, 0);
    setTotalBalance(total);
  };

  // Add account
  const handleAddAccount = async () => {
    if (!newAccount.name.trim()) {
      showErrorAlert('Validation Error', 'Please enter account name');
      return;
    }
    await db.accounts.add(newAccount);
    setNewAccount({ name: '', type: 'cash', balance: 0 });
    setShowForm(false);
    await loadAccounts();
    showToast('Account added successfully!', 'success');
  };

  // Delete account
  const handleDeleteAccount = async (id) => {
    const hasTransactions = await db.transactions
      .where('accountId')
      .equals(id)
      .or('fromAccountId')
      .equals(id)
      .or('toAccountId')
      .equals(id)
      .count();

    if (hasTransactions > 0) {
      showErrorAlert('Cannot Delete', 'Cannot delete account with transaction history');
      return;
    }

    const confirmed = await showConfirmAlert('Delete Account', 'Are you sure you want to delete this account?', 'Delete', 'Cancel');
    if (confirmed) {
      await db.accounts.delete(id);
      await loadAccounts();
      showToast('Account deleted successfully', 'success');
    }
  };

  // Get account type icon
  const getTypeIcon = (type) => {
    const icons = {
      cash: <MdAccountBalanceWallet size={24} />,
      bkash: <FiPhone size={24} />,
      card: <FiCreditCard size={24} />,
      bank: <MdAccountBalance size={24} />
    };
    return icons[type] || <MdAccountBalanceWallet size={24} />;
  };

  // Get account type color - FIXED with complete classes
  const getTypeColorClass = (type) => {
    const colors = {
      cash: 'bg-emerald-100 text-emerald-700',
      bkash: 'bg-pink-100 text-pink-700',
      card: 'bg-blue-100 text-blue-700',
      bank: 'bg-purple-100 text-purple-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  // Get account type gradient - FIXED with complete classes
  const getTypeGradientClass = (type) => {
    const gradients = {
      cash: 'from-emerald-500 to-emerald-600',
      bkash: 'from-pink-500 to-pink-600',
      card: 'from-blue-500 to-blue-600',
      bank: 'from-purple-500 to-purple-600'
    };
    return gradients[type] || 'from-gray-500 to-gray-600';
  };

  // Account types with complete classes - FIXED
  const accountTypes = [
    { id: 'cash', label: 'Cash', icon: MdAccountBalanceWallet, activeClass: 'bg-emerald-500 text-white shadow-md scale-95', inactiveClass: 'bg-gray-100 text-gray-600 hover:scale-105', iconColor: 'text-emerald-600' },
    { id: 'bkash', label: 'bKash', icon: FiPhone, activeClass: 'bg-pink-500 text-white shadow-md scale-95', inactiveClass: 'bg-gray-100 text-gray-600 hover:scale-105', iconColor: 'text-pink-600' },
    { id: 'card', label: 'Card', icon: FiCreditCard, activeClass: 'bg-blue-500 text-white shadow-md scale-95', inactiveClass: 'bg-gray-100 text-gray-600 hover:scale-105', iconColor: 'text-blue-600' },
    { id: 'bank', label: 'Bank', icon: MdAccountBalance, activeClass: 'bg-purple-500 text-white shadow-md scale-95', inactiveClass: 'bg-gray-100 text-gray-600 hover:scale-105', iconColor: 'text-purple-600' }
  ];

  return (
    <div className="space-y-4 pb-4">
      {/* Total Balance Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium opacity-90">Total Balance</div>
          <div className="bg-white/20 rounded-full p-2">
            <FiDollarSign size={20} />
          </div>
        </div>
        <div className="text-3xl font-bold">{formatCurrency(totalBalance)}</div>
        <div className="text-xs mt-2 opacity-75">
          Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Add Account Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full bg-white border-2 border-dashed border-blue-300 text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
      >
        <FiPlus size={20} />
        {showForm ? 'Cancel' : 'Add New Account'}
      </button>

      {/* Add Account Form - FIXED button mapping */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg p-5 animate-fade-in">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FiPlus className="text-blue-600" />
            New Account Details
          </h3>

          <input
            type="text"
            placeholder="Account name (e.g., Savings, Salary)"
            value={newAccount.name}
            onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-3 focus:border-blue-500 focus:outline-none transition-colors"
          />

          <div className="grid grid-cols-4 gap-2 mb-3">
            {accountTypes.map(type => {
              const Icon = type.icon;
              const isSelected = newAccount.type === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setNewAccount({ ...newAccount, type: type.id })}
                  className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${isSelected ? type.activeClass : type.inactiveClass
                    }`}
                >
                  <Icon size={18} className={isSelected ? 'text-white' : type.iconColor} />
                  <span className="text-xs">{type.label}</span>
                </button>
              );
            })}
          </div>

          <input
            type="number"
            step="1"
            placeholder="Initial balance (BDT)"
            value={newAccount.balance}
            onChange={(e) => setNewAccount({ ...newAccount, balance: parseFloat(e.target.value) || 0 })}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-3 focus:border-blue-500 focus:outline-none"
          />

          <div className="flex gap-2">
            <button
              onClick={handleAddAccount}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Save Account
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Accounts List - FIXED with static classes */}
      {accounts.map(acc => {
        const Icon = getTypeIcon(acc.type);
        const gradientClass = getTypeGradientClass(acc.type);
        const typeColorClass = getTypeColorClass(acc.type);

        return (
          <div
            key={acc.id}
            className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className={`bg-gradient-to-r ${gradientClass} p-1`} />
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${typeColorClass}`}>
                    {Icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{acc.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${typeColorClass} mt-1 inline-block`}>
                      {acc.type.toUpperCase()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteAccount(acc.id)}
                  className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">Current Balance</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {formatCurrency(acc.balance)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Empty State */}
      {accounts.length === 0 && !showForm && (
        <div className="bg-white rounded-2xl shadow-md p-10 text-center">
          <div className="bg-blue-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <MdAccountBalanceWallet className="text-blue-500" size={32} />
          </div>
          <div className="text-gray-800 font-semibold text-lg mb-1">No Accounts Yet</div>
          <div className="text-gray-500 text-sm mb-4">Add your first account to start tracking</div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Create Account
          </button>
        </div>
      )}
    </div>
  );
}