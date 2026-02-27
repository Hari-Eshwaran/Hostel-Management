import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import apiFetch, { setToken } from "@/lib/apiClient";
import WelcomeModal from "@/components/WelcomeModal";
import { useTranslation } from 'react-i18next';

const Login = ({ setIsAuthenticated, setUserType }) => {
  const [activeTab, setActiveTab] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [userName, setUserName] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'te', label: 'తెలుగు' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'ml', label: 'മലയാളം' },
    { code: 'kn', label: 'ಕನ್ನಡ' },
  ];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    try { localStorage.setItem('appLanguage', lng); } catch (e) { /* ignore */ }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Call backend login
    (async () => {
      try {
        const payload = { email: formData.email, password: formData.password };
        const res = await apiFetch("/auth/login", { method: "POST", body: payload });
        // save token and update app state
        if (res.token) {
          setToken(res.token);
        }
        // Determine userType from the server response role
        const serverRole = res.role || activeTab;
        if (serverRole === 'superadmin') {
          setUserType('superadmin');
        } else if (serverRole === 'admin') {
          setUserType('admin');
        } else {
          setUserType('user');
        }
        setIsAuthenticated(true);

        // Check if tenant requires onboarding
        if (activeTab === "user" && res.requiresOnboarding) {
          navigate('/onboarding');
          return;
        }

        // Check if this is first login for tenants
        if (activeTab === "user" && res.isFirstLogin) {
          setUserName(res.name);
          setShowWelcomeModal(true);
        }
      } catch (err) {
        console.error(err);
        alert(err?.message || "Login failed");
      }
    })();
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTabChange = (tabType) => {
    setActiveTab(tabType);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full">
        {/* Language selector */}
        <div className="flex justify-end mb-4">
          <select
            aria-label="Select language"
            defaultValue={i18n.language || 'en'}
            onChange={(e) => changeLanguage(e.target.value)}
            className="border border-input rounded-md px-2 py-1 bg-background text-sm"
          >
            {languages.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>

        {/* Tab Selection */}
        <div className="flex mb-8 bg-muted rounded-lg p-1">
          <button
            type="button"
            onClick={() => handleTabChange("user")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "user"
                ? "bg-light-green text-light-green-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t('tabs.user')}
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("admin")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "admin"
                ? "bg-light-green text-light-green-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t('tabs.admin')}
          </button>
        </div>

        {/* Login Form */}
        <div className="bg-card shadow-card rounded-lg p-8 border border-border">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-center text-foreground">
              {t('heading.loginAs', { role: activeTab === 'admin' ? t('tabs.admin') : t('tabs.user') })}
            </h2>
            <p className="text-sm text-center text-muted-foreground mt-2">
              {activeTab === 'admin' ? t('subtext.accessAdmin') : t('subtext.accessAccount')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                {t('label.email')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t('placeholder.email')}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                {t('label.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={t('placeholder.password')}
                  className="w-full px-3 py-2 pr-10 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                {t('link.forgotPassword')}
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className={`w-full font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                activeTab === "admin"
                  ? "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500"
                  : "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500"
              }`}
            >
              {t('button.loginAs', { role: activeTab === 'admin' ? t('tabs.admin') : t('tabs.user') })}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t('helper.dontHaveAccount')}{" "}
              <Link to="/register" className="text-blue-600 hover:underline">
                {t('link.signUp')}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Welcome Modal for First Time Login */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        userName={userName}
      />
    </div>
  );
};

export default Login;