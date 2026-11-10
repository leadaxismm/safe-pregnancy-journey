import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { HelpProvider } from './components/HelpContext';
import { Layout } from './components/Layout';
import { trackVisitOnce } from './lib/analytics';
import Home from './pages/Home';
import Journey from './pages/Journey';
import RiskCheck from './pages/RiskCheck';
import Emergency from './pages/Emergency';
import WhereToFollow from './pages/WhereToFollow';
import Tips from './pages/Tips';
import Learn from './pages/Learn';
import About from './pages/About';
import NotFound from './pages/NotFound';

const Admin = lazy(() => import('./pages/admin/Admin'));
const DemoAdmin = lazy(() => import('./pages/admin/Admin').then(m => ({ default: m.DemoAdmin })));
import { config } from './lib/config';

function PatientApp() {
  const [resetKey, setResetKey] = useState(0);
  const onReset = useCallback(() => setResetKey(k => k + 1), []);
  useEffect(() => { trackVisitOnce(); }, []);
  return (
    <HelpProvider>
      <Layout onReset={onReset}>
        <Routes key={resetKey}>
          <Route path="/" element={<Home />} />
          <Route path="/journey" element={<Journey />} />
          <Route path="/risk" element={<RiskCheck />} />
          <Route path="/symptoms" element={<Navigate to="/emergency" replace />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/where" element={<WhereToFollow />} />
          <Route path="/tips" element={<Tips />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </HelpProvider>
  );
}

function Root() {
  const loc = useLocation();
  // Staff areas are separate from the patient app and never linked from patient pages.
  if (loc.pathname === '/admin-demo' && config.demoDashboard) {
    return <Suspense fallback={<div className="p-8 text-center">جارٍ التحميل…</div>}><DemoAdmin /></Suspense>;
  }
  if (loc.pathname === '/admin') {
    return <Suspense fallback={<div className="p-8 text-center">جارٍ التحميل…</div>}><Admin /></Suspense>;
  }
  return <PatientApp />;
}

export function App() {
  return (
    <HashRouter>
      <Root />
    </HashRouter>
  );
}
