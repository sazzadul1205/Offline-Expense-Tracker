// src/components/DebtTracker.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/database';

import { formatCurrency } from '../utils/currency';
import { showErrorAlert, showToast, showConfirmAlert } from '../utils/alerts';

import {
  FiUserCheck,
  FiUserX,
  FiCheckCircle,
  FiSmile,
  FiFrown,
  FiInfo
} from 'react-icons/fi';

export default function DebtTracker() {
  const navigate = useNavigate();

  const [isSettling, setIsSettling] = useState(false);
  const [debts, setDebts] = useState({ oweMe: [], iOwe: [] });
  const [accounts, setAccounts] = useState([]);

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

  // Navigate to settlement page
  const goToSettlePage = (debt, direction) => {
    if (accounts.length === 0) {
      showErrorAlert('No Accounts', 'Please create an account first in the Accounts tab');
      return;
    }
    navigate('/settle-debt', { state: { debt, direction } });
  };

  const totalOweMe = debts.oweMe.reduce((s, d) => s + d.amount, 0);
  const totalIOwe = debts.iOwe.reduce((s, d) => s + d.amount, 0);
  const net = totalOweMe - totalIOwe;

  const Card = ({ children }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      {children}
    </div>
  );

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
                    onClick={() => goToSettlePage(d, 'owe_me')}
                    disabled={accounts.length === 0}
                    className="text-xs mt-1 text-emerald-600 font-medium hover:text-emerald-700 disabled:opacity-50"
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
                    onClick={() => goToSettlePage(d, 'i_owe')}
                    disabled={accounts.length === 0}
                    className="text-xs mt-1 text-rose-600 font-medium hover:text-rose-700 disabled:opacity-50"
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
    </div>
  );
}