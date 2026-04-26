import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AddTransaction from './components/AddTransaction';
import DebtTracker from './components/DebtTracker';
import Accounts from './components/Accounts';
import Categories from './components/Categories';
import Reports from './components/Reports';

function App() {
  const navItems = [
    { path: '/', name: 'Dashboard', icon: '📊', element: <Dashboard /> },
    { path: '/add', name: 'Add', icon: '➕', element: <AddTransaction /> },
    { path: '/debt', name: 'Debt', icon: '💰', element: <DebtTracker /> },
    { path: '/accounts', name: 'Accounts', icon: '💳', element: <Accounts /> },
    { path: '/categories', name: 'Categories', icon: '🏷️', element: <Categories /> },
    { path: '/reports', name: 'Reports', icon: '📈', element: <Reports /> }
  ];

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 pb-16">
        <Routes>
          {navItems.map(item => (
            <Route
              key={item.path}
              path={item.path}
              element={item.element}
            />
          ))}
        </Routes>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center p-2 ${isActive ? 'text-blue-600' : 'text-gray-500'}`
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </BrowserRouter>
  );
}

export default App;