import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';
import XafeWalletDashboard from './components/XafeWalletDashboard';
import AuthForm from './components/auth/AuthForm';
import ResetPasswordForm from './components/auth/ResetPasswordForm';
import ShareCertificateView from './components/ShareCertificateView';
import AccountSettings from './components/auth/AccountSettings';
import LandingPage from './components/LandingPage';
import CertificateDetails from './components/CertificateDetails';
import { Toaster } from './components/ui/toaster';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthForm />} />
          <Route path="/reset-password" element={<ResetPasswordForm />} />
          <Route path="/share/:token" element={<ShareCertificateView />} />
          <Route path="/account" element={
            <ProtectedRoute>
              <AccountSettings />
            </ProtectedRoute>
          } />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <XafeWalletDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/certificate/:certificateId" 
            element={
              <ProtectedRoute>
                <CertificateDetails />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
};

export default App;