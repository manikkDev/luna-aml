"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, User, Shield, Search, AlertTriangle, FileText, Network } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const navLinks = ["How It Works", "Capabilities", "Demo", "About"];

const investigationModes = [
  { icon: Shield, label: "Phishing & Impersonation", href: "/chat?mode=phishing" },
  { icon: Search, label: "Malicious URLs & Files", href: "/chat?mode=urls" },
  { icon: AlertTriangle, label: "Misinformation & Campaigns", href: "/chat?mode=campaigns" },
  { icon: FileText, label: "AML & Illicit Finance", href: "/chat?mode=aml" },
  { icon: Network, label: "Threat Graph Investigation", href: "/graph" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [modulesOpen, setModulesOpen] = useState(false);
  const profileRef = useRef(null);
  const modulesRef = useRef(null);
  const { user, isLoading, logout } = useAuth();
  const userAvatar = user?.profileImageUrl || user?.avatarUrl || null;
  const userName = user?.name || user?.username || user?.email || "Profile";
  const userInitial = userName.charAt(0).toUpperCase();
  const userEmail = user?.email || "";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (modulesRef.current && !modulesRef.current.contains(event.target)) {
        setModulesOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-border"
      style={{
        backdropFilter: "blur(12px)",
        background: "color-mix(in srgb, var(--background) 82%, transparent)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img
            src="/main-logo.png"
            alt="Luna Shield logo"
            className="h-8 w-8 rounded-md"
          />
          <span className="font-serif text-lg text-foreground font-semibold tracking-tight">
            Luna Shield
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(/\s/g, "-")}`}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link}
            </a>
          ))}
          
          {/* Investigation Modes Dropdown */}
          <div className="relative" ref={modulesRef}>
            <button
              type="button"
              onClick={() => setModulesOpen((open) => !open)}
              className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Investigation Modes
              <ChevronDown
                className={`h-3 w-3 transition-transform ${modulesOpen ? "rotate-180" : ""}`}
              />
            </button>

            {modulesOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-background/95 shadow-lg backdrop-blur">
                <div className="p-2">
                  {investigationModes.map((mode, index) => {
                    const Icon = mode.icon;
                    return (
                      <Link
                        key={index}
                        href={mode.href}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                        onClick={() => setModulesOpen(false)}
                      >
                        <Icon className="h-4 w-4 text-primary" />
                        <span>{mode.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          <a href="/analyze" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Analyze
          </a>
          <a href="/graph" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Graph
          </a>
          <a href="/chat" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Threat Investigator
          </a>
        </div>

        {/* CTA / Auth */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="#demo"
            className="btn-primary !py-2 !px-5 text-sm animate-glow-pulse"
          >
            View Demo
          </a>

          {!isLoading && (
            user ? (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  aria-label="Open profile menu"
                  title={userName}
                  onClick={() => setProfileOpen((open) => !open)}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-muted/70 px-2 text-foreground transition-colors hover:bg-muted"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-muted">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userName}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : userInitial ? (
                      <span className="text-sm font-semibold">{userInitial}</span>
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${profileOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-background/95 shadow-lg backdrop-blur">
                    <div className="border-b border-border px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">{userName}</p>
                      <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Login
              </Link>
            )
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M3 6h18M3 12h18M3 18h18" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t border-border px-6 py-4 flex flex-col gap-4"
          style={{ background: "color-mix(in srgb, var(--background) 94%, transparent)" }}
        >
          {navLinks.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(/\s/g, "-")}`}
              className="text-sm text-muted-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {link}
            </a>
          ))}
          
          {/* Mobile Investigation Modes */}
          <div className="border-t border-border pt-4 mt-4">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
              Investigation Modes
            </p>
            <div className="space-y-2">
              {investigationModes.map((mode, index) => {
                const Icon = mode.icon;
                return (
                  <Link
                    key={index}
                    href={mode.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span>{mode.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          
          <Link
            href="/analyze"
            className="text-sm text-muted-foreground"
            onClick={() => setMobileOpen(false)}
          >
            Analyze
          </Link>
          <Link
            href="/graph"
            className="text-sm text-muted-foreground"
            onClick={() => setMobileOpen(false)}
          >
            Graph
          </Link>
          <Link
            href="/chat"
            className="text-sm text-muted-foreground"
            onClick={() => setMobileOpen(false)}
          >
            Threat Investigator
          </Link>
          <a href="#demo" className="btn-primary !py-2 !px-5 text-sm text-center">
            View Demo
          </a>
          {!isLoading && (
            user ? (
              <div className="rounded-2xl border border-border">
                <div className="flex items-center gap-3 px-4 py-3">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="h-8 w-8 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                      {userInitial || <User className="h-4 w-4" />}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{userName}</p>
                    <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center justify-center gap-2 border-t border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-border px-4 py-2 text-center text-sm font-medium text-foreground transition-colors hover:bg-muted"
                onClick={() => setMobileOpen(false)}
              >
                Login
              </Link>
            )
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
