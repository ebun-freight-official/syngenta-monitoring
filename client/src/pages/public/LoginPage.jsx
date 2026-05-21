import React, { useEffect, useState } from "react";
import { FaLock, FaUser } from "react-icons/fa";
import useLogin from "../../hooks/useLogin";
import { Link } from "react-router";
import AOS from "aos";
import "aos/dist/aos.css";
import { ebun_logo_light } from "../../consts/images";

/* ─── Decorative SVG dot pattern ───────────────────────────────────────── */
const DotPattern = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-10"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern
        id="dots"
        x="0"
        y="0"
        width="24"
        height="24"
        patternUnits="userSpaceOnUse"
      >
        <circle cx="2" cy="2" r="1.5" fill="white" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dots)" />
  </svg>
);

/* ─── Freight route graphic — Station › Pickup Site › Destination ───────── */
const ROUTE_PATH = "M 60 300 C 150 285 150 210 100 188 C 50 166 50 90 145 62";

const MapRouteGraphic = () => (
  <svg
    className="absolute right-4 top-1/2 -translate-y-1/2 h-[68%] w-auto opacity-90"
    viewBox="0 0 220 320"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <style>{`
        @keyframes pr {
          0%   { r: 6;  stroke-opacity: .4; }
          100% { r: 16; stroke-opacity: 0;  }
        }
        @keyframes pr2 {
          0%   { r: 4;  stroke-opacity: .25; }
          100% { r: 13; stroke-opacity: 0;   }
        }
        .pr    { animation: pr  2.4s ease-out infinite; }
        .pr2   { animation: pr2 2.4s ease-out infinite 0.45s; }
        .pr-d  { animation: pr  2.4s ease-out infinite 0.7s; }
        .pr2-d { animation: pr2 2.4s ease-out infinite 1.1s; }
      `}</style>
    </defs>

    {/* Solid low-opacity route line */}
    <path
      d={ROUTE_PATH}
      fill="none"
      stroke="white"
      strokeOpacity=".18"
      strokeWidth="1"
      strokeLinecap="round"
    />

    {/* Moving dot — slow */}
    <circle r="2.2" fill="white" fillOpacity=".92">
      <animateMotion
        dur="10s"
        repeatCount="indefinite"
        calcMode="spline"
        keySplines="0.42 0 0.58 1"
        path={ROUTE_PATH}
      />
    </circle>

    {/* ── STATION ────────────────────────────────────────── */}
    <circle
      className="pr"
      cx="60"
      cy="300"
      r="6"
      fill="none"
      stroke="white"
      strokeWidth=".7"
    />
    <circle
      className="pr2"
      cx="60"
      cy="300"
      r="4"
      fill="none"
      stroke="white"
      strokeWidth=".4"
    />
    <circle cx="60" cy="300" r="2.2" fill="white" fillOpacity=".45" />
    <circle cx="60" cy="300" r="1.1" fill="white" fillOpacity="1" />
    <text
      x="60"
      y="313"
      textAnchor="middle"
      fill="white"
      fillOpacity=".5"
      fontSize="5"
      fontFamily="system-ui,sans-serif"
      fontWeight="700"
      letterSpacing="1"
    >
      STATION
    </text>

    {/* ── PICKUP SITE ────────────────────────────────────── */}
    <circle cx="100" cy="188" r="2.2" fill="white" fillOpacity=".35" />
    <circle cx="100" cy="188" r="1.1" fill="white" fillOpacity=".85" />
    <text
      x="113"
      y="192"
      fill="white"
      fillOpacity=".4"
      fontSize="4.5"
      fontFamily="system-ui,sans-serif"
      fontWeight="600"
      letterSpacing=".8"
    >
      PICKUP SITE
    </text>

    {/* ── DESTINATION ────────────────────────────────────── */}
    <circle
      className="pr-d"
      cx="145"
      cy="62"
      r="6"
      fill="none"
      stroke="white"
      strokeWidth=".7"
    />
    <circle
      className="pr2-d"
      cx="145"
      cy="62"
      r="4"
      fill="none"
      stroke="white"
      strokeWidth=".4"
    />
    <circle cx="145" cy="62" r="2.2" fill="white" fillOpacity=".45" />
    <circle cx="145" cy="62" r="1.1" fill="white" fillOpacity="1" />
    <text
      x="145"
      y="75"
      textAnchor="middle"
      fill="white"
      fillOpacity=".5"
      fontSize="5"
      fontFamily="system-ui,sans-serif"
      fontWeight="700"
      letterSpacing="1"
    >
      DESTINATION
    </text>
  </svg>
);

/* ─── Stat badge ─────────────────────────────────────────────────────────── */
const StatBadge = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <span className="text-white font-bold text-xl lg:text-2xl leading-none">
      {value}
    </span>
    <span className="text-white/60 text-xs mt-0.5 text-center">{label}</span>
  </div>
);

function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const { loginFunction, isLoading } = useLogin();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await loginFunction(formData);
  };

  useEffect(() => {
    sessionStorage.removeItem("userToken");
    AOS.init({ duration: 800, once: true, easing: "ease-out-cubic" });
  }, []);

  return (
    <>
      <div className="h-dvh flex flex-col md:flex-row bg-gray-50 overflow-x-hidden overflow-y-auto">
        {/* ── Brand Panel ──────────────────────────────────────────────────── */}
        <div
          className="relative flex flex-col justify-between overflow-hidden
                   md:w-[40%] lg:w-[45%] md:min-h-screen
                   p-8 sm:p-10 md:p-8 lg:p-14"
          style={{
            background:
              "linear-gradient(155deg, #020617 0%, #001e36 55%, #0f172a 100%)",
          }}
        >
          <DotPattern />
          <MapRouteGraphic />

          {/* Decorative circle blur */}
          <div
            className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, #475569 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-10 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, #334155 0%, transparent 70%)",
            }}
          />

          {/* Logo */}
          <div
            data-aos="fade-right"
            className="relative z-10 flex items-center max-md:justify-center max-lg:py-6 gap-3 py-4 sm:py-6 border-b border-white/10 max-sm:pt-0"
          >
            <img src={ebun_logo_light} alt="" className="w-10 sm:w-14" />
            <div>
              <h1 className="font-semibold text-3xl sm:text-4xl tracking-widest text-white uppercase">
                EBUN
              </h1>
              <p className="max-sm:text-xs text-sm text-white/50 -mt-1.5 uppercase tracking-widest sm:ml-0.5">
                Freight OPC
              </p>
            </div>
          </div>

          {/* Centre copy — visible md+ */}
          <div
            data-aos="fade-right"
            data-aos-delay="100"
            className="relative z-10 hidden md:block"
          >
            <div className="w-10 h-0.5 bg-white/40 mb-4 lg:mb-6" />
            <h2 className="text-white font-bold text-xl md:text-2xl lg:text-4xl leading-tight max-w-xs">
              Smarter Freight.
              <br />
              <span className="text-slate-300">Safer Roads.</span>
            </h2>
            <p className="mt-3 lg:mt-4 text-white/60 text-xs lg:text-sm leading-relaxed max-w-xs">
              "Where Safety Leads, Technology Drives, and Community Thrives"
            </p>
          </div>

          {/* Stats row — visible md+ */}
          <div
            data-aos="fade-up"
            data-aos-delay="200"
            className="relative z-10 hidden md:flex items-center gap-5 lg:gap-8
                     border-t border-white/20 pt-5 lg:pt-6"
          >
            <StatBadge value="Tech" label="Driven Operations" />
            <div className="w-px h-7 bg-white/20" />
            <StatBadge value="24/7" label="Operations" />
            <div className="w-px h-7 bg-white/20" />
            <StatBadge value="Est. 2026" label="Founded" />
          </div>

          {/* Mobile tagline */}
          <p className="relative z-10 md:hidden text-white/60 text-xs italic mt-4 text-center">
            "Where Safety Leads, Technology Drives, and Community Thrives"
          </p>
        </div>

        {/* ── Form Panel ───────────────────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16">
          <div data-aos="fade-left" className="w-full max-w-md">
            {/* Heading */}
            <div className="mb-6 lg:mb-8">
              <h2 className="text-gray-900 font-bold text-2xl sm:text-3xl">
                Welcome back
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">
                Sign in to your Ebun account to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xxs sm:text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div
                  className="group flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 lg:py-3.5 min-w-0
                            focus-within:border-primaryColor focus-within:ring-2 focus-within:ring-primaryColor/20
                            transition-all duration-200 shadow-sm"
                >
                  <FaUser className="text-gray-400 group-focus-within:text-primaryColor transition-colors shrink-0 text-sm" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    className="min-w-0 flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xxs sm:text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div
                  className="group flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 lg:py-3.5 min-w-0
                            focus-within:border-primaryColor focus-within:ring-2 focus-within:ring-primaryColor/20
                            transition-all duration-200 shadow-sm"
                >
                  <FaLock className="text-gray-400 group-focus-within:text-primaryColor transition-colors shrink-0 text-sm" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="min-w-0 flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="text-gray-400 hover:text-primaryColor transition-colors text-xs font-medium shrink-0 select-none"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 lg:py-3.5 rounded-xl font-semibold text-white text-sm
                         shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.99]
                         transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2.5 cursor-pointer"
                style={{
                  background:
                    "linear-gradient(135deg, #020617 0%, #001e36 60%, #0f172a 100%)",
                }}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-xs sm:loading-sm" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className="text-gray-400 text-xxs sm:text-xs text-center mt-6 lg:mt-8">
              © {new Date().getFullYear()} Ebun Freight OPC. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default LoginPage;
