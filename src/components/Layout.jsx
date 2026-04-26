import { useState } from 'react';
import { exportData, importData } from '../utils/backup';

export default function Layout({ children, title }) {
  const [showBackup, setShowBackup] = useState(false);

  const handleExport = async () => {
    await exportData();
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const result = await importData(file);
      alert(result.message);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">{title}</h1>
            <div className="relative">
              <button
                onClick={() => setShowBackup(!showBackup)}
                className="bg-blue-700 px-3 py-1 rounded-lg text-sm"
              >
                ☰ Menu
              </button>
              {showBackup && (
                <div className="absolute right-0 mt-2 bg-white text-gray-800 rounded-lg shadow-xl z-10 w-48">
                  <button
                    onClick={handleExport}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    📤 Export Backup
                  </button>
                  <label className="block w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer">
                    📥 Import Backup
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 pb-20">
        {children}
      </main>
    </div>
  );
}