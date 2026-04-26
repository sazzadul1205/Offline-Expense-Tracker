// src/components/Categories.jsx

// React
import { useState, useEffect } from 'react';

// Database
import { db } from '../db/database';

// Icons
import { MdCategory, MdOutlineLocalOffer } from 'react-icons/md';
import { FiPlus, FiTrash2, FiTag, FiTrendingDown, FiTrendingUp, FiX, FiCheck, FiFolder } from 'react-icons/fi';

// Utils
import { showErrorAlert, showToast, showConfirmAlert } from '../utils/alerts';

export default function Categories() {

  // State
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [totalIncomeCount, setTotalIncomeCount] = useState(0);
  const [totalExpenseCount, setTotalExpenseCount] = useState(0);
  const [newCategory, setNewCategory] = useState({ name: '', type: 'expense' });

  // Effects
  useEffect(() => {
    loadCategories();
  }, []);

  // Load categories
  const loadCategories = async () => {
    const cats = await db.categories.toArray();
    setCategories(cats);

    const expenseCount = cats.filter(c => c.type === 'expense').length;
    const incomeCount = cats.filter(c => c.type === 'income').length;
    setTotalExpenseCount(expenseCount);
    setTotalIncomeCount(incomeCount);
  };

  // Add category
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      showErrorAlert('Validation Error', 'Please enter category name');
      return;
    }
    await db.categories.add(newCategory);
    setNewCategory({ name: '', type: 'expense' });
    setShowForm(false);
    await loadCategories();
    showToast('Category added successfully!', 'success');
  };

  // Delete category
  const handleDeleteCategory = async (id) => {
    const hasTransactions = await db.transactions.where('categoryId').equals(id).count();

    if (hasTransactions > 0) {
      showErrorAlert('Cannot Delete', 'Cannot delete category with transaction history');
      return;
    }

    const confirmed = await showConfirmAlert('Delete Category', 'Are you sure you want to delete this category?', 'Delete', 'Cancel');
    if (confirmed) {
      await db.categories.delete(id);
      await loadCategories();
      showToast('Category deleted successfully', 'success');
    }
  };

  // Filter categories
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  // Format category name
  const formatCategoryName = (name) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Header Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <FiTrendingDown size={22} className="opacity-90" />
            <FiTag size={16} className="opacity-70" />
          </div>
          <div className="text-2xl font-bold">{totalExpenseCount}</div>
          <div className="text-xs mt-1 opacity-90">Expense Categories</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <FiTrendingUp size={22} className="opacity-90" />
            <FiTag size={16} className="opacity-70" />
          </div>
          <div className="text-2xl font-bold">{totalIncomeCount}</div>
          <div className="text-xs mt-1 opacity-90">Income Categories</div>
        </div>
      </div>

      {/* Add Category Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full bg-white border-2 border-dashed border-purple-300 text-purple-600 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
      >
        <FiPlus size={20} />
        {showForm ? 'Cancel' : 'Add New Category'}
      </button>

      {/* Add Category Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg p-5 animate-fade-in">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <MdCategory className="text-purple-600" size={20} />
            New Category Details
          </h3>

          <input
            type="text"
            placeholder="Category name (e.g., Groceries, Salary)"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-3 focus:border-purple-500 focus:outline-none transition-colors"
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => setNewCategory({ ...newCategory, type: 'expense' })}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${newCategory.type === 'expense'
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              <FiTrendingDown size={18} />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => setNewCategory({ ...newCategory, type: 'income' })}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${newCategory.type === 'income'
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              <FiTrendingUp size={18} />
              <span>Income</span>
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddCategory}
              className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <FiCheck size={18} />
              Save Category
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <FiX size={18} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Expense Categories Section */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100">
          <div className="flex items-center gap-2">
            <div className="bg-red-200 p-1.5 rounded-xl">
              <FiTrendingDown className="text-red-700" size={18} />
            </div>
            <h2 className="font-semibold text-red-800">Expense Categories</h2>
            <span className="ml-auto bg-red-200 text-red-800 text-xs px-2 py-1 rounded-full">
              {expenseCategories.length} total
            </span>
          </div>
          <p className="text-xs text-red-600 mt-1 ml-1">Track where your money goes</p>
        </div>

        <div className="divide-y divide-gray-100">
          {expenseCategories.map(cat => (
            <div key={cat.id} className="p-4 hover:bg-gray-50 transition-colors group">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 flex-1">
                  <div className="bg-red-100 p-2 rounded-xl">
                    <MdOutlineLocalOffer className="text-red-600" size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{formatCategoryName(cat.name)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Expense category</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {expenseCategories.length === 0 && (
            <div className="p-8 text-center">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <FiFolder className="text-gray-400" size={24} />
              </div>
              <div className="text-gray-500 font-medium">No expense categories</div>
              <div className="text-sm text-gray-400 mt-1">Add categories to organize expenses</div>
            </div>
          )}
        </div>
      </div>

      {/* Income Categories Section */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
          <div className="flex items-center gap-2">
            <div className="bg-green-200 p-1.5 rounded-xl">
              <FiTrendingUp className="text-green-700" size={18} />
            </div>
            <h2 className="font-semibold text-green-800">Income Categories</h2>
            <span className="ml-auto bg-green-200 text-green-800 text-xs px-2 py-1 rounded-full">
              {incomeCategories.length} total
            </span>
          </div>
          <p className="text-xs text-green-600 mt-1 ml-1">Track your earnings sources</p>
        </div>

        <div className="divide-y divide-gray-100">
          {incomeCategories.map(cat => (
            <div key={cat.id} className="p-4 hover:bg-gray-50 transition-colors group">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 flex-1">
                  <div className="bg-green-100 p-2 rounded-xl">
                    <MdOutlineLocalOffer className="text-green-600" size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{formatCategoryName(cat.name)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Income category</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {incomeCategories.length === 0 && (
            <div className="p-8 text-center">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <FiFolder className="text-gray-400" size={24} />
              </div>
              <div className="text-gray-500 font-medium">No income categories</div>
              <div className="text-sm text-gray-400 mt-1">Add categories to track earnings</div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Tips */}
      {categories.length > 0 && (
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-start gap-2">
            <div className="bg-blue-200 rounded-full p-1.5 mt-0.5">
              <FiTag className="text-blue-700" size={14} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-blue-800">Quick Tips</div>
              <div className="text-xs text-blue-700 mt-1">
                • Create specific categories for better tracking<br />
                • Use "Other" category for uncategorized transactions<br />
                • Categories with transactions cannot be deleted
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}