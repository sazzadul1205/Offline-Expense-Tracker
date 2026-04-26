// src/App.jsx

// React
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';

// Database
import { initSampleData, migrateExistingTransactions } from './db/database';

// Icons
import { FiHome, FiPlusCircle, FiUsers, FiCreditCard, FiTag, FiBarChart2 } from 'react-icons/fi';

// Components
import Reports from './components/Reports';
import Accounts from './components/Accounts';
import Dashboard from './components/Dashboard';
import Categories from './components/Categories';
import DebtTracker from './components/DebtTracker';
import AddTransaction from './components/AddTransaction';

function App() {
  useEffect(() => {
    const initializeDatabase = async () => {
      await initSampleData();
      await migrateExistingTransactions();
    };
    initializeDatabase();
  }, []);

  const navItems = [
    { path: '/', name: 'Home', icon: FiHome },
    { path: '/add', name: 'Add', icon: FiPlusCircle },
    { path: '/debt', name: 'Debt', icon: FiUsers },
    { path: '/accounts', name: 'Accounts', icon: FiCreditCard },
    { path: '/categories', name: 'Tags', icon: FiTag },
    { path: '/reports', name: 'Stats', icon: FiBarChart2 }
  ];

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
        {/* Mobile Header */}
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-40">
          <div className="px-5 py-4">
            <h1 className="text-xl font-bold tracking-tight">
              Expense Tracker
            </h1>
            <p className="text-xs text-blue-100 mt-0.5 opacity-90">
              Offline · Secure · Personal
            </p>
          </div>
        </header>

        {/* Main Content */}
        <div className="px-4 py-4 max-w-md mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddTransaction />} />
            <Route path="/debt" element={<DebtTracker />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </div>

        {/* Bottom Navigation - Mobile Optimized */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg z-50">
          <div className="flex justify-around items-center max-w-md mx-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex flex-col items-center py-2 px-3 transition-all duration-200 rounded-2xl ${isActive
                      ? 'text-blue-600 bg-blue-50 -mt-1 shadow-sm'
                      : 'text-gray-500 hover:text-blue-500'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`text-2xl transition-all duration-200 ${isActive ? 'text-blue-600' : 'text-gray-500'
                          }`}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      <span className={`text-xs mt-1 font-medium transition-all duration-200 ${isActive ? 'text-blue-600 scale-105' : 'text-gray-500'
                        }`}>
                        {item.name}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </BrowserRouter>
  );
}

export default App;