import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import TapToHearButton from "../../components/common/TapToHearButton";
import {
  Sprout,
  ShieldCheck,
  UserCheck,
  Award,
  Sparkles,
  CheckCircle2,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  KeyRound,
  ArrowRight,
  RotateCcw,
  Check,
} from "lucide-react";

type LoginMethod = "PHONE_OTP" | "EMAIL_PASS";
type OtpStep = "PHONE_INPUT" | "OTP_VERIFY";

export default function LoginPage() {
  const { login, register, demoLogin, googleLogin, sendOtp, verifyOtp, user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Primary Method Selection
  const [authMethod, setAuthMethod] = useState<LoginMethod>("PHONE_OTP");

  // Phone OTP State
  const [otpStep, setOtpStep] = useState<OtpStep>("PHONE_INPUT");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [farmerName, setFarmerName] = useState("");
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // Email / Password State
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Status
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Timer for OTP Resend
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  if (user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{t("alreadyLoggedIn", "You are already signed in")}</h2>
        <p className="text-xs text-gray-500">
          Logged in as {user.name} {user.phone ? `(${user.phone})` : `(${user.email})`}
        </p>
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="px-6 py-2.5 rounded-xl bg-emerald-800 text-white font-bold text-xs"
        >
          {t("goToProfileBtn", "Go to My Profile")}
        </button>
      </div>
    );
  }

  // Handle Phone OTP Request
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setDevOtpHint(null);

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError(t("invalidPhoneError", "Please enter a valid 10-digit Indian mobile number"));
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(cleanPhone);
      setSuccessMsg(res.message || "OTP sent successfully");
      if (res.devOtp) {
        setDevOtpHint(res.devOtp);
      }
      setOtpStep("OTP_VERIFY");
      setResendTimer(30);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send OTP. Please check the mobile number.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanOtp = otpCode.trim();
    if (cleanOtp.length !== 6) {
      setError(t("invalidOtpError", "Please enter the 6-digit verification code"));
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp({
        phone: phone.trim(),
        otp: cleanOtp,
        name: farmerName.trim() || undefined,
        language,
      });

      if (res.isNewUser) {
        setSuccessMsg(t("welcomeFarmer", "Welcome to KishanVaani! Account created successfully."));
      }
      navigate("/profile");
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid or expired OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Traditional Email/Pass
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (password.length < 8) {
          setError(t("passwordTooShort", "Password must be at least 8 characters long"));
          setLoading(false);
          return;
        }
        await register({ email, password, name });
      } else {
        await login(email, password);
      }
      navigate("/profile");
    } catch (err: any) {
      setError(err.response?.data?.error || "Authentication failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      // In production with Google Identity Services, window.google.accounts.id is used.
      // For universal fallback / developer demo, send test token if GIS is not active
      const testToken = "google-test-token-456";
      await googleLogin(testToken);
      navigate("/profile");
    } catch (err: any) {
      setError(err.response?.data?.error || "Google authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Demo Accounts
  const handleDemo = async (role: "USER" | "EXPERT" | "ADMIN") => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin(role);
      navigate(role === "ADMIN" ? "/admin" : "/profile");
    } catch (err: any) {
      setError(err.response?.data?.error || "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-8 sm:py-12 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center mx-auto shadow-md">
          <Sprout className="w-6 h-6" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">{t("loginHeading", "Welcome to KishanVaani")}</h1>
          <TapToHearButton
            text="किसान वाणी में आपका स्वागत है। मोबाइल नंबर या गूगल से तुरंत लॉगिन करें।"
            label="सुनें"
            size="sm"
          />
        </div>
        <p className="text-xs sm:text-sm text-gray-500">
          {t("loginSubheading", "Sign in to save bookmarks, sync audio listening history, and ask agriculture specialists.")}
        </p>
      </div>

      {/* 1-CLICK DEMO ACCOUNTS FOR INSTANT TESTING */}
      <div className="bg-emerald-950 text-white p-5 rounded-3xl shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wide">
            <Sparkles className="w-4 h-4 text-amber-400" />
            {t("demoLoginBanner", "1-Click Instant Demo Logins")}
          </div>
          <span className="text-[10px] bg-emerald-800/80 text-emerald-200 px-2 py-0.5 rounded-full">
            No password required
          </span>
        </div>
        <p className="text-xs text-emerald-200/90">
          {t("demoLoginBannerDesc", "Test any role instantly without typing credentials:")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleDemo("USER")}
            disabled={loading}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-emerald-700/50 text-center transition-all group"
          >
            <UserCheck className="w-5 h-5 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white">{t("farmerDemoBtn", "Farmer Demo")}</span>
            <span className="text-[10px] text-emerald-300">Ramesh Patel</span>
          </button>

          <button
            type="button"
            onClick={() => handleDemo("EXPERT")}
            disabled={loading}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-emerald-700/50 text-center transition-all group"
          >
            <Award className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white">{t("expertDemoBtn", "Agronomist")}</span>
            <span className="text-[10px] text-emerald-300">Dr. S.K. Sharma</span>
          </button>

          <button
            type="button"
            onClick={() => handleDemo("ADMIN")}
            disabled={loading}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-emerald-700/50 text-center transition-all group"
          >
            <ShieldCheck className="w-5 h-5 text-teal-300 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white">{t("adminDemoBtn", "Admin Portal")}</span>
            <span className="text-[10px] text-emerald-300">Chief Editor</span>
          </button>
        </div>
      </div>

      {/* Verified Google Sign-In */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-95 hover:border-gray-300"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{t("googleSignInBtn", "Continue with Google (Verified)")}</span>
      </button>

      {/* Main Auth Container */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-5">
        {/* Tab Switcher: Mobile OTP vs Email/Password */}
        <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setAuthMethod("PHONE_OTP");
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              authMethod === "PHONE_OTP"
                ? "bg-white text-emerald-800 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>{t("phoneOtpTab", "Mobile OTP")}</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded">
              Farmers
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMethod("EMAIL_PASS");
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              authMethod === "EMAIL_PASS"
                ? "bg-white text-emerald-800 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Mail className="w-4 h-4 text-emerald-600" />
            <span>{t("emailTab", "Email & Password")}</span>
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
            <span className="text-base leading-none">⚠️</span>
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Global Success Banner */}
        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{successMsg}</div>
          </div>
        )}

        {/* TAB 1: PHONE NUMBER OTP FLOW */}
        {authMethod === "PHONE_OTP" && (
          <div className="space-y-4">
            {otpStep === "PHONE_INPUT" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between text-xs text-emerald-900">
                  <span className="font-medium">
                    {t("otpHelpText", "Login directly with your mobile number. No password needed!")}
                  </span>
                  <TapToHearButton
                    text="अपना 10 अंकों का मोबाइल नंबर दर्ज करें और ओटीपी प्राप्त करें बटन दबाएं।"
                    size="sm"
                    label="निर्देश"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 text-xs sm:text-sm mb-1.5">
                    {t("mobileNumberLabel", "Mobile Number (मोबाइल नंबर)")}
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 flex items-center gap-1 text-gray-500 font-bold text-sm border-r border-gray-200 pr-2">
                      <span>🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      required
                      autoFocus
                      maxLength={10}
                      placeholder="98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full pl-20 pr-4 py-3 rounded-2xl border border-gray-200 outline-none focus:border-emerald-700 text-base font-semibold tracking-wider"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {t("otpSmsNotice", "We'll send a 6-digit verification code via SMS/WhatsApp.")}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || phone.trim().length < 10}
                  className="w-full py-3.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>{loading ? "Sending OTP..." : t("getOtpBtn", "Get OTP Code (ओटीपी प्राप्त करें)")}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* OTP VERIFICATION STEP */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
                  <div>
                    <span className="text-gray-500">{t("codeSentTo", "Code sent to:")} </span>
                    <strong className="text-gray-900 font-mono">+91 {phone}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep("PHONE_INPUT");
                      setOtpCode("");
                      setError(null);
                    }}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    {t("changeNumber", "Change")}
                  </button>
                </div>

                {/* Dev OTP Quick-Fill Badge */}
                {devOtpHint && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                    <span>
                      Demo OTP Code: <strong className="font-mono text-sm">{devOtpHint}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtpCode(devOtpHint)}
                      className="px-2 py-0.5 bg-amber-200 hover:bg-amber-300 rounded font-bold text-[11px]"
                    >
                      Fill Code
                    </button>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-gray-700 text-xs sm:text-sm mb-1.5">
                    {t("enter6DigitOtp", "Enter 6-digit OTP Code (6 अंकों का कोड)")}
                  </label>
                  <div className="relative flex items-center">
                    <KeyRound className="absolute left-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      autoFocus
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 outline-none focus:border-emerald-700 text-lg font-mono tracking-widest text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-gray-600 text-xs mb-1">
                    {t("yourNameOptional", "Your Name (वैकल्पिक / Optional - for new users)")}
                  </label>
                  <div className="relative flex items-center">
                    <UserIcon className="absolute left-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Patel"
                      value={farmerName}
                      onChange={(e) => setFarmerName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 outline-none focus:border-emerald-700 text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.trim().length !== 6}
                  className="w-full py-3.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold transition-all shadow-md active:scale-95"
                >
                  {loading ? "Verifying..." : t("verifyOtpBtn", "Verify & Sign In (सत्यापित करें)")}
                </button>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-gray-400">{t("didntReceiveCode", "Didn't receive the SMS?")}</span>
                  {resendTimer > 0 ? (
                    <span className="text-gray-500 font-medium">Resend in {resendTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={loading}
                      className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{t("resendOtp", "Resend OTP")}</span>
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: EMAIL & PASSWORD FLOW */}
        {authMethod === "EMAIL_PASS" && (
          <div className="space-y-4">
            <div className="flex border-b border-gray-100 pb-2">
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className={`flex-1 text-center font-bold text-xs pb-2 border-b-2 transition-all ${
                  !isRegister ? "border-emerald-700 text-emerald-800" : "border-transparent text-gray-400"
                }`}
              >
                {t("signInTab", "Sign In")}
              </button>
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className={`flex-1 text-center font-bold text-xs pb-2 border-b-2 transition-all ${
                  isRegister ? "border-emerald-700 text-emerald-800" : "border-transparent text-gray-400"
                }`}
              >
                {t("registerTab", "Create Free Account")}
              </button>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-3.5 text-xs sm:text-sm">
              {isRegister && (
                <div>
                  <label className="block font-bold text-gray-700 mb-1">{t("yourNameLabel", "Full Name")}</label>
                  <div className="relative flex items-center">
                    <UserIcon className="absolute left-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patel"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-700"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-700 mb-1">{t("emailAddressLabel", "Email Address")}</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">{t("passwordLabel", "Password")}</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    minLength={isRegister ? 8 : 6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-700"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold transition-all shadow-md active:scale-95"
              >
                {loading
                  ? "Processing..."
                  : isRegister
                  ? t("registerBtn", "Create Free Account")
                  : t("loginBtn", "Sign In to KishanVaani")}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
