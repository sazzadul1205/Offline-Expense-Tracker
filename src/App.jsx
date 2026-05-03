// src/App.jsx - Fixed version

import { useRef } from 'react';
import {
  BrowserRouter,
  NavLink,
  useLocation,
  useNavigate,
  Routes,
  Route
} from 'react-router-dom';

import {
  FiHome,
  FiPlusCircle,
  FiUsers,
  FiCreditCard,
  FiTag,
  FiBarChart2,
  FiSettings
} from 'react-icons/fi';

import Settings from './components/Settings';
import Reports from './components/Reports';
import Accounts from './components/Accounts';
import Dashboard from './components/Dashboard';
import Categories from './components/Categories';
import DebtTracker from './components/DebtTracker';
import AddTransaction from './components/AddTransaction';
import SettleDebt from './components/SettleDebt';
import EditTransaction from './components/EditTransaction';
import LoadingScreen from './components/LoadingScreen';

import { useAppInitialization } from './hooks/useAppInitialization';
import { useSwipeable } from 'react-swipeable';

/* -----------------------------
   PAGES
------------------------------*/
const pages = [
  { path: '/', name: 'Home', icon: FiHome, component: Dashboard },
  { path: '/add', name: 'Add', icon: FiPlusCircle, component: AddTransaction },
  { path: '/debt', name: 'Debt', icon: FiUsers, component: DebtTracker },
  { path: '/accounts', name: 'Accounts', icon: FiCreditCard, component: Accounts },
  { path: '/categories', name: 'Tags', icon: FiTag, component: Categories },
  { path: '/reports', name: 'Stats', icon: FiBarChart2, component: Reports },
  { path: '/settings', name: 'More', icon: FiSettings, component: Settings }
];

/* -----------------------------
   APP CONTENT (for slider pages)
------------------------------*/
function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  // Check if we're on special pages (no slider for these)
  const isSpecialPage = location.pathname === '/settle-debt' || location.pathname === '/edit-transaction';

  // If on special page, render full page without slider container
  if (isSpecialPage) {
    if (location.pathname === '/settle-debt') {
      return <SettleDebt />;
    }
    if (location.pathname === '/edit-transaction') {
      return <EditTransaction />;
    }
  }

  const currentIndex = Math.max(
    0,
    pages.findIndex(p => p.path === location.pathname)
  );

  const directionRef = useRef('forward');
  const prevIndexRef = useRef(currentIndex);

  // Update direction ref when index changes
  if (currentIndex !== prevIndexRef.current) {
    if (currentIndex > prevIndexRef.current) {
      directionRef.current = 'forward';
    } else if (currentIndex < prevIndexRef.current) {
      directionRef.current = 'backward';
    }
    prevIndexRef.current = currentIndex;
  }

  /* SWIPE - only on slider pages */
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (!isSpecialPage && currentIndex < pages.length - 1) {
        directionRef.current = 'forward';
        navigate(pages[currentIndex + 1].path);
      }
    },
    onSwipedRight: () => {
      if (!isSpecialPage && currentIndex > 0) {
        directionRef.current = 'backward';
        navigate(pages[currentIndex - 1].path);
      }
    },
    trackTouch: true,
    trackMouse: false,
    delta: 80,
    preventScrollOnSwipe: true
  });

  return (
    <div
      {...swipeHandlers}
      className="mobile-container"
    >
      {/* HEADER */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg pt-2">
        <div className="px-5 py-4">
          <h1 className="text-xl font-bold">Expense Tracker</h1>
          <p className="text-xs text-blue-100 opacity-90">
            Offline · Secure · Personal · ৳ BDT
          </p>
        </div>
      </header>

      {/* SLIDER */}
      <div className="slider-container">
        <div
          className="slider-track"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`
          }}
        >
          {pages.map((page) => {
            const Component = page.component;
            return (
              <div
                key={page.path}
                className="slider-page"
              >
                <div className="page-content-wrapper">
                  <Component />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM NAV - Enhanced Design */}
      <nav className="bottom-nav">
        <div className="bottom-nav-container">
          {pages.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
                {({ isActive }) => (
                  <div className="nav-item-content">
                    <Icon
                      size={22}
                      className={`nav-icon ${isActive ? 'active' : ''}`}
                    />
                    <span className={`nav-label ${isActive ? 'active' : ''}`}>
                      {item.name}
                    </span>
                    {isActive && <div className="nav-indicator" />}
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/* -----------------------------
   ROOT APP
------------------------------*/
function App() {
  const { isLoading, error } = useAppInitialization();

  // Show loading screen while initializing
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show error screen if initialization failed
  if (error) {
    return (
      <div className="error-screen">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Initialization Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
        <style>{`
          .error-screen {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
          }
          .error-container {
            text-align: center;
            padding: 30px;
            background: white;
            border-radius: 20px;
            max-width: 320px;
            margin: 20px;
          }
          .error-icon {
            font-size: 48px;
            margin-bottom: 20px;
          }
          .error-container h2 {
            color: #dc2626;
            margin-bottom: 10px;
          }
          .error-container p {
            color: #6b7280;
            margin-bottom: 20px;
          }
          .error-container button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 24px;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/settle-debt" element={<SettleDebt />} />
        <Route path="/edit-transaction" element={<EditTransaction />} />
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;