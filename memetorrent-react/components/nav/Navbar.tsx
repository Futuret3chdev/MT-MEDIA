'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '@/components/theme/ThemeToggle';
import NoticeBell from '@/components/nav/NoticeBell';
import LiveScoreIcon from '@/components/nav/LiveScoreIcon';
import ProductTabBar from '@/components/nav/ProductTabBar';
import { LINKS } from '@/lib/constants';
import { Connection, PublicKey, VersionedTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import servicesData from '@/app/status/services.json';
import { useWallet } from '@solana/wallet-adapter-react';

export default function Navbar() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [portalUser, setPortalUser] = useState<{ username: string; license_key?: string | null; avatar_url?: string | null } | null>(null);

  useEffect(() => {
    fetch('/api/portal/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setPortalUser(d.user);
      })
      .catch(() => {});
  }, []);

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setFormData({ username: '', email: '', password: '' });
    setAuthError('');
    setAuthOpen(true);
  };

  const closeAuth = () => {
    setAuthOpen(false);
  };

  const logout = async () => {
    await fetch('/api/portal/logout', { method: 'POST', credentials: 'include' });
    setPortalUser(null);
    if (window.location.pathname.startsWith('/portal') || window.location.pathname.startsWith('/chat')) {
      window.location.href = '/';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBusy(true);
    setAuthError('');
    try {
      const path = authMode === 'login' ? '/api/portal/login' : '/api/portal/register';
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!data.ok) {
        setAuthError(data.error || 'Could not sign in.');
        return;
      }
      setPortalUser(data.user);
      closeAuth();
    } catch {
      setAuthError('Network error. Try again.');
    } finally {
      setAuthBusy(false);
    }
  };

  // Buy $MT form state (compact at top, below BUY $MT NOW)
  const [showBuyPanel, setShowBuyPanel] = useState(false);
  const buyPanelRef = useRef<HTMLDivElement>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const MT_MINT = 'ELywDcVX2WumHm4xEfqF8NdEKaeGCAaq9JmwtjE8pump';

  // Mobile detection for tips
  const [isMobile, setIsMobile] = useState(false);
  const [compact, setCompact] = useState(true);
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMobile(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
    }
    const mq = window.matchMedia('(max-width: 1100px), (pointer: coarse)');
    const apply = () => setCompact(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Wallet adapter for manual connect buttons (needed for mobile deeplinks for Phantom/Solflare/Backpack)
  const { select, connect: adapterConnect } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWalletForBuy = async (walletType: 'phantom' | 'solflare' | 'backpack') => {
    setIsConnecting(true);

    try {
      const adapterName = walletType === 'phantom' ? 'Phantom' : walletType === 'solflare' ? 'Solflare' : 'Backpack';
      select(adapterName as any);
      await adapterConnect();
      // Success if we get here (provider was available)
    } catch (error: any) {
      console.error('Adapter connect failed, attempting mobile deep link fallback:', error);
      // Fallback for mobile: deep link to open the dapp in the wallet's in-app browser
      // Using ref param to help wallets recognize it as a dapp link (prevents opening wallet home/swap instead of the site)
      if (/iPhone|Android/i.test(navigator.userAgent)) {
        const currentUrl = window.location.href;
        const ref = encodeURIComponent(window.location.origin);
        let deepLink = '';
        if (walletType === 'phantom') {
          deepLink = `https://phantom.app/ul/v1/browse/${encodeURIComponent(currentUrl)}?ref=${ref}`;
        } else if (walletType === 'solflare') {
          deepLink = `https://solflare.com/ul/v1/browse/${encodeURIComponent(currentUrl)}?ref=${ref}`;
        } else if (walletType === 'backpack') {
          deepLink = `https://backpack.app/ul/browse/${encodeURIComponent(currentUrl)}?ref=${ref}`;
        }
        if (deepLink) {
          window.location.href = deepLink;
          return; // page will reload in the wallet app/browser
        }
      }
      // Fallback: open install page
      const installUrls: Record<string, string> = {
        phantom: 'https://phantom.app/',
        solflare: 'https://solflare.com/',
        backpack: 'https://backpack.app/',
      };
      window.open(installUrls[walletType], '_blank');
    } finally {
      setIsConnecting(false);
    }
  };

  // Jupiter Plugin init effect (replaces all previous custom buy logic that was erroring)
  useEffect(() => {
    if (!showBuyPanel) {
      if (typeof window !== 'undefined' && (window as any).Jupiter && typeof (window as any).Jupiter.destroy === 'function') {
        try { (window as any).Jupiter.destroy(); } catch (e) {}
      }
      return;
    }

    const initJupiterPlugin = () => {
      if (typeof window !== 'undefined' && (window as any).Jupiter) {
        try {
          if (typeof (window as any).Jupiter.destroy === 'function') (window as any).Jupiter.destroy();
        } catch (e) {}
        (window as any).Jupiter.init({
          displayMode: "integrated",
          integratedTargetId: "jupiter-buy-container",
          formProps: {
            initialInputMint: "So11111111111111111111111111111111111111112",
            initialOutputMint: MT_MINT,
          },
          branding: {
            logoUri: "https://futuret3ch.com.au/assets/img/logo.png",
            name: "MT-ECOSYSTEM",
          },
        });
      }
    };

    if (typeof window !== 'undefined') {
      if (!(window as any).Jupiter) {
        const script = document.createElement('script');
        script.src = 'https://plugin.jup.ag/plugin-v1.js';
        script.async = true;
        script.onload = initJupiterPlugin;
        document.head.appendChild(script);
      } else {
        initJupiterPlugin();
      }
    }
  }, [showBuyPanel]);

  // Close buy panel on outside click (mouse + touch for mobile). User closes with X only - no auto scroll close.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (buyPanelRef.current && !buyPanelRef.current.contains(event.target as Node)) {
        setShowBuyPanel(false);
      }
    };

    if (showBuyPanel) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as any);
    };
  }, [showBuyPanel]);

  return (
    <header className="w-full border-b border-white/10">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-5 flex items-center justify-between text-sm">
        <Link href="/" className="font-semibold tracking-tight flex items-center gap-2 hover:opacity-80 transition">
          <span className="text-emerald-400">MT</span> ECO SYSTEM
        </Link>

        <div className="flex items-center gap-2 sm:gap-6 text-sm">
          <div className="mt-nav-compact ml-auto items-center gap-1.5">
            {portalUser ? (
              <>
                <NoticeBell />
                <a
                  href="/portal"
                  className="flex items-center gap-1 max-w-[7rem] opacity-90"
                  title="Account"
                >
                  {portalUser.avatar_url ? (
                    <img src={portalUser.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs">👤</span>
                  )}
                  <span className="truncate text-xs">@{portalUser.username}</span>
                </a>
                <button
                  type="button"
                  onClick={logout}
                  className="text-[11px] px-2 py-1 border border-white/20 rounded-full"
                >
                  Log out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => openAuth('login')}
                className="text-[11px] px-2 py-1 border border-white/20 rounded-full"
              >
                Log in
              </button>
            )}
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-xl leading-none"
              aria-label="Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
          {/* Desktop nav links - use /# so they work correctly even from /contact */}
          <div className="mt-nav-desktop items-center gap-5">
            <a href="/#tokenomics" className="opacity-70 hover:opacity-100">TOKENOMICS</a>
            <a href="/#utilities" className="opacity-70 hover:opacity-100">UTILITIES</a>
            <a href="/#tap" className="opacity-70 hover:opacity-100">TAP</a>
            <a href="/catalog" className="opacity-70 hover:opacity-100">GAMES</a>
            <a href="/developers" className="opacity-70 hover:opacity-100">API</a>
            <a
              href="/casino"
              title="$MT casino 18+"
              className="inline-flex items-center justify-center shrink-0"
              aria-label="$MT casino 18+"
            >
              <img
                src="/icons/casino-mt-18.png"
                alt="$MT 18+"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover"
              />
            </a>
            <a
              href="/claims"
              className="font-semibold text-black bg-emerald-400 hover:bg-emerald-300 px-3 py-1 rounded-full whitespace-nowrap"
            >
              CLAIM $MT
            </a>
            <a href="/software" className="opacity-70 hover:opacity-100">SOFTWARE</a>
            <a href="/contact" className="opacity-70 hover:opacity-100">CONTACT</a>
          </div>

          {/* Status icon (replaces Launch) — pulls live summary from /status services.json */}
          <a 
            href="/status" 
            className="mt-nav-desktop items-center gap-1.5 text-xs sm:text-sm px-3 py-1 rounded-xl border border-white/20 hover:bg-white/5"
            title="System Status"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-[#19d37e]"></span>
            <span>Status <span className="text-[#19d37e]">{servicesData.services.length}/7</span></span>
          </a>

        </div>
      </div>

      {/* Mobile nav menu - use /# so anchors work from subpages like /contact */}
      {compact && mobileMenuOpen && (
        <div className="border-t border-white/10 bg-black px-4 py-3 flex flex-col gap-2 text-sm">
          <a href="/#tokenomics" onClick={() => setMobileMenuOpen(false)} className="py-1 opacity-70 hover:opacity-100">TOKENOMICS</a>
          <a href="/#utilities" onClick={() => setMobileMenuOpen(false)} className="py-1 opacity-70 hover:opacity-100">UTILITIES</a>
          <a href="/#tap" onClick={() => setMobileMenuOpen(false)} className="py-1 opacity-70 hover:opacity-100">TAP</a>
          <a href="/catalog" onClick={() => setMobileMenuOpen(false)} className="py-1 opacity-70 hover:opacity-100">GAMES</a>
          <a href="/developers" onClick={() => setMobileMenuOpen(false)} className="py-1 opacity-70 hover:opacity-100">API</a>
          <a
            href="/casino"
            onClick={() => setMobileMenuOpen(false)}
            className="py-1 inline-flex items-center gap-2 opacity-90 hover:opacity-100"
          >
            <img src="/icons/casino-mt-18.png" alt="" className="w-8 h-8 rounded-lg object-cover" />
            $MT Casino 18+
          </a>
          <a
            href="/claims"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 my-1 text-center font-semibold text-black bg-emerald-400 rounded-full"
          >
            CLAIM $MT
          </a>
          <a href="/software" onClick={() => setMobileMenuOpen(false)} className="py-1 opacity-70 hover:opacity-100">SOFTWARE</a>
          <a href="/contact" onClick={() => setMobileMenuOpen(false)} className="py-1 opacity-70 hover:opacity-100">CONTACT</a>
          <a href="/#stats" onClick={() => setMobileMenuOpen(false)} className="py-1 opacity-70 hover:opacity-100">LIVE $MT</a>
          <button 
            onClick={() => { setMobileMenuOpen(false); setShowBuyPanel(true); }}
            className="py-1 text-left font-medium text-emerald-400 hover:opacity-100"
          >
            BUY $MT NOW
          </button>
          <a href={LINKS.wallet} target="_blank" onClick={() => setMobileMenuOpen(false)} className="py-1 font-medium">Infinite Wallet</a>
          <a href={portalUser ? '/chat' : '/login?next=/chat'} onClick={() => setMobileMenuOpen(false)} className="py-1 opacity-70 hover:opacity-100">CHAT</a>
          <a href="/status" onClick={() => setMobileMenuOpen(false)} className="py-1 opacity-70 hover:opacity-100">Status</a>
          <a href="/shield" onClick={() => setMobileMenuOpen(false)} className="mt-1 inline-flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-2 py-1.5">
            <img src="/icons/shield-mark.jpg" alt="" className="w-9 h-9 rounded-lg object-cover" />
            <span className="text-xs font-black tracking-[0.22em] text-cyan-300">SHIELD</span>
          </a>
          {!portalUser && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openAuth('register');
              }}
              className="py-1 text-left"
            >
              Register
            </button>
          )}
        </div>
      )}

      {/* Social icons row under the main nav links - using original Font Awesome icons in brand colors */}
      <div className="mt-nav-social border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center gap-x-3 sm:gap-x-5 text-xs sm:text-sm social-row">
          <a href="https://discord.gg/FxT7q7fpkT" target="_blank" rel="noopener" title="Discord" style={{ color: '#5865F2' }}>
            <i className="fab fa-discord text-lg sm:text-xl"></i>
          </a>
          <a href="https://twitter.com/MemeTorrent" target="_blank" rel="noopener" title="X / Twitter" style={{ color: '#1DA1F2' }}>
            <i className="fab fa-twitter text-lg sm:text-xl"></i>
          </a>
          <a href="https://t.me/+hxWzh5DZbfhiYWM9" target="_blank" rel="noopener" title="Telegram Portal" style={{ color: '#26A5E4' }}>
            <i className="fab fa-telegram text-lg sm:text-xl"></i>
          </a>

          <a
            href="/#stats"
            className="text-[11px] sm:text-xs font-medium text-emerald-400 hover:text-emerald-300 whitespace-nowrap"
          >
            LIVE $MT
          </a>
          <a
            href={portalUser ? '/chat' : '/login?next=/chat'}
            title="MT Chat"
            aria-label="MT Chat"
            className="flex items-center gap-1.5 shrink-0 text-[11px] sm:text-xs font-medium text-emerald-400 hover:text-emerald-300 whitespace-nowrap"
          >
            <img src="/icons/mt-chat.jpg" alt="" className="w-7 h-7 rounded-md object-cover" />
            CHAT
          </a>
          <button
            onClick={() => setShowBuyPanel(!showBuyPanel)}
            className="font-medium text-emerald-400 hover:text-emerald-300 transition cursor-pointer text-[11px] sm:text-xs px-2 py-1 border border-emerald-400/30 rounded whitespace-nowrap"
          >
            BUY $MT
          </button>

          <div className="flex items-center gap-2 shrink-0 pl-2 border-l border-white/20">
            <span className="opacity-60 shrink-0 text-[10px] sm:text-xs">CA</span>
            <button
              onClick={(e) => {
                navigator.clipboard.writeText(MT_MINT);
                const btn = e.currentTarget as HTMLElement;
                if (btn) btn.innerText = 'Copied!';
                setTimeout(() => { if (btn) btn.innerText = MT_MINT; }, 1500);
              }}
              className="font-mono text-emerald-400 hover:text-emerald-300 active:text-white transition text-left text-[10px] sm:text-xs whitespace-nowrap"
              title={`${MT_MINT} — tap to copy`}
            >
              {MT_MINT}
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            {portalUser ? (
              <>
                <LiveScoreIcon />
                <NoticeBell />
                <button
                  type="button"
                  onClick={() => (window.location.href = '/portal')}
                  className="opacity-80 hover:opacity-100 p-1 text-sm flex items-center gap-1.5 max-w-[7.5rem]"
                  title="Open portal"
                  aria-label="Account"
                >
                  {portalUser.avatar_url ? (
                    <img src={portalUser.avatar_url} alt="" className="w-6 h-6 rounded-md object-cover" />
                  ) : (
                    <span>👤</span>
                  )}
                  <span className="truncate text-xs">{portalUser.username}</span>
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="text-[11px] sm:text-xs opacity-80 hover:opacity-100 whitespace-nowrap px-2 py-1 border border-white/20 rounded"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <LiveScoreIcon />
                <button
                  type="button"
                  onClick={() => openAuth('login')}
                  className="text-[11px] sm:text-xs opacity-80 hover:opacity-100 whitespace-nowrap"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => openAuth('register')}
                  className="text-[11px] sm:text-xs px-2 py-1 border border-white/20 rounded whitespace-nowrap"
                >
                  Register
                </button>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>

      <ProductTabBar />

      {/* Compact buy form panel - shows just below BUY $MT NOW, hides on click off.
          Manual wallet connect (Phantom/Solflare/Backpack + deeplinks) is now primary so mobile actually works.
          Jupiter widget kept as secondary / visual option. */}
      {showBuyPanel && (
        <div ref={buyPanelRef} className="border-t border-white/10 bg-zinc-950/95 backdrop-blur max-w-[480px] md:max-w-[620px] ml-auto mr-4 shadow-2xl rounded-b-xl z-50">
          <div className="px-4 sm:px-6 py-3 sm:py-4 text-sm">
            {/* Header with close for mobile/desktop */}
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs sm:text-sm font-medium">Direct on-chain buy — self-custodial (SOL → $MT)</div>
              <button onClick={() => setShowBuyPanel(false)} className="text-xl leading-none opacity-60 hover:opacity-100 px-2" aria-label="Close buy panel">×</button>
            </div>

            {/* Manual connect buttons — only on mobile for deeplink support (Phantom/Solflare/Backpack).
                Uses polling + conditional deep link (v1 for Solflare) per wallet-adapter and your game logic.
                No clutter: no address, no Disconnect, no Quick Buy, no error messages in panel. */}
            {isMobile && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-2">
                  {(['phantom', 'solflare', 'backpack'] as const).map((name) => (
                    <button
                      key={name}
                      disabled={isConnecting}
                      onClick={() => connectWalletForBuy(name)}
                      className="px-3 py-1.5 text-xs rounded-2xl border border-white/20 hover:bg-white/5 active:bg-white/10 disabled:opacity-50"
                    >
                      {isConnecting ? 'Connecting...' : (name === 'phantom' ? 'Phantom' : name === 'solflare' ? 'Solflare' : 'Backpack')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Desktop: Gateway (THE WALLET IS THE GATEWAY) on LEFT expanding to fill gap, Jupiter swap box on RIGHT.
                Mobile: stacks naturally. */}
            <div className="flex flex-col md:flex-row gap-2 md:gap-3">
              {/* Gateway block on left, flex-1 to expand and fill left/center space on desktop */}
              <div className="md:flex-1">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-2 sm:p-3 text-xs sm:text-sm h-full">
                  <div className="text-emerald-400 text-[10px] sm:text-xs tracking-[3px]">THE WALLET IS THE GATEWAY</div>
                  <div className="font-semibold tracking-tight mt-0.5 text-sm sm:text-base">INFINITE WALLET<br />For infinite possibilities.<br />Truly ours.</div>
                  <ul className="mt-1 space-y-0.5 text-[10px] sm:text-xs opacity-80">
                    <li>• 100% self-built. No injected providers.</li>
                    <li>• Create, import, send, mint NFTs, earn &amp; spend Rockets.</li>
                    <li>• Native MT chain + Solana $MT + future bridges.</li>
                    <li>• Keys encrypted locally. Seed never leaves your device.</li>
                  </ul>
                  <a href={LINKS.wallet} target="_blank" className="mt-1 inline-block text-xs sm:text-sm text-emerald-400 hover:underline">OPEN INFINITE WALLET →</a>
                </div>
              </div>

              {/* Swap box (Jupiter plugin) on right — kept as visual / advanced alternative */}
              <div className="md:w-[280px]">
                <div id="jupiter-buy-container" style={{ width: '100%', height: '340px', borderRadius: '12px', overflow: 'hidden', background: '#000' }} />
                <div className="text-[10px] opacity-50 mt-1 text-center">Jupiter widget (alternative)</div>
              </div>
            </div>

            {/* CSS vars to theme the Jupiter plugin to match the site's dark + emerald look */}
            <style>{`
              :root {
                --jupiter-plugin-primary: 199, 242, 132;
                --jupiter-plugin-background: 0, 0, 0;
                --jupiter-plugin-primary-text: 232, 249, 255;
                --jupiter-plugin-warning: 251, 191, 36;
                --jupiter-plugin-interactive: 33, 42, 54;
                --jupiter-plugin-module: 16, 23, 31;
              }
            `}</style>
          </div>
        </div>
      )}

      {/* Auth Modal / Popup — clean, good looking, hidden until icon clicked */}
      <AnimatePresence>
        {authOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={closeAuth}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="text-xl font-semibold tracking-tight">Enter the MT Eco System</div>
                <button onClick={closeAuth} className="opacity-60 hover:opacity-100 text-xl leading-none">×</button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10 mb-6">
                <button
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 pb-3 text-sm font-medium ${authMode === 'login' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'opacity-70 hover:opacity-100'}`}
                >
                  Login
                </button>
                <button
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 pb-3 text-sm font-medium ${authMode === 'register' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'opacity-70 hover:opacity-100'}`}
                >
                  Register
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <div className="text-xs opacity-60 mb-1">Username</div>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="testuser1"
                      required
                      className="w-full bg-white/5 border border-white/15 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400/60"
                    />
                  </div>
                )}

                <div>
                  <div className="text-xs opacity-60 mb-1">Email</div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={authMode === 'login' ? "jason.c@futuret3ch.com.au" : "wallet@email.com"}
                    required
                    className="w-full bg-white/5 border border-white/15 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400/60"
                  />
                </div>

                <div>
                  <div className="text-xs opacity-60 mb-1">Password</div>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="•••••••••••"
                    required
                    className="w-full bg-white/5 border border-white/15 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400/60"
                  />
                </div>

                {authError && <div className="text-sm text-red-400">{authError}</div>}
                <button
                  type="submit"
                  disabled={authBusy}
                  className="mt-2 w-full py-3.5 rounded-2xl bg-white text-black font-semibold tracking-wider text-sm active:opacity-90 disabled:opacity-50"
                >
                  {authBusy ? 'PLEASE WAIT' : authMode === 'login' ? 'ENTER PORTAL' : 'CREATE ACCOUNT'}
                </button>
              </form>

              <div className="text-center text-[10px] mt-4 opacity-50">
                Same account on every Futuret3ch site. Your developer license stays on this profile.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
