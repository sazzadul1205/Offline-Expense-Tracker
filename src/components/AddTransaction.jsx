// src/components/AddTransaction.jsx

import { useState, useEffect } from 'react';
import { db } from '../db/database';

import { applyTransaction } from '../utils/accountingRules';
import { formatCurrency } from '../utils/currency';
import { showToast, showErrorAlert, showLoadingAlert, closeLoadingAlert } from '../utils/alerts';
import { logError, ERROR_CATEGORIES, ERROR_LEVELS } from '../utils/errorLogger';

import {
  MdOutlineNotes
} from 'react-icons/md';

import {
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiRepeat,
  FiCreditCard,
  FiDollarSign,
  FiCalendar,
  FiClock,
  FiUser,
  FiTag,
  FiInfo,
  FiCheckCircle,
  FiArrowRight
} from 'react-icons/fi';

export default function AddTransaction() {

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const loadData = async () => {
    try {
      const a = await db.accounts.toArray();
      const c = await db.categories.toArray();

      setAccounts(a);
      setCategories(c);

      if (a[0]) {
        setFormData(prev => ({ ...prev, accountId: a[0].id }));
      }
    } catch (e) {
      console.error(e);
      showErrorAlert('Error', 'Failed to load data');
    }
  };

  const typeButtons = [
    { id: 'expense', label: 'Expense', icon: FiArrowDownCircle, color: 'red' },
    { id: 'income', label: 'Income', icon: FiArrowUpCircle, color: 'green' },
    { id: 'transfer', label: 'Transfer', icon: FiRepeat, color: 'blue' },
    { id: 'credit', label: 'Credit', icon: FiCreditCard, color: 'purple' }
  ];

  const inputClass =
    "w-full rounded-xl px-3 py-2.5 border border-gray-200 " +
    "focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition";

  const section =
    "bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3";

  return (
    <form className="space-y-4">

      {/* TYPE SELECTOR */}
      <div className={section}>
        <div className="text-sm font-semibold text-gray-700">
          Transaction Type
        </div>

        <div className="grid grid-cols-4 gap-2">
          {typeButtons.map(t => {
            const Icon = t.icon;
            const active = formData.type === t.id;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setFormData({ ...formData, type: t.id })}
                className={`
                  flex flex-col items-center justify-center gap-1
                  py-3 rounded-xl transition-all
                  ${active
                    ? `bg-${t.color}-500 text-white shadow-md scale-[0.98]`
                    : "bg-gray-50 hover:bg-gray-100 text-gray-600"
                  }
                `}
              >
                <Icon size={18} />
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* AMOUNT + DATE */}
      <div className={section}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
              <FiDollarSign size={14} /> Amount
            </label>
            <input
              className={inputClass + " text-lg font-semibold"}
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              placeholder="0"
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
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
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
            onChange={(e) =>
              setFormData({ ...formData, time: e.target.value })
            }
          />
        </div>
      </div>

      {/* ACCOUNT */}
      <div className={section}>
        {formData.type === 'transfer' ? (
          <>
            <div className="text-sm font-semibold">Transfer Accounts</div>

            <select
              className={inputClass}
              value={formData.fromAccountId}
              onChange={(e) =>
                setFormData({ ...formData, fromAccountId: e.target.value })
              }
            >
              <option>From account</option>
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
              value={formData.toAccountId}
              onChange={(e) =>
                setFormData({ ...formData, toAccountId: e.target.value })
              }
            >
              <option>To account</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </>
        ) : (
          <select
            className={inputClass}
            value={formData.accountId}
            onChange={(e) =>
              setFormData({ ...formData, accountId: e.target.value })
            }
          >
            <option>Select account</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} ({formatCurrency(a.balance)})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* CATEGORY */}
      {(formData.type === 'expense' || formData.type === 'income') && (
        <div className={section}>
          <select
            className={inputClass}
            value={formData.categoryId}
            onChange={(e) =>
              setFormData({ ...formData, categoryId: e.target.value })
            }
          >
            <option>Select category</option>
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

      {/* NOTES */}
      <div className={section}>
        <input
          className={inputClass}
          placeholder="Title"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
        />

        <textarea
          className={inputClass}
          rows={3}
          placeholder="Details"
          value={formData.details}
          onChange={(e) =>
            setFormData({ ...formData, details: e.target.value })
          }
        />
      </div>

      {/* SUBMIT */}
      <button
        type="submit"
        className="
          w-full py-3 rounded-xl font-semibold text-white
          bg-gradient-to-r from-blue-600 to-blue-700
          shadow-md hover:shadow-lg active:scale-[0.98]
          transition
        "
      >
        <FiCheckCircle className="inline mr-2" />
        Add Transaction
      </button>

    </form>
  );
}