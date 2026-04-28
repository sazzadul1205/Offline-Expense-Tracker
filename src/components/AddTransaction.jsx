// src/components/AddTransaction.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/database';
import { applyTransaction } from '../utils/accountingRules';
import { formatCurrency } from '../utils/currency';
import { showToast, showErrorAlert, showLoadingAlert, closeLoadingAlert } from '../utils/alerts';
import { logError, ERROR_CATEGORIES, ERROR_LEVELS } from '../utils/errorLogger';
import { notifyDataChanged } from '../utils/refresh';

import {
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiRepeat,
  FiCreditCard,
  FiDollarSign,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiArrowRight
} from 'react-icons/fi';

export default function AddTransaction() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    }),
    accountId: '',
    fromAccountId: '',
    toAccountId: '',
    categoryId: '',
    status: 'paid',
    direction: 'owe_me',
    person: '',
    title: '',
    details: '',
    fee: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  // Reset form when component mounts (to clear any stale data)
  useEffect(() => {
    if (!isInitialLoad && accounts.length > 0) {
      resetForm();
    }
    setIsInitialLoad(false);
  }, [accounts]);

  const resetForm = () => {
    setFormData({
      type: 'expense',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }),
      accountId: accounts.length > 0 ? accounts[0].id : '',
      fromAccountId: accounts.length > 0 ? accounts[0].id : '',
      toAccountId: accounts.length > 1 ? accounts[1].id : (accounts.length > 0 ? accounts[0].id : ''),
      categoryId: '',
      status: 'paid',
      direction: 'owe_me',
      person: '',
      title: '',
      details: '',
      fee: ''
    });
  };

  const loadData = async () => {
    try {
      const a = await db.accounts.toArray();
      const c = await db.categories.toArray();

      setAccounts(a);
      setCategories(c);

      if (a.length > 0) {
        setFormData(prev => {
          const newState = { ...prev };
          if (!prev.accountId || prev.accountId === '') {
            newState.accountId = a[0].id;
          }
          if (a.length > 1) {
            if (!prev.fromAccountId || prev.fromAccountId === '') {
              newState.fromAccountId = a[0].id;
            }
            if (!prev.toAccountId || prev.toAccountId === '') {
              newState.toAccountId = a[1].id;
            }
          } else if (a.length === 1) {
            if (!prev.fromAccountId || prev.fromAccountId === '') {
              newState.fromAccountId = a[0].id;
            }
            if (!prev.toAccountId || prev.toAccountId === '') {
              newState.toAccountId = a[0].id;
            }
          }
          return newState;
        });
      }
    } catch (e) {
      console.error(e);
      showErrorAlert('Error', 'Failed to load data');
      await logError(e, ERROR_CATEGORIES.DATABASE, ERROR_LEVELS.ERROR, { action: 'loadData' });
    }
  };

  const handleTypeChange = (newType) => {
    setFormData(prev => {
      const newState = { ...prev, type: newType };

      if (newType === 'expense' || newType === 'income') {
        if (!newState.accountId && accounts.length > 0) {
          newState.accountId = accounts[0].id;
        }
      } else if (newType === 'transfer') {
        if (!newState.fromAccountId && accounts.length > 0) {
          newState.fromAccountId = accounts[0].id;
        }
        if (!newState.toAccountId && accounts.length > 1) {
          newState.toAccountId = accounts[1].id;
        } else if (!newState.toAccountId && accounts.length === 1) {
          newState.toAccountId = accounts[0].id;
        }
      }

      return newState;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showErrorAlert('Validation Error', 'Please enter a valid amount');
      return;
    }

    const amountNum = parseFloat(formData.amount);

    if (formData.type === 'expense') {
      if (!formData.accountId) {
        showErrorAlert('Validation Error', 'Please select an account');
        return;
      }
      const selectedAccount = accounts.find(a => a.id === parseInt(formData.accountId));
      if (!selectedAccount) {
        showErrorAlert('Validation Error', 'Selected account not found');
        return;
      }
    }

    if (formData.type === 'income') {
      if (!formData.accountId) {
        showErrorAlert('Validation Error', 'Please select an account');
        return;
      }
      const selectedAccount = accounts.find(a => a.id === parseInt(formData.accountId));
      if (!selectedAccount) {
        showErrorAlert('Validation Error', 'Selected account not found');
        return;
      }
    }

    if (formData.type === 'transfer') {
      if (!formData.fromAccountId || !formData.toAccountId) {
        showErrorAlert('Validation Error', 'Please select both accounts');
        return;
      }
      if (formData.fromAccountId === formData.toAccountId) {
        showErrorAlert('Validation Error', 'Cannot transfer to the same account');
        return;
      }
    }

    if ((formData.type === 'credit') && !formData.person) {
      showErrorAlert('Validation Error', 'Please enter person name');
      return;
    }

    setIsSubmitting(true);
    showLoadingAlert('Processing Transaction', 'Please wait while we add your transaction...');

    try {
      const timestamp = new Date(`${formData.date}T${formData.time}`).getTime();

      const transaction = {
        date: formData.date,
        time: formData.time,
        timestamp: timestamp,
        type: formData.type,
        amount: amountNum,
        status: formData.status,
        title: formData.title || `${formData.type} transaction`,
        details: formData.details || '',
        createdAt: new Date().toISOString()
      };

      if (formData.type === 'expense' || formData.type === 'income') {
        transaction.accountId = parseInt(formData.accountId);
      }

      if (formData.categoryId) {
        transaction.categoryId = parseInt(formData.categoryId);
      }

      if (formData.type === 'transfer') {
        transaction.fromAccountId = parseInt(formData.fromAccountId);
        transaction.toAccountId = parseInt(formData.toAccountId);
        if (formData.fee && parseFloat(formData.fee) > 0) {
          transaction.fee = parseFloat(formData.fee);
        }
      }

      if (formData.type === 'credit') {
        transaction.person = formData.person;
        transaction.direction = formData.direction;
        transaction.status = 'pending';
      }

      const transactionId = await db.transactions.add(transaction);
      const result = await applyTransaction({ ...transaction, id: transactionId }, true);

      closeLoadingAlert();

      if (!result.success) {
        await db.transactions.delete(transactionId);
        showErrorAlert('Transaction Failed', result.message);
        await logError(new Error(result.message), ERROR_CATEGORIES.TRANSACTION, ERROR_LEVELS.ERROR, { transaction, result });
      } else {
        await showToast(result.message, 'success');
        notifyDataChanged();

        // ✅ Clear the form after successful submission
        resetForm();

        // Optional: Stay on same page to add another transaction
        // If you want to go to dashboard instead, uncomment the line below
        navigate('/');
      }
    } catch (error) {
      console.error('Transaction error:', error);
      closeLoadingAlert();
      showErrorAlert('Error', 'Failed to add transaction: ' + (error.message || 'Unknown error'));
      await logError(error, ERROR_CATEGORIES.TRANSACTION, ERROR_LEVELS.ERROR, { formData });
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeButtons = [
    { id: 'expense', label: 'Expense', icon: FiArrowDownCircle, color: 'red' },
    { id: 'income', label: 'Income', icon: FiArrowUpCircle, color: 'green' },
    { id: 'transfer', label: 'Transfer', icon: FiRepeat, color: 'blue' },
    { id: 'credit', label: 'Credit', icon: FiCreditCard, color: 'purple' }
  ];

  const inputClass = "w-full rounded-xl px-3 py-2.5 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition";
  const section = "bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={section}>
        <div className="text-sm font-semibold text-gray-700">Transaction Type</div>
        <div className="grid grid-cols-4 gap-2">
          {typeButtons.map(t => {
            const Icon = t.icon;
            const active = formData.type === t.id;
            const colorMap = {
              red: 'bg-red-500',
              green: 'bg-green-500',
              blue: 'bg-blue-500',
              purple: 'bg-purple-500'
            };
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTypeChange(t.id)}
                className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all ${active ? `${colorMap[t.color]} text-white shadow-md scale-[0.98]` : "bg-gray-50 hover:bg-gray-100 text-gray-600"
                  }`}
              >
                <Icon size={18} />
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={section}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
              <FiDollarSign size={14} /> Amount (৳)
            </label>
            <input
              className={inputClass + " text-lg font-semibold"}
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
              <FiCalendar size={14} /> Date
            </label>
            <input
              className={inputClass}
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
            <FiClock size={14} /> Time
          </label>
          <input
            className={inputClass}
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
          />
        </div>
      </div>

      <div className={section}>
        {accounts.length === 0 ? (
          <div className="text-center py-4 text-amber-600 bg-amber-50 rounded-xl">
            <p className="text-sm">⚠️ No accounts found</p>
            <p className="text-xs mt-1">Please create an account first in the Accounts tab</p>
          </div>
        ) : formData.type === 'transfer' ? (
          <>
            <div className="text-sm font-semibold">Transfer Accounts</div>
            <select
              className={inputClass}
              value={formData.fromAccountId || ''}
              onChange={(e) => setFormData({ ...formData, fromAccountId: e.target.value })}
              required
            >
              <option value="">From account</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatCurrency(a.balance)})
                </option>
              ))}
            </select>
            <div className="flex justify-center text-gray-400">
              <FiArrowRight />
            </div>
            <select
              className={inputClass}
              value={formData.toAccountId || ''}
              onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
              required
            >
              <option value="">To account</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatCurrency(a.balance)})
                </option>
              ))}
            </select>
            <input
              className={inputClass}
              type="number"
              step="0.01"
              placeholder="Transfer fee (optional)"
              value={formData.fee}
              onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
            />
          </>
        ) : (
          <select
            className={inputClass}
            value={formData.accountId || ''}
            onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
            required
          >
            <option value="">Select account</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} ({formatCurrency(a.balance)})
              </option>
            ))}
          </select>
        )}
      </div>

      {(formData.type === 'expense' || formData.type === 'income') && (
        <div className={section}>
          <select
            className={inputClass}
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          >
            <option value="">Select category</option>
            {categories
              .filter(c => c.type === formData.type)
              .map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>
      )}

      {formData.type === 'credit' && (
        <div className={section}>
          <input
            className={inputClass}
            placeholder="Person name"
            value={formData.person}
            onChange={(e) => setFormData({ ...formData, person: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, direction: 'owe_me' })}
              className={`py-2 rounded-xl text-sm font-medium transition ${formData.direction === 'owe_me'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600'
                }`}
            >
              They owe me
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, direction: 'i_owe' })}
              className={`py-2 rounded-xl text-sm font-medium transition ${formData.direction === 'i_owe'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-600'
                }`}
            >
              I owe them
            </button>
          </div>
        </div>
      )}

      <div className={section}>
        <input
          className={inputClass}
          placeholder="Title (optional)"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
        <textarea
          className={inputClass}
          rows={3}
          placeholder="Details (optional)"
          value={formData.details}
          onChange={(e) => setFormData({ ...formData, details: e.target.value })}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || accounts.length === 0}
        className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-md hover:shadow-lg active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FiCheckCircle className="inline mr-2" />
        {isSubmitting ? 'Processing...' : accounts.length === 0 ? 'Add an Account First' : 'Add Transaction'}
      </button>
    </form>
  );
}