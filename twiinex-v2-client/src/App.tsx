
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import VendorDashboard from './pages/VendorDashboard';
import BuyerPaymentPage from './pages/BuyerPaymentPage';
import AuthPage from './pages/AuthPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/dashboard" element={<VendorDashboard />} />
        <Route path="/pay/:id" element={<BuyerPaymentPage />} />
      </Routes>
    </Router>
  );
}

export default App;
