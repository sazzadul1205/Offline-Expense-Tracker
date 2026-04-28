// src/components/EditTransaction.jsx

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../db/database';
import { formatCurrency } from '../utils/currency';
import { showToast, showErrorAlert } from '../utils/alerts';
import { editTransaction } from '../utils/accountingRules';
import { notifyDataChanged } from '../utils/refresh';
import { FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

export default function EditTransaction() {
  const navigate = useNavigate();
  const location = useLocation();
  const { transaction } = location.state || {};

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    date: '',
    time: '',
    accountId: '',
    fromAccountId: '',
    toAccountId: '',
    categoryId: '',
    person: '',
    direction: 'owe_me',
    title: '',
    details: '',
    fee: ''
  });

  useEffect(() => {
    if (!transaction) {
      navigate('/');
      return;
    }
    loadData();
  }, [transaction, navigate]);

  const loadData = async () => {
    const accs = await db.accounts.toArray();
    const cats = await db.categories.toArray();
    setAccounts(accs);
    setCategories(cats);

    setFormData({
      amount: transaction.amount,
      date: transaction.date || new Date().toISOString().split('T')[0],
      time: transaction.time || '12:00',
      accountId: transaction.accountId || '',
      fromAccountId: transaction.fromAccountId || '',
      toAccountId: transaction.toAccountId || '',
      categoryId: transaction.categoryId || '',
      person: transaction.person || '',
      direction: transaction.direction || 'owe_me',
      title: transaction.title || '',
      details: transaction.details || '',
      fee: transaction.fee || ''
    });
  };

  const isExpense = transaction?.type === 'expense';
  const isIncome = transaction?.type === 'income';
  const isTransfer = transaction?.type === 'transfer';
  const isCredit = transaction?.type === 'credit';

  const handleSubmit = async (e) => {
    e.preventDefault();

    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showErrorAlert('Error', 'Please enter a valid amount');
      return;
    }

    if (isExpense || isIncome) {
      if (!formData.accountId) {
        showErrorAlert('Error', 'Please select an account');
        return;
      }
    }

    if (isTransfer) {
      if (!formData.fromAccountId || !formData.toAccountId) {
        showErrorAlert('Error', 'Please select both accounts');
        return;
      }
      if (formData.fromAccountId === formData.toAccountId) {
        showErrorAlert('Error', 'Cannot transfer to the same account');
        return;
      }
    }

    if (isCredit && !formData.person) {
      showErrorAlert('Error', 'Please enter person name');
      return;
    }

    setIsProcessing(true);

    try {
      const timestamp = new Date(`${formData.date}T${formData.time}`).getTime();

      const updatedTransaction = {
        ...transaction,
        amount: amountNum,
        date: formData.date,
        time: formData.time,
        timestamp: timestamp,
        title: formData.title || `${transaction.type} transaction`,
        details: formData.details || '',
      };

      if (isExpense || isIncome) {
        updatedTransaction.accountId = parseInt(formData.accountId);
        if (formData.categoryId) {
          updatedTransaction.categoryId = parseInt(formData.categoryId);
        }
      }

      if (isTransfer) {
        updatedTransaction.fromAccountId = parseInt(formData.fromAccountId);
        updatedTransaction.toAccountId = parseInt(formData.toAccountId);
        if (formData.fee && parseFloat(formData.fee) > 0) {
          updatedTransaction.fee = parseFloat(formData.fee);
        }
      }

      if (isCredit) {
        updatedTransaction.person = formData.person;
        updatedTransaction.direction = formData.direction;
      }

      const result = await editTransaction(transaction.id, updatedTransaction);

      if (result.success) {
        showToast('Transaction updated successfully', 'success');
        notifyDataChanged();
        navigate('/');
      } else {
        showErrorAlert('Edit Failed', result.message);
      }
    } catch (error) {
      console.error('Edit error:', error);
      showErrorAlert('Error', 'Failed to update transaction');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!transaction) return null;

  const filteredCategories = categories.filter(c =>
    (isExpense && c.type === 'expense') || (isIncome && c.type === 'income')
  );

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto">
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <FiArrowLeft size={22} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          Edit {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-6 pb-32 max-w-md mx-auto">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <label className="text-sm font-semibold text-gray-700 block mb-2">Amount (৳)</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full rounded-xl px-4 py-3 text-2xl font-bold border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              required
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-xl px-4 py-3 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full rounded-xl px-4 py-3 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                required
              />
            </div>
          </div>

          {(isExpense || isIncome) && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Account</label>
                <select
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  required
                >
                  <option value="">Select account</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Category</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                >
                  <option value="">Select category</option>
                  {filteredCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
            </div>
          )}

          {isTransfer && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">From Account</label>
                <select
                  value={formData.fromAccountId}
                  onChange={(e) => setFormData({ ...formData, fromAccountId: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  required
                >
                  <option value="">Select account</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">To Account</label>
                <select
                  value={formData.toAccountId}
                  onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  required
                >
                  <option value="">Select account</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Transfer Fee (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.fee}
                  onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          {isCredit && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Person Name</label>
                <input
                  type="text"
                  value={formData.person}
                  onChange={(e) => setFormData({ ...formData, person: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Direction</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, direction: 'owe_me' })}
                    className={`py-3 rounded-xl font-medium transition ${formData.direction === 'owe_me' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    They owe me
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, direction: 'i_owe' })}
                    className={`py-3 rounded-xl font-medium transition ${formData.direction === 'i_owe' ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    I owe them
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Title (optional)</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-xl px-4 py-3 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                placeholder="e.g., Grocery shopping"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Details (optional)</label>
              <textarea
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                rows={3}
                className="w-full rounded-xl px-4 py-3 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                placeholder="Add notes..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 pb-10">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 py-3 rounded-xl font-medium border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}