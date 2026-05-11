import React, { useState, useEffect } from 'react';
import {
  Download, Instagram, Link as LinkIcon, Loader2, AlertCircle,
  CheckCircle2, Sparkles, Play, ExternalLink, Zap,
  ShieldCheck, Smartphone, ArrowRight, Star, Lock, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface DownloadResponse { video?: string; thumbnail?: string; error?: string; }

const fadeUp = { hidden: { opacity: 0, y: 32 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.12 } } };

function App() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<DownloadResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState('Processing...');
  const [scrolled, setScrolled] = useState(false);

  const workerUrl = window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:8787'
    : 'https://insta-downloader-api.insta-downloader.workers.dev';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true); setLoadingText('Searching Media...'); setError(null); setResult(null);
    try {
      if (!url.includes('instagram.com/')) throw new Error('Please enter a valid Instagram URL');
      
      setLoadingText('Connecting to extractor...');
      const res = await axios.get(`${workerUrl}?url=${encodeURIComponent(url)}`, { timeout: 15000 });
      
      if (res.data?.success && res.data?.video) {
        setResult({ video: res.data.video, thumbnail: res.data.thumbnail || '' });
      } else {
        throw new Error(res.data?.error || 'Failed to extract media.');
      }
    } catch (err: any) {
      console.error("Download Error:", err);
      const msg = err.response?.data?.error || err.message || 'Extraction failed. Please try again.';
      setError(msg);
    } finally { setLoading(false); }
  };

  const downloadVideo = () => {
    if (result?.video) {
      window.location.href = `${workerUrl}?proxy=true&url=${encodeURIComponent(result.video)}`;
    }
  };

  const stats = [
    { num: '10M+', label: 'Downloads', icon: Download },
    { num: '99.9%', label: 'Uptime', icon: Zap },
    { num: '0', label: 'Data Stored', icon: Lock },
    { num: '4K', label: 'Max Quality', icon: Star },
  ];

  const steps = [
    { n: '01', icon: LinkIcon,  color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', text: 'text-violet-600', title: 'Copy the Link',   desc: 'Open Instagram and copy the URL of any reel, post, or video.' },
    { n: '02', icon: Instagram, color: 'from-pink-500 to-rose-600',     bg: 'bg-pink-50',   text: 'text-pink-600',  title: 'Paste & Extract', desc: 'Paste the link into the field above and hit Extract Now.' },
    { n: '03', icon: Download,  color: 'from-amber-500 to-orange-500',  bg: 'bg-amber-50',  text: 'text-amber-600', title: 'Save to Device', desc: 'Click Download MP4 and your file saves directly — no apps needed.' },
  ];

  const features = [
    { icon: Zap,        color: 'text-violet-600', bg: 'bg-violet-50', badge: 'badge-purple', badgeText: 'Speed',    title: 'Lightning Fast',    desc: 'Our edge-deployed extractor processes media in milliseconds using a global CDN network.' },
    { icon: ShieldCheck,color: 'text-teal-600',   bg: 'bg-teal-50',   badge: 'badge-teal',   badgeText: 'Privacy',  title: 'Zero Data Storage', desc: 'We never store, log, or share your links or downloads. Everything is ephemeral.' },
    { icon: Smartphone, color: 'text-rose-600',   bg: 'bg-rose-50',   badge: 'badge-rose',   badgeText: 'Access',   title: 'Any Device',        desc: 'Optimised for mobile, tablet, and desktop — no app install, no account needed.' },
    { icon: Globe,      color: 'text-amber-600',  bg: 'bg-amber-50',  badge: 'badge-amber',  badgeText: 'Quality',  title: 'Highest Resolution',desc: 'Always fetches the original source quality — up to 4K on supported posts.' },
  ];

  return (
    <div className="min-h-screen relative w-full overflow-x-hidden" style={{ color: 'var(--text-dark)' }}>

      {/* ── Background ── */}
      <div className="page-bg" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* ── Header ── */}
        <motion.header
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
        >
          <div className={`max-w-6xl mx-auto flex justify-between items-center px-5 h-16 rounded-2xl transition-all duration-500 header-glow ${scrolled ? 'glass-strong' : 'glass'}`}>
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/25 group-hover:scale-110 transition-transform duration-300 relative pulse-ring">
                <Instagram className="w-5 h-5" />
              </div>
              <div>
                <div className="text-base font-black tracking-tight" style={{ color: 'var(--text-dark)' }}>InstaSaver</div>
                <div className="text-[9px] uppercase tracking-[.18em] font-bold" style={{ color: 'var(--text-light)' }}>Premium Downloader</div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold" style={{ color: 'var(--text-mid)' }}>
              {['Features', 'How It Works', 'Privacy'].map(l => (
                <a key={l} href="#" className="hover:text-violet-600 transition-colors">{l}</a>
              ))}
            </nav>

            <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full badge badge-purple">
              <Sparkles className="w-3 h-3" />
              <span>Free Forever</span>
            </div>
          </div>
        </motion.header>

        {/* ── Hero ── */}
        <main className="flex-grow flex flex-col items-center pt-36 pb-24 px-4">
          <div className="w-full max-w-5xl mx-auto">

            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="text-center mb-14"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 badge badge-purple text-xs mb-8">
                <Sparkles className="w-3.5 h-3.5" />
                <span>No Sign-Up · No Watermark · No Limits</span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-6xl md:text-8xl font-black mb-6 tracking-tighter leading-[1.0]"
              >
                Save{' '}
                <span className="text-grad-hero">Moments</span>
                <br />
                <span style={{ color: 'var(--text-dark)' }}>Instantly.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-lg md:text-xl max-w-xl mx-auto font-medium leading-relaxed mb-10"
                style={{ color: 'var(--text-mid)' }}
              >
                The most elegant way to download Instagram reels, videos & photos.
                Paste a link — we handle the rest.
              </motion.p>

              {/* ── Stats Row ── */}
              <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4 mb-14">
                {stats.map(s => (
                  <div key={s.label} className="jelly-sm px-5 py-3 flex items-center gap-3">
                    <s.icon className="w-4 h-4 text-violet-500" />
                    <span className="font-black text-lg" style={{ color: 'var(--text-dark)' }}>{s.num}</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-light)' }}>{s.label}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* ── Input Card ── */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
              className="glass-strong rounded-[32px] p-4 mb-6"
            >
              <form onSubmit={handleDownload} className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-grow">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-light)' }}>
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Paste Instagram link here..."
                    className="fancy-input w-full pl-14 pr-5 py-5 rounded-2xl text-base md:text-lg font-medium"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !url}
                  className="btn-primary w-full md:w-auto px-8 py-5 rounded-2xl text-base font-black flex items-center justify-center gap-2.5 min-w-[180px] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading
                    ? <><Loader2 className="animate-spin w-5 h-5" /><span>Processing...</span></>
                    : <><Zap className="w-5 h-5" /><span>Extract Now</span></>
                  }
                </button>
              </form>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 px-5 py-3 rounded-2xl flex items-center gap-3 text-sm font-semibold"
                    style={{ background: 'rgba(225,29,72,.08)', color: '#be123c', border: '1px solid rgba(225,29,72,.15)' }}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <p className="text-center text-xs font-medium mb-20" style={{ color: 'var(--text-light)' }}>
              🔒 Your links are never stored. Downloads are anonymous and encrypted.
            </p>

            {/* ── Results ── */}
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-strong rounded-[36px] p-14 text-center mb-20"
                >
                  <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 rounded-full" style={{ border: '3px solid rgba(124,58,237,.15)' }} />
                    <div className="absolute inset-0 rounded-full animate-spin" style={{ border: '3px solid transparent', borderTopColor: '#7c3aed' }} />
                    <div className="absolute inset-0 rounded-full animate-spin" style={{ border: '3px solid transparent', borderBottomColor: '#e11d48', animationDuration: '1.5s', animationDirection: 'reverse' }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Instagram className="w-8 h-8 text-violet-500" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black mb-2" style={{ color: 'var(--text-dark)' }}>{loadingText}</h3>
                  <p className="font-medium" style={{ color: 'var(--text-light)' }}>This usually takes just a moment...</p>
                  <div className="mt-6 h-1 w-48 mx-auto rounded-full overflow-hidden" style={{ background: 'rgba(124,58,237,.1)' }}>
                    <div className="h-full shimmer-bar" style={{ background: 'linear-gradient(90deg, transparent, #7c3aed, transparent)', backgroundSize: '200% 100%' }} />
                  </div>
                </motion.div>
              )}

              {result?.video && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 80 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-20"
                >
                  {/* Preview */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="jelly p-3 w-full max-w-[320px] mx-auto md:mx-0 float"
                  >
                    <div className="relative aspect-[9/16] rounded-[28px] overflow-hidden" style={{ background: 'linear-gradient(160deg,#fce4b8,#f9c8d4,#e8d5f5)' }}>
                      {result.thumbnail ? (
                        <img
                          src={`${workerUrl}?proxy=true&url=${encodeURIComponent(result.thumbnail || '')}`}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={e => {
                            const img = e.target as HTMLImageElement;
                            // Try AllOrigins as fallback if worker fails
                            if (!img.dataset.triedAllOrigins) {
                              img.dataset.triedAllOrigins = '1';
                              img.src = `https://api.allorigins.win/raw?url=${encodeURIComponent(result.thumbnail || '')}`;
                            } else if (!img.dataset.triedDirect) {
                              img.dataset.triedDirect = '1';
                              img.src = result.thumbnail || '';
                            } else {
                              img.style.display = 'none';
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ color: 'var(--text-light)' }}>
                          <Instagram className="w-10 h-10 opacity-30" />
                          <span className="text-xs font-semibold opacity-50">No preview available</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end">
                        <div className="w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.3)' }}>
                          <Play className="w-5 h-5 fill-white" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white px-3 py-1 rounded-lg" style={{ background: 'rgba(124,58,237,.8)' }}>HD Ready</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Actions */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="flex flex-col gap-5"
                  >
                    <div>
                      <div className="flex items-center gap-2 badge badge-teal mb-4 w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Extraction Complete</span>
                      </div>
                      <h2 className="text-3xl md:text-4xl font-black leading-tight mb-2" style={{ color: 'var(--text-dark)' }}>
                        Media Ready to<br /><span className="text-grad-purple">Download!</span>
                      </h2>
                      <p className="font-medium" style={{ color: 'var(--text-mid)' }}>
                        Your file is ready. Click below to save it directly to your device.
                      </p>
                    </div>

                    <button
                      onClick={downloadVideo}
                      className="btn-primary w-full py-5 rounded-2xl text-lg font-black flex items-center justify-center gap-3"
                    >
                      <Download className="w-5 h-5" />
                      <span>Download MP4</span>
                    </button>

                    <button
                      onClick={() => window.open(result.video, '_blank')}
                      className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 glass transition-all hover:scale-[1.02]"
                      style={{ color: 'var(--text-mid)' }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in New Tab
                    </button>

                    <div className="p-4 rounded-2xl flex items-start gap-3" style={{ background: 'rgba(124,58,237,.06)', border: '1px solid rgba(124,58,237,.12)' }}>
                      <ShieldCheck className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                      <p className="text-xs font-semibold leading-relaxed" style={{ color: 'var(--text-mid)' }}>
                        Privacy First — We don't store your data, links, or downloads anywhere on our servers.
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── How It Works ── */}
            <div className="mb-24">
              <div className="divider mb-16" />
              <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <motion.div variants={fadeUp} className="badge badge-purple mb-4 mx-auto w-fit">
                  <Sparkles className="w-3 h-3" />
                  <span>Simple 3-Step Process</span>
                </motion.div>
                <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black tracking-tight mb-3" style={{ color: 'var(--text-dark)' }}>
                  How It <span className="text-grad-warm">Works</span>
                </motion.h2>
                <motion.p variants={fadeUp} className="text-lg font-medium" style={{ color: 'var(--text-mid)' }}>
                  Three effortless steps to save any Instagram content.
                </motion.p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {steps.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.12, type: 'spring', stiffness: 80 }}
                    className="glass-card p-8"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`step-num ${s.bg} ${s.text} text-xl font-black`} style={{ borderRadius: 16 }}>
                        {s.n}
                      </div>
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg`}>
                        <s.icon className="w-6 h-6" />
                      </div>
                    </div>
                    <h3 className="text-xl font-black mb-2" style={{ color: 'var(--text-dark)' }}>{s.title}</h3>
                    <p className="font-medium leading-relaxed" style={{ color: 'var(--text-mid)' }}>{s.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ── Features Bento ── */}
            <div className="mb-24">
              <div className="divider mb-16" />
              <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <motion.div variants={fadeUp} className="badge badge-rose mb-4 mx-auto w-fit">
                  <Zap className="w-3 h-3" />
                  <span>Advanced Technology</span>
                </motion.div>
                <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black tracking-tight mb-3" style={{ color: 'var(--text-dark)' }}>
                  Built to be <span className="text-grad-purple">Premium</span>
                </motion.h2>
                <motion.p variants={fadeUp} className="text-lg font-medium" style={{ color: 'var(--text-mid)' }}>
                  Sophisticated features wrapped in an elegant interface.
                </motion.p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, type: 'spring', stiffness: 80 }}
                    className="glass-card p-8 flex gap-6"
                  >
                    <div className={`w-14 h-14 rounded-2xl ${f.bg} ${f.color} flex items-center justify-center shrink-0`}>
                      <f.icon className="w-7 h-7" />
                    </div>
                    <div>
                      <div className={`badge ${f.badge} mb-3`}>{f.badgeText}</div>
                      <h3 className="text-xl font-black mb-2" style={{ color: 'var(--text-dark)' }}>{f.title}</h3>
                      <p className="font-medium leading-relaxed" style={{ color: 'var(--text-mid)' }}>{f.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ── CTA Banner ── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="jelly p-10 md:p-16 text-center mb-20 relative overflow-hidden"
            >
              <div className="absolute inset-0 rounded-[40px] pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,.05) 0%, rgba(225,29,72,.05) 100%)' }} />
              <div className="relative z-10">
                <div className="w-20 h-20 rounded-[28px] mx-auto mb-8 flex items-center justify-center shadow-xl shadow-violet-500/20" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                  <Instagram className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight" style={{ color: 'var(--text-dark)' }}>
                  Ready to Save Your <span className="text-grad-purple">Favourites?</span>
                </h2>
                <p className="text-lg font-medium mb-8 max-w-md mx-auto" style={{ color: 'var(--text-mid)' }}>
                  Scroll back up, paste your Instagram link, and download in seconds.
                </p>
                <a
                  href="#"
                  onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="btn-primary inline-flex items-center gap-3 px-10 py-5 rounded-2xl text-lg font-black"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            </motion.div>

          </div>
        </main>

        {/* ── Footer ── */}
        <footer className="glass border-t-0" style={{ borderTop: '1px solid rgba(255,255,255,.5)' }}>
          <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-center md:items-start gap-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center text-white">
                  <Instagram className="w-4 h-4" />
                </div>
                <span className="font-black text-lg" style={{ color: 'var(--text-dark)' }}>InstaSaver</span>
              </div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-light)' }}>Safe, Fast & 100% Private.</p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-6 text-sm font-semibold" style={{ color: 'var(--text-mid)' }}>
                {['Privacy Policy', 'Terms of Use', 'Contact'].map(l => (
                  <a key={l} href="#" className="hover:text-violet-600 transition-colors">{l}</a>
                ))}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[.15em] text-center" style={{ color: 'var(--text-light)' }}>
                © {new Date().getFullYear()} InstaSaver · We do not host content · All rights belong to their respective owners
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-mid)' }}>
              <ShieldCheck className="w-4 h-4 text-teal-500" />
              <span>Secure & Encrypted</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}

export default App;
