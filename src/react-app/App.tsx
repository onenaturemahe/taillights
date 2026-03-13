import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@/react-app/context/AuthContext";
import { Footer } from "@/react-app/components/Footer";
import { ScrollToTop } from "@/react-app/components/ScrollToTop";
import HomePage from "@/react-app/pages/Home";
import Dashboard from "@/react-app/pages/Dashboard";
import LoginPage from "@/react-app/pages/Login";
import AdminPage from "@/react-app/pages/Admin";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen">
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
