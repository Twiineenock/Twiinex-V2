import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import VendorDashboard from './pages/VendorDashboard';
import BuyerPaymentPage from './pages/BuyerPaymentPage';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <Router>
      <div className="min-height-screen bg-primary flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<VendorDashboard />} />
            <Route path="/pay/:id" element={<BuyerPaymentPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
