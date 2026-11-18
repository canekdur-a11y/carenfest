import React, { useCallback, useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import {
  getConcepts,
  getCurrentUser,
  getMVs,
  getPromoPhotos,
  getUsers,
  logoutUser,
  subscribeStore,
  syncFromSupabaseIfEnabled,
} from './lib/storage';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { ToastContainer, ToastMessage } from './components/Toast';
import { AuthPage } from './pages/AuthPage';
import { MVsPage } from './pages/MVsPage';
import { MVDetailPage } from './pages/MVDetailPage';
import { ConceptsPage } from './pages/ConceptsPage';
import { ConceptDetailPage } from './pages/ConceptDetailPage';
import { AdminPage } from './pages/AdminPage';

export function App() {
  const [user, setUser] = useState(() => getCurrentUser());
  const [mvs, setMvs] = useState(() => getMVs());
  const [concepts, setConcepts] = useState(() => getConcepts());
  const [promos, setPromos] = useState(() => getPromoPhotos());
  const [users, setUsers] = useState(() => getUsers());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const refreshState = useCallback(() => {
    setUser(getCurrentUser());
    setMvs(getMVs());
    setConcepts(getConcepts());
    setPromos(getPromoPhotos());
    setUsers(getUsers());
  }, []);

  useEffect(() => {
    syncFromSupabaseIfEnabled();
    return subscribeStore(refreshState);
  }, [refreshState]);

  const notify = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  const handleLogout = () => {
    logoutUser();
    notify('Çıkış yapıldı.');
  };

  if (!user) {
    return (
      <>
        <ToastContainer toasts={toasts} />
        <AuthPage promos={promos} onNotify={notify} />
      </>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#0D0A09] text-white">
        <ToastContainer toasts={toasts} />
        <Navbar user={user} onLogout={handleLogout} />

        <Routes>
          <Route path="/" element={<Navigate to="/mv" replace />} />
          <Route path="/mv" element={<MVsPage mvs={mvs} currentUser={user} />} />
          <Route
            path="/mv/:id"
            element={<MVDetailPage mvs={mvs} currentUser={user} onNotify={notify} />}
          />
          <Route path="/konseptler" element={<ConceptsPage concepts={concepts} />} />
          <Route
            path="/konsept/:id"
            element={
              <ConceptDetailPage
                concepts={concepts}
                mvs={mvs}
                currentUser={user}
                onNotify={notify}
              />
            }
          />
          <Route
            path="/admin"
            element={
              user.isAdmin ? (
                <AdminPage
                  mvs={mvs}
                  concepts={concepts}
                  promos={promos}
                  users={users}
                  onNotify={notify}
                />
              ) : (
                <Navigate to="/mv" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/mv" replace />} />
        </Routes>

        <BottomNav isAdmin={user.isAdmin} />
      </div>
    </HashRouter>
  );
}

export default App;
