// src/components/AddTransaction.jsx

// React
import { useState, useEffect } from 'react';

// Database
import { db } from '../db/database';

// Utils
import { applyTransaction } from '../utils/accountingRules';
import { formatCurrency, CURRENCY_SYMBOL } from '../utils/currency';

// Icons
import { MdOutlinePersonAdd, MdOutlineNotes } from 'react-icons/md';
import { FiArrowDownCircle, FiArrowUpCircle, FiRepeat, FiCreditCard, FiDollarSign, FiCalendar, FiClock, FiUser, FiTag, FiInfo, FiAlertCircle, FiCheckCircle, FiArrowRight } from 'react-icons/fi';

export default function AddTransaction() {

  // State
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
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

  // Effects
  useEffect(() => {
    loadData();
  }, []);

  // Load data from IndexedDB
  const loadData = async () => {
    const accountsList = await db.accounts.toArray();
    const categoriesList = await db.categories.toArray();
    setAccounts(accountsList);
    setCategories(categoriesList);
    if (accountsList[0]) setFormData(prev => ({ ...prev, accountId: accountsList[0].id }));
  };

  // Form handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const dateTime = new Date(`${formData.date}T${formData.time}`);
    const timestamp = dateTime.getTime();

    const transaction = {
      ...formData,
      amount: parseFloat(formData.amount),
      fee: formData.fee ? parseFloat(formData.fee) : 0,
      date: formData.date,
      time: formData.time,
      timestamp: timestamp,
      type: formData.type
    };

    if (transaction.type === 'credit') {
      transaction.status = 'pending';
    }

    const txId = await db.transactions.add(transaction);
    transaction.id = txId;

    const result = await applyTransaction(transaction, true);

    if (result.success) {
      alert('✓ Transaction added successfully!');
      resetForm();
    } else {
      await db.transactions.delete(txId);
      alert(`✗ Error: ${result.message}`);
    }
    setIsSubmitting(false);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      type: 'expense',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      accountId: accounts[0]?.id || '',
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
  };

  // Transaction type buttons
  const typeButtons = [
    { id: 'expense', label: 'Expense', icon: FiArrowDownCircle, color: 'red', bgColor: 'bg-red-50', activeBg: 'bg-red-500' },
    { id: 'income', label: 'Income', icon: FiArrowUpCircle, color: 'green', bgColor: 'bg-green-50', activeBg: 'bg-green-500' },
    { id: 'transfer', label: 'Transfer', icon: FiRepeat, color: 'blue', bgColor: 'bg-blue-50', activeBg: 'bg-blue-500' },
    { id: 'credit', label: 'Credit', icon: FiCreditCard, color: 'purple', bgColor: 'bg-purple-50', activeBg: 'bg-purple-500' }
  ];

  return (
    <div className="pb-4">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Transaction Type Selector */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <label className="block text-gray-700 font-semibold mb-3 text-sm">Transaction Type</label>
          <div className="grid grid-cols-4 gap-2">
            {typeButtons.map(type => {
              const Icon = type.icon;
              const isActive = formData.type === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.id })}
                  className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all duration-200 ${isActive
                    ? `${type.activeBg} text-white shadow-md scale-95`
                    : `${type.bgColor} text-gray-700 hover:scale-105`
                    }`}
                >
                  <Icon size={20} className={isActive ? 'text-white' : `text-${type.color}-500`} />
                  <span className="text-xs font-medium capitalize">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount, Date & Time */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm flex items-center gap-1">
                <FiDollarSign size={16} className="text-blue-500" />
                Amount (BDT)
              </label>
              <input
                type="number"
                step="1"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-lg font-semibold focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm flex items-center gap-1">
                <FiCalendar size={16} className="text-blue-500" />
                Date
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm flex items-center gap-1">
              <FiClock size={16} className="text-blue-500" />
              Time
            </label>
            <input
              type="time"
              required
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Account Selection */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          {formData.type === 'transfer' ? (
            <>
              <label className="block text-gray-700 font-semibold mb-3 text-sm flex items-center gap-1">
                <FiArrowRight size={16} className="text-blue-500" />
                Transfer Between Accounts
              </label>
              <div className="space-y-3">
                <select
                  required
                  value={formData.fromAccountId}
                  onChange={(e) => setFormData({ ...formData, fromAccountId: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">From account</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                  ))}
                </select>
                <FiArrowRight className="text-gray-400 mx-auto" size={20} />
                <select
                  required
                  value={formData.toAccountId}
                  onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">To account</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm flex items-center gap-1">
                <FiInfo size={16} className="text-blue-500" />
                Account
              </label>
              <select
                required={formData.type !== 'credit'}
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:border-blue-500 focus:outline-none"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Credit specific fields */}
        {formData.type === 'credit' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
            <label className="block text-gray-700 font-semibold text-sm">Credit Details</label>
            <select
              value={formData.direction}
              onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:border-blue-500 focus:outline-none"
            >
              <option value="owe_me">💰 They owe me (I lent money)</option>
              <option value="i_owe">💸 I owe them (I borrowed money)</option>
            </select>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                required
                value={formData.person}
                onChange={(e) => setFormData({ ...formData, person: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-3 py-2.5 focus:border-blue-500 focus:outline-none"
                placeholder="Person's name"
              />
            </div>
          </div>
        )}

        {/* Category for expense/income */}
        {(formData.type === 'expense' || formData.type === 'income') && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <label className="block text-gray-700 font-semibold mb-2 text-sm flex items-center gap-1">
              <FiTag size={16} className="text-blue-500" />
              Category
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select category</option>
              {categories.filter(c => c.type === formData.type).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Transfer Fee */}
        {formData.type === 'transfer' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <label className="block text-gray-700 font-semibold mb-2 text-sm">Transfer Fee (BDT - optional)</label>
            <input
              type="number"
              step="1"
              value={formData.fee}
              onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:border-blue-500 focus:outline-none"
              placeholder="0"
            />
          </div>
        )}

        {/* Notes Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          <label className="block text-gray-700 font-semibold text-sm flex items-center gap-1">
            <MdOutlineNotes size={18} className="text-blue-500" />
            Notes & Details
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:border-blue-500 focus:outline-none"
            placeholder="Title (e.g., Grocery shopping)"
          />
          <textarea
            value={formData.details}
            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:border-blue-500 focus:outline-none resize-none"
            rows="3"
            placeholder="Additional notes, references, or reminders..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${isSubmitting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg active:scale-98'
            }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <FiCheckCircle size={20} />
              Add Transaction
            </>
          )}
        </button>
      </form>
    </div>
  );
}