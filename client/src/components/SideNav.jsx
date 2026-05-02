import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { ebun_logo_light } from "../consts/images";
import clsx from "clsx";
import { getNavItemsByRole } from "../consts/sidebarItems";
import { useUserContext } from "../contexts/UserContext";
import AOS from "aos";
import "aos/dist/aos.css";
import { useUIContext } from "../contexts/UIContext";
import {
  TbLayoutSidebarLeftCollapse,
  TbLayoutSidebarLeftExpand,
  TbUserSquareRounded,
  TbLogout,
} from "react-icons/tb";
import LogoutModal from "./modals/LogoutModal";

const DotPattern = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern
        id="dots-sidenav"
        x="0"
        y="0"
        width="20"
        height="20"
        patternUnits="userSpaceOnUse"
      >
        <circle cx="2" cy="2" r="1.5" fill="white" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dots-sidenav)" />
  </svg>
);

function SideNav() {
  const location = useLocation();
  const { userData } = useUserContext();
  const { isSideBarOpen, setIsSideBarOpen } = useUIContext();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const filteredSidebar = getNavItemsByRole(userData.data.role);

  const handleNavigate = () => {
    if (window.innerWidth < 1024) setIsSideBarOpen(false);
  };

  useEffect(() => {
    AOS.init({ duration: 1000, once: true, easing: "ease-out-cubic" });
  }, []);

  return (
    <>
      <div
        className={clsx(
          "flex flex-col shrink-0 z-50",
          "bg-linear-to-b from-primaryColor to-slate-950 shadow-card3",
          "transition-[width] duration-300 ease-in-out",
          "overflow-x-hidden",
          "fixed top-0 left-0 h-screen lg:static lg:h-auto lg:min-h-screen",
          isSideBarOpen ? "w-[204px]" : "w-0 lg:w-[60px]",
        )}
      >
        <DotPattern />

        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <div
          className={clsx(
            "relative h-[60px] flex items-center justify-center px-3.5 gap-2 border-b border-white/10 shrink-0 z-10 overflow-hidden transition-all",
            {
              "delay-29": isSideBarOpen,
              "-mr-17 delay-50": !isSideBarOpen,
            },
          )}
          style={{
            background:
              "linear-gradient(155deg, #020617 0%, #001e36 55%, #0f172a 100%)",
          }}
        >
          <img
            src={ebun_logo_light}
            alt="Ebun logo"
            className="w-7.5 h-7.5 shrink-0 object-contain"
          />
          <div
            className={clsx(
              "shrink-0 transition-opacity duration-120 ease-in-out",
              isSideBarOpen ? "opacity-100" : "opacity-0",
            )}
          >
            <h1 className="font-semibold text-xl tracking-widest text-white uppercase whitespace-nowrap leading-snug">
              EBUN
            </h1>
            <p className="text-[8px] text-white/35 uppercase tracking-widest whitespace-nowrap leading-snug -mt-1">
              Freight OPC
            </p>
          </div>
        </div>

        {/* ── Nav Items ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-0.5 [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="flex flex-col py-2 px-[7px] gap-px">
            {filteredSidebar.map((content, index) => {
              if (content.type === "header") {
                return (
                  <div key={index} className="relative h-7 shrink-0 mt-2">
                    <span
                      className={clsx(
                        "absolute inset-0 flex items-center px-2",
                        "text-[9px] font-semibold text-white/28 uppercase tracking-[0.08em] whitespace-nowrap",
                        "transition-opacity duration-120 ease-in-out",
                        isSideBarOpen ? "opacity-100" : "opacity-0",
                      )}
                    >
                      {content.name}
                    </span>
                    <span
                      className={clsx(
                        "absolute top-1/2 -translate-y-1/2 left-2 right-2 h-px bg-white/10",
                        "transition-opacity duration-120 ease-in-out",
                        isSideBarOpen ? "opacity-0" : "opacity-100",
                      )}
                    />
                  </div>
                );
              }

              const isActive =
                location.pathname === content.path ||
                location.pathname.startsWith(content.path);

              return (
                <Link
                  key={index}
                  to={content.path}
                  onClick={handleNavigate}
                  title={!isSideBarOpen ? content.name : undefined}
                  className={clsx(
                    "w-full h-9 flex items-center rounded-md shrink-0",
                    "transition-[background,color] duration-150",
                    isActive
                      ? "bg-white/90 text-primaryColor font-medium"
                      : "text-white/60 hover:bg-white/7 hover:text-white/92",
                    "justify-start pl-3.5",
                    isSideBarOpen ? "gap-[9px] pr-2.5" : "gap-0 pr-0",
                  )}
                >
                  <span className="w-[18px] h-[18px] shrink-0 flex items-center justify-center">
                    {content.icon}
                  </span>
                  <span
                    className={clsx(
                      "text-[12.5px] whitespace-nowrap overflow-hidden",
                      "transition-[opacity,width] duration-120 ease-in-out",
                      isSideBarOpen ? "opacity-100 w-auto" : "opacity-0 w-0",
                    )}
                  >
                    {content.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Bottom: Profile + Logout (mobile only) + Toggle (desktop only) ── */}
        <div className="relative z-10 p-[7px] border-t border-white/8 shrink-0 flex flex-col gap-px">
          {/* My Profile — mobile only */}
          <Link
            to="/secure/my-profile"
            onClick={handleNavigate}
            title={!isSideBarOpen ? "My Profile" : undefined}
            className={clsx(
              "md:hidden w-full h-9 flex items-center rounded-md shrink-0",
              "text-white/60 hover:bg-white/7 hover:text-white/92",
              "transition-[background,color] duration-150",
              "justify-start pl-3.5",
              isSideBarOpen ? "gap-[9px] pr-2.5" : "gap-0 pr-0",
            )}
          >
            <span className="w-[18px] h-[18px] shrink-0 flex items-center justify-center">
              <TbUserSquareRounded size={16} />
            </span>
            <span
              className={clsx(
                "text-[12.5px] whitespace-nowrap overflow-hidden",
                "transition-[opacity,width] duration-120 ease-in-out",
                isSideBarOpen ? "opacity-100 w-auto" : "opacity-0 w-0",
              )}
            >
              My Profile
            </span>
          </Link>

          {/* Logout — mobile only */}
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            title={!isSideBarOpen ? "Logout" : undefined}
            className={clsx(
              "md:hidden w-full h-9 flex items-center rounded-md shrink-0",
              "text-red-400/80 hover:bg-red-500/10 hover:text-red-400",
              "transition-[background,color] duration-150 active:scale-95",
              "justify-start pl-3.5",
              isSideBarOpen ? "gap-[9px] pr-2.5" : "gap-0 pr-0",
            )}
          >
            <span className="w-[18px] h-[18px] shrink-0 flex items-center justify-center">
              <TbLogout size={16} />
            </span>
            <span
              className={clsx(
                "text-[12.5px] whitespace-nowrap overflow-hidden",
                "transition-[opacity,width] duration-120 ease-in-out",
                isSideBarOpen ? "opacity-100 w-auto" : "opacity-0 w-0",
              )}
            >
              Logout
            </span>
          </button>

          {/* Collapse toggle — desktop only */}
          <button
            onClick={() => setIsSideBarOpen((p) => !p)}
            className={clsx(
              "hidden lg:flex w-full h-[34px] items-center rounded-md cursor-pointer",
              "bg-white/4 border border-white/8 text-white/42 text-[12px]",
              "hover:bg-white/9 hover:text-white/78 transition-[background,color] duration-150",
              "justify-start pl-[15px]",
              isSideBarOpen ? "gap-[7px] pr-2.5" : "gap-0 pr-0",
            )}
          >
            {isSideBarOpen ? (
              <TbLayoutSidebarLeftCollapse size={16} className="shrink-0" />
            ) : (
              <TbLayoutSidebarLeftExpand size={16} className="shrink-0" />
            )}
            <span
              className={clsx(
                "whitespace-nowrap overflow-hidden transition-[opacity,width] duration-120 ease-in-out",
                isSideBarOpen ? "opacity-100 w-auto" : "opacity-0 w-0",
              )}
            >
              Collapse
            </span>
          </button>
        </div>
      </div>

      {/* Overlay: mobile only, closes sidebar on outside click */}
      {isSideBarOpen && (
        <div
          onClick={() => setIsSideBarOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/40 h-screen"
        />
      )}

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </>
  );
}

export default SideNav;
