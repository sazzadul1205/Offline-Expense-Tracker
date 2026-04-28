// src/App.jsx

// React
import { useEffect } from 'react';

// Router
import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';

// Database
import { initSampleData, migrateExistingTransactions } from './db/database';

// Icons
import { FiHome, FiPlusCircle, FiUsers, FiCreditCard, FiTag, FiBarChart2, FiSettings } from 'react-icons/fi';

// Components
import Settings from './components/Settings';
import Reports from './components/Reports';
import Accounts from './components/Accounts';
import Dashboard from './components/Dashboard';
import Categories from './components/Categories';
import DebtTracker from './components/DebtTracker';
import AddTransaction from './components/AddTransaction';

// Update Checker
import { useAutoUpdateCheck } from './utils/updateChecker';

// Swipe navigation
import { useSwipeable } from 'react-swipeable';

// Wrapper component to handle swipe navigation
function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', name: 'Home', icon: FiHome },
    { path: '/add', name: 'Add', icon: FiPlusCircle },
    { path: '/debt', name: 'Debt', icon: FiUsers },
    { path: '/accounts', name: 'Accounts', icon: FiCreditCard },
    { path: '/categories', name: 'Tags', icon: FiTag },
    { path: '/reports', name: 'Stats', icon: FiBarChart2 },
    { path: '/settings', name: 'More', icon: FiSettings }
  ];

  // Get current index
  const currentIndex = navItems.findIndex(item => item.path === location.pathname);

  // Handle swipe navigation
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentIndex < navItems.length - 1) {
        navigate(navItems[currentIndex + 1].path);
      }
    },
    onSwipedRight: () => {
      if (currentIndex > 0) {
        navigate(navItems[currentIndex - 1].path);
      }
    },
    trackMouse: true,
    trackTouch: true,
    preventScrollOnSwipe: true,
    delta: 50
  });

  // Handle dismiss swipe hint
  const dismissSwipeHint = () => {
    localStorage.setItem('swipeHintShown', 'true');
    const hintElement = document.getElementById('swipe-hint');
    if (hintElement) {
      hintElement.style.opacity = '0';
      setTimeout(() => {
        if (hintElement) hintElement.remove();
      }, 300);
    }
  };

  return (
    <div {...swipeHandlers} className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-40">
        <div className="px-5 py-4">
          <h1 className="text-xl font-bold tracking-tight">
            Expense Tracker
          </h1>
          <p className="text-xs text-blue-100 mt-0.5 opacity-90">
            Offline · Secure · Personal · ৳ BDT
          </p>
        </div>
      </header>

      {/* Swipe Hint - Shows only once */}
      {!localStorage.getItem('swipeHintShown') && (
        <div
          id="swipe-hint"
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down"
          style={{ zIndex: 999 }}
        >
          <div className="bg-gray-900 text-white px-4 py-2 rounded-full text-xs shadow-lg flex items-center gap-2">
            <span>👆</span>
            <span>Swipe left/right to navigate between pages</span>
            <button
              onClick={dismissSwipeHint}
              className="ml-2 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 py-4 max-w-md mx-auto pb-32">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<AddTransaction />} />
          <Route path="/debt" element={<DebtTracker />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-lg z-50"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)'
        }}
      >
        <div className="flex justify-around items-center max-w-md mx-auto px-2" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center py-2 px-2 transition-all duration-200 rounded-2xl ${isActive
                    ? 'text-blue-600 bg-blue-50 -mt-2 shadow-md scale-105'
                    : 'text-gray-500 hover:text-blue-500'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`text-xl transition-all duration-200 ${isActive ? 'text-blue-600' : 'text-gray-500'
                        }`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span className={`text-[10px] mt-0.5 font-medium transition-all duration-200 ${isActive ? 'text-blue-600' : 'text-gray-500'
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
  );
}

function App() {
  // Auto-check for updates on app start
  useAutoUpdateCheck();

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await initSampleData();
        await migrateExistingTransactions();
      } catch (error) {
        console.error('Database initialization error:', error);
      }
    };
    initializeDatabase();
  }, []);

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AppContent />
    </BrowserRouter>
  );
}

export default App;