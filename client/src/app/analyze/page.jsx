"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  Shield, FileText, Mail, MessageSquare, 
  AlertTriangle, GitMerge, Network, Briefcase,
  Target, Globe, Smartphone, Scan,
  BarChart3, Activity, Zap, Layers,
  CheckCircle, Copy, Check, Radio, Wifi, WifiOff,
  ChevronDown, X, Send, Eye, Brain,
  ShieldAlert, ShieldCheck, ShieldX, Play, Lock
} from 'lucide-react';
import { SERVER_URL_1 } from '@/utils/commonHelper';
import ENDPOINTS from '@/config/endpoints';
import ThreatGraphViewer from '@/components/ThreatGraphViewer';
import PatternResult from '@/components/PatternResult';

const INPUT_MODES = [
  { id: 'email_text', label: 'Email', icon: Mail, desc: 'Phishing, BEC, spoofed headers' },
  { id: 'sms_text', label: 'SMS', icon: Smartphone, desc: 'Text message scams' },
  { id: 'social_post', label: 'Social', icon: MessageSquare, desc: 'Misinformation, scams' },
  { id: 'url', label: 'URL', icon: Globe, desc: 'Malicious links' },
  { id: 'raw_text', label: 'Raw Text', icon: FileText, desc: 'Any content' },
];

const DEMO_SCENARIOS = [
  { id: 'phishing', label: 'Phishing Email', icon: Mail, color: '#e54b4f',
    content: `From: PayPal Security <security@paypa1-verify.com>\nSubject: Urgent: Verify Your Account Within 24 Hours\n\nDear Valued Customer,\n\nWe have detected unusual activity on your PayPal account. For your security, we have temporarily limited your account access.\n\nTo restore full access, please verify your identity immediately:\n\nhttps://paypa1-verify.com/account/restore?id=8f4a2b9c\n\nWARNING: Failure to verify within 24 hours will result in permanent account suspension.\n\nPlease update your password and billing information.\n\nPayPal Security Team` },
  { id: 'smishing', label: 'Smishing SMS', icon: Smartphone, color: '#f59e0b',
    content: `FedEx: Your package delivery failed. Reschedule & track here: http://bit.ly/3xK9mw2 Reply STOP to unsubscribe` },
  { id: 'scam', label: 'Crypto Scam', icon: Briefcase, color: '#8c5cff',
    content: `🚀 EXCLUSIVE CRYPTO OPPORTUNITY\n\nOur AI trading bot guarantees 350% returns in 14 days.\nMinimum investment: $500\nDeposit to: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2\n\nJoin 15,000+ investors! Limited spots remaining!` },
  { id: 'misinfo', label: 'Misinformation', icon: AlertTriangle, color: '#6aa9ff',
    content: `BREAKING: Mainstream media HIDING the truth! New study PROVES vaccines cause autism - but Big Pharma doesn't want you to know! Share before this gets deleted!` },
  { id: 'url', label: 'Malicious URL', icon: Globe, color: '#ff9f6b',
    content: `https://micros0ft-login.com/oauth/authorize?client_id=a8b2c4d&redirect=https://attacker-infra.net/harvest` },
  { id: 'aml', label: 'AML Transaction', icon: Layers, color: '#34b27b',
    content: `Transaction Network Analysis:\n\nEntity A (Corp XYZ Ltd) -> Loan $500,000 -> Entity B (Offshore Holdings Inc)\nEntity B -> Repayment $520,000 -> Entity A [7 days later]\nEntity A -> New Loan $550,000 -> Entity B [1 day later]\n\nPattern: Circular loan structure with increasing principal amounts\nRed Flags: Same parties, short cycles, offshore jurisdiction` },
];

const RESULT_TABS = [
  { id: 'verdict', label: 'AI Verdict', icon: Brain },
  { id: 'indicators', label: 'IOC Intel', icon: Target },
  { id: 'scoring', label: 'Risk Score', icon: BarChart3 },
  { id: 'graph', label: 'Graph', icon: Network },
  { id: 'pattern', label: 'Pattern', icon: Layers },
  { id: 'correlation', label: 'Correlation', icon: GitMerge },
];

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function RiskGauge({ score, size = 120 }) {
  const radius = (size - 16) / 2;
  const circumference = Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? '#e54b4f' : score >= 50 ? '#f59e0b' : score >= 25 ? '#6aa9ff' : '#34b27b';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size / 1.6 }}>
      <svg width={size} height={size / 1.6} viewBox={`0 0 ${size} ${size / 1.5}`}>
        <path d={`M 8,${size/1.5 - 4} A ${radius},${radius} 0 0,1 ${size - 8},${size/1.5 - 4}`}
              fill="none" stroke="var(--border)" strokeWidth="8" strokeLinecap="round" />
        <path d={`M 8,${size/1.5 - 4} A ${radius},${radius} 0 0,1 ${size - 8},${size/1.5 - 4}`}
              fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }} />
      </svg>
      <div className="absolute bottom-1 text-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-muted-foreground block -mt-1">/100</span>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }) {
  const styles = {
    critical: 'bg-red-500/15 text-red-400 border-red-500/40',
    high: 'bg-orange-500/15 text-orange-400 border-orange-500/40',
    medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/40',
    low: 'bg-green-500/15 text-green-400 border-green-500/40',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium border ${styles[severity] || styles.medium}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {severity?.toUpperCase() || 'UNKNOWN'}
    </span>
  );
}

function ReputationBadge({ reputation }) {
  const map = {
    malicious: { icon: ShieldX, className: 'text-red-400', label: 'MALICIOUS' },
    suspicious: { icon: ShieldAlert, className: 'text-yellow-400', label: 'SUSPICIOUS' },
    clean: { icon: ShieldCheck, className: 'text-green-400', label: 'CLEAN' },
    unknown: { icon: Shield, className: 'text-gray-400', label: 'UNKNOWN' },
  };
  const config = map[reputation] || map.unknown;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-mono font-medium ${config.className}`}>
      <Icon size={13} /> {config.label}
    </span>
  );
}

/* ─── Main Component ───────────────────────────────────────────────────────── */

export default function AnalyzePage() {
  // Analysis state
  const [selectedMode, setSelectedMode] = useState(INPUT_MODES[0]);
  const [content, setContent] = useState('');
  const [sourcePlatform, setSourcePlatform] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [correlation, setCorrelation] = useState(null);
  const [patternResult, setPatternResult] = useState(null);
  const [activeTab, setActiveTab] = useState('verdict');
  const [isBuildingGraph, setIsBuildingGraph] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Email monitor state
  const [emailConnected, setEmailConnected] = useState(false);
  const [emailMonitoring, setEmailMonitoring] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailConfig, setEmailConfig] = useState({ email: '', password: '', host: 'imap.gmail.com' });
  const [emailConnecting, setEmailConnecting] = useState(false);
  const [liveFeed, setLiveFeed] = useState([]);
  const eventSourceRef = useRef(null);

  // Connect to SSE feed
  useEffect(() => {
    const es = new EventSource(ENDPOINTS.emailFeed);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setLiveFeed(prev => [data, ...prev].slice(0, 30));
      } catch (err) { /* ignore */ }
    };

    es.addEventListener('status', (e) => {
      try {
        const status = JSON.parse(e.data);
        setEmailConnected(status.connected);
        setEmailMonitoring(status.monitoring);
      } catch (err) { /* ignore */ }
    });

    es.addEventListener('history', (e) => {
      try {
        const history = JSON.parse(e.data);
        setLiveFeed(history.slice(0, 30));
      } catch (err) { /* ignore */ }
    });

    return () => es.close();
  }, []);

  // ─── Handlers ──────────────────────────────────────────────────────────

  const loadDemo = (demo) => {
    setContent(demo.content);
    if (demo.id === 'phishing') setSelectedMode(INPUT_MODES[0]);
    else if (demo.id === 'smishing') setSelectedMode(INPUT_MODES[1]);
    else if (demo.id === 'url') setSelectedMode(INPUT_MODES[3]);
    else if (demo.id === 'misinfo' || demo.id === 'scam') setSelectedMode(INPUT_MODES[2]);
    else setSelectedMode(INPUT_MODES[4]);
  };

  const handleAnalyze = async () => {
    if (!content.trim()) { setError('Provide content to analyze'); return; }
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setActiveTab('verdict');

    try {
      const normalizeRes = await fetch(`${SERVER_URL_1}/api/threats/normalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_type: selectedMode.id, content: content.trim(),
          metadata: { source_platform: sourcePlatform || undefined },
        }),
      });
      if (!normalizeRes.ok) throw new Error('Normalization failed');
      const { artifact } = await normalizeRes.json();
      if (!artifact) throw new Error('Invalid normalization');

      const analyzeRes = await fetch(`${SERVER_URL_1}/api/threats/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artifact, options: { extract_iocs: true, extract_entities: true, score_content: true } }),
      });
      if (!analyzeRes.ok) throw new Error('Analysis failed');
      const { analysis } = await analyzeRes.json();
      if (!analysis) throw new Error('Invalid analysis result');

      setAnalysisResult(analysis);

      if (analysis?.classification) {
        const family = analysis.classification.primary_family;
        const FAMILY_TO_CODE = {
          phishing: 'T1', malicious_url: 'T2', malicious_attachment: 'T3',
          social_engineering_scam: 'T4', misinformation: 'T5', impersonation: 'T6',
        };
        setPatternResult({
          pattern_code: FAMILY_TO_CODE[family] || 'T?',
          pattern_label: `${FAMILY_TO_CODE[family] || 'T?'} - ${family?.replace(/_/g, ' ') || 'Unknown'}`,
          family: 'digital_threat',
          risk_score: (analysis.risk_score || 0) / 100,
          confidence: analysis.ml_classification?.confidence || 0.7,
          severity: analysis.ml_classification?.severity || 'medium',
          decision: (analysis.risk_score || 0) >= 75 ? 'highly_suspicious' : (analysis.risk_score || 0) >= 40 ? 'likely_suspicious' : 'not_suspicious',
          top_features: analysis.ml_classification?.top_features?.slice(0, 5) || [],
          explanation: `ML Model: ${analysis.ml_classification?.predicted_class || 'unknown'}. Risk: ${analysis.risk_score || 0}/100.`,
          all_results: [],
        });
      }

      buildGraph(analysis);
      correlateAnalysis(analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const buildGraph = async (analysis) => {
    if (!analysis) return;
    setIsBuildingGraph(true);
    try {
      const res = await fetch(`${SERVER_URL_1}/api/threats/graph`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.graph) setGraphData(data.graph);
      }
    } catch (e) { console.error('Graph error:', e); }
    finally { setIsBuildingGraph(false); }
  };

  const correlateAnalysis = async (analysis) => {
    if (!analysis) return;
    try {
      const res = await fetch(`${SERVER_URL_1}/api/threats/correlate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data) setCorrelation(data);
      }
    } catch (e) { console.error('Correlation error:', e); }
  };

  const handleReset = () => {
    setContent(''); setSourcePlatform('');
    setAnalysisResult(null); setGraphData(null);
    setCorrelation(null); setPatternResult(null);
    setActiveTab('verdict'); setError(null);
  };

  const handleEmailConnect = async () => {
    if (!emailConfig.email || !emailConfig.password) return;
    setEmailConnecting(true);
    try {
      const res = await fetch(ENDPOINTS.emailConnect, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailConfig),
      });
      const data = await res.json();
      if (data.success) {
        setEmailConnected(true);
        setEmailMonitoring(true);
        setShowEmailModal(false);
      } else {
        setError(data.error || 'Failed to connect');
      }
    } catch (err) {
      setError('Email connection failed: ' + err.message);
    } finally {
      setEmailConnecting(false);
    }
  };

  const handleEmailDisconnect = async () => {
    try {
      await fetch(ENDPOINTS.emailDisconnect, { method: 'POST' });
      setEmailConnected(false);
      setEmailMonitoring(false);
    } catch (err) { console.error(err); }
  };

  const copyResult = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(JSON.stringify(analysisResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Quick stats for analysis ──────────────────────────────────────────

  const ml = analysisResult?.ml_classification;
  const scoring = analysisResult?.scoring_breakdown;
  const iocSummary = analysisResult?.ioc_enrichment?.summary;

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                                 */
  /* ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Header Bar ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="text-[var(--primary)]" size={22} />
            <h1 className="text-base font-semibold text-[var(--foreground)] tracking-tight" style={{ fontFamily: 'var(--font-sans)' }}>
              Threat Intelligence Workbench
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Email Monitor Toggle */}
            <button
              onClick={() => emailConnected ? handleEmailDisconnect() : setShowEmailModal(true)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                emailMonitoring
                  ? 'bg-green-500/10 border-green-500/40 text-green-400'
                  : 'bg-[var(--secondary)] border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/30'
              }`}
            >
              {emailMonitoring ? <><Wifi size={13} className="animate-pulse" /> Live Monitoring</> : <><WifiOff size={13} /> Connect Email</>}
            </button>
            {analysisResult && (
              <button onClick={copyResult} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Export'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-6 py-6">
        {/* ── Live Feed Bar (when connected) ───────────────────────────── */}
        {liveFeed.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Radio size={14} className="text-green-400 animate-pulse" />
              <span className="text-xs font-mono text-[var(--muted-foreground)] uppercase tracking-wider">Live Threat Feed</span>
              <span className="text-[10px] font-mono bg-[var(--secondary)] px-2 py-0.5 rounded-full text-[var(--muted-foreground)]">{liveFeed.length}</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {liveFeed.slice(0, 8).map((item, i) => (
                <div key={i} className="flex-shrink-0 w-72 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/30 transition-all cursor-pointer"
                     onClick={() => { setAnalysisResult({ ...item.ml_classification, indicators: item.indicators, ioc_enrichment: { enriched: item.indicators, summary: item.indicator_summary }, ml_classification: item.ml_classification }); setActiveTab('verdict'); }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-[var(--muted-foreground)]">{new Date(item.timestamp).toLocaleTimeString()}</span>
                    <SeverityBadge severity={item.ml_classification?.severity || 'medium'} />
                  </div>
                  <p className="text-xs text-[var(--foreground)] font-medium truncate">{item.email?.subject || 'No Subject'}</p>
                  <p className="text-[11px] text-[var(--muted-foreground)] truncate mt-0.5">{item.email?.from || 'Unknown'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--primary)]">
                      {item.ml_classification?.predicted_class || '?'}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                      {item.ml_classification?.risk_score || 0}/100
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Two-Column Layout ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">

          {/* ── LEFT: Input + Results ──────────────────────────────────── */}
          <div className="space-y-6">
            {/* Mode Selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {INPUT_MODES.map(mode => {
                const Icon = mode.icon;
                const isActive = selectedMode.id === mode.id;
                return (
                  <button key={mode.id} onClick={() => setSelectedMode(mode)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all border ${
                      isActive ? 'bg-[var(--primary)]/10 border-[var(--primary)]/40 text-[var(--primary)]' : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]'
                    }`}>
                    <Icon size={14} /> {mode.label}
                  </button>
                );
              })}
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Paste ${selectedMode.desc?.toLowerCase() || 'content'} here for analysis...`}
                rows={8}
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50 focus:outline-none focus:border-[var(--primary)]/50 focus:ring-1 focus:ring-[var(--primary)]/20 transition-all resize-none font-mono"
              />
              <div className="absolute bottom-3 right-3 flex gap-2">
                {content && (
                  <button onClick={handleReset} className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors">
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Context + Analyze Button */}
            <div className="flex items-center gap-3">
              <input
                value={sourcePlatform}
                onChange={(e) => setSourcePlatform(e.target.value)}
                placeholder="Source (e.g., Gmail, WhatsApp)"
                className="flex-1 max-w-56 bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50 focus:outline-none focus:border-[var(--primary)]/30"
              />
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !content.trim()}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--primary)] text-[var(--primary-foreground)] hover:shadow-[0_0_24px_rgba(var(--primary-rgb),0.4)] hover:-translate-y-0.5"
              >
                {isAnalyzing ? (
                  <><div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> Analyzing...</>
                ) : (
                  <><Scan size={16} /> Analyze Threat</>
                )}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            {/* ── Results Section ──────────────────────────────────────── */}
            {analysisResult && (
              <div className="space-y-4">
                {/* Result Tabs */}
                <div className="flex items-center gap-1 border-b border-[var(--border)] pb-px overflow-x-auto">
                  {RESULT_TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap transition-all border-b-2 ${
                          isActive ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                        }`}>
                        <Icon size={13} /> {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tab Content */}
                <div className="min-h-[300px]">
                  {/* ML VERDICT */}
                  {activeTab === 'verdict' && (
                    <div className="space-y-4">
                      {/* Main Verdict Card */}
                      <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent" />
                        <div className="flex items-start gap-6">
                          <RiskGauge score={analysisResult.risk_score || scoring?.fused_score || 0} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <SeverityBadge severity={ml?.severity || 'medium'} />
                              {ml && (
                                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                                  {ml.predicted_class?.replace(/_/g, ' ')}
                                </span>
                              )}
                            </div>
                            <p className="text-lg font-semibold text-[var(--foreground)] mb-1">
                              {ml ? `Classified as ${ml.predicted_class?.replace(/_/g, ' ')}` : 'Analysis Complete'}
                            </p>
                            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                              {ml ? `Confidence: ${(ml.confidence * 100).toFixed(1)}% · Model Accuracy: ${(ml.model_accuracy * 100).toFixed(1)}%` : ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Scoring Breakdown */}
                      {scoring && (
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: 'Heuristic', score: scoring.heuristic_score, weight: '30%', icon: Activity },
                            { label: 'ML Model', score: scoring.ml_score, weight: '50%', icon: Brain },
                            { label: 'Intel', score: scoring.intel_score, weight: '20%', icon: Shield },
                          ].map(({ label, score: s, weight, icon: Icon }) => (
                            <div key={label} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                              <div className="flex items-center gap-1.5 mb-2">
                                <Icon size={13} className="text-[var(--muted-foreground)]" />
                                <span className="text-[11px] text-[var(--muted-foreground)]">{label}</span>
                                <span className="text-[10px] ml-auto font-mono text-[var(--muted-foreground)]">{weight}</span>
                              </div>
                              <p className="text-xl font-bold text-[var(--foreground)]">{s || 0}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* ML Top Features */}
                      {ml?.top_features?.length > 0 && (
                        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                          <h3 className="text-xs font-semibold text-[var(--foreground)] mb-3 flex items-center gap-1.5">
                            <Zap size={13} className="text-[var(--primary)]" /> Top Contributing Features
                          </h3>
                          <div className="space-y-2">
                            {ml.top_features.map((f, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <span className="text-[11px] font-mono text-[var(--muted-foreground)] w-40 truncate">{f.feature}</span>
                                <div className="flex-1 h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden">
                                  <div className="h-full bg-[var(--primary)] rounded-full transition-all duration-700" style={{ width: `${Math.min(f.value * 100, 100)}%` }} />
                                </div>
                                <span className="text-[10px] font-mono text-[var(--muted-foreground)] w-10 text-right">{f.value?.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* All Class Probabilities */}
                      {ml?.all_probabilities && (
                        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                          <h3 className="text-xs font-semibold text-[var(--foreground)] mb-3">Class Probabilities</h3>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(ml.all_probabilities).sort(([,a],[,b]) => b - a).map(([cls, prob]) => (
                              <div key={cls} className="flex items-center gap-2">
                                <span className="text-[11px] font-mono text-[var(--muted-foreground)] w-28 truncate">{cls}</span>
                                <div className="flex-1 h-1 bg-[var(--secondary)] rounded-full overflow-hidden">
                                  <div className="h-full bg-[var(--primary)] rounded-full" style={{ width: `${prob * 100}%` }} />
                                </div>
                                <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{(prob * 100).toFixed(1)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* IOC INTELLIGENCE */}
                  {activeTab === 'indicators' && (
                    <div className="space-y-4">
                      {iocSummary && (
                        <div className="grid grid-cols-4 gap-3">
                          {[
                            { label: 'Total', value: iocSummary.total, color: 'var(--foreground)' },
                            { label: 'Malicious', value: iocSummary.malicious, color: '#e54b4f' },
                            { label: 'Suspicious', value: iocSummary.suspicious, color: '#f59e0b' },
                            { label: 'Clean', value: iocSummary.clean, color: '#34b27b' },
                          ].map(s => (
                            <div key={s.label} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-center">
                              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                              <p className="text-[10px] font-mono text-[var(--muted-foreground)] mt-0.5">{s.label}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="space-y-2">
                        {(analysisResult.ioc_enrichment?.enriched || analysisResult.indicators || []).map((ioc, i) => (
                          <div key={i} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <ReputationBadge reputation={ioc.enrichment?.reputation || 'unknown'} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-mono text-[var(--foreground)] truncate">{ioc.value || ioc.normalized_value}</p>
                              <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                                {ioc.type} · {ioc.enrichment?.source || 'no enrichment'}
                                {ioc.enrichment?.details && typeof ioc.enrichment.details === 'string' ? ` · ${ioc.enrichment.details}` : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                        {(!analysisResult.ioc_enrichment?.enriched?.length && !analysisResult.indicators?.length) && (
                          <p className="text-xs text-[var(--muted-foreground)] text-center py-8">No indicators extracted</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* RISK SCORING */}
                  {activeTab === 'scoring' && (
                    <div className="space-y-4">
                      {analysisResult.risk_score != null && (
                        <div className="flex items-center justify-center py-6">
                          <RiskGauge score={analysisResult.risk_score} size={180} />
                        </div>
                      )}
                      {analysisResult.features && (
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(analysisResult.features || {}).filter(([k]) => typeof analysisResult.features[k] === 'object').map(([category, features]) => (
                            <div key={category} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                              <h4 className="text-[11px] font-semibold text-[var(--foreground)] mb-2 capitalize">{category.replace(/_/g, ' ')}</h4>
                              <div className="space-y-1">
                                {Object.entries(features || {}).slice(0, 6).map(([k, v]) => (
                                  <div key={k} className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-[var(--muted-foreground)] truncate max-w-[140px]">{k}</span>
                                    <span className="text-[10px] font-mono text-[var(--foreground)]">{typeof v === 'boolean' ? (v ? 'Yes' : 'No') : v}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {analysisResult.tone_analysis && (
                        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                          <h3 className="text-xs font-semibold text-[var(--foreground)] mb-3">Tone Analysis</h3>
                          <div className="grid grid-cols-3 gap-4">
                            <div><p className="text-[10px] text-[var(--muted-foreground)]">Urgency</p><p className="text-sm font-medium text-[var(--foreground)] capitalize">{analysisResult.tone_analysis.urgency_level}</p></div>
                            <div><p className="text-[10px] text-[var(--muted-foreground)]">Fear Level</p><p className="text-sm font-medium text-[var(--foreground)] capitalize">{analysisResult.tone_analysis.fear_level}</p></div>
                            <div><p className="text-[10px] text-[var(--muted-foreground)]">Signals</p><p className="text-sm font-medium text-[var(--foreground)]">{analysisResult.tone_analysis.impersonation_signals?.length || 0}</p></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* GRAPH */}
                  {activeTab === 'graph' && (
                    <div>
                      {isBuildingGraph ? (
                        <div className="flex items-center justify-center py-16">
                          <div className="w-6 h-6 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
                        </div>
                      ) : graphData ? (
                        <ThreatGraphViewer data={graphData} />
                      ) : (
                        <p className="text-xs text-[var(--muted-foreground)] text-center py-16">No graph data available</p>
                      )}
                    </div>
                  )}

                  {/* PATTERN */}
                  {activeTab === 'pattern' && (
                    <div>
                      {patternResult ? (
                        <PatternResult result={patternResult} />
                      ) : (
                        <p className="text-xs text-[var(--muted-foreground)] text-center py-16">No pattern classification available</p>
                      )}
                    </div>
                  )}

                  {/* CORRELATION */}
                  {activeTab === 'correlation' && (
                    <div className="space-y-4">
                      {correlation?.correlation ? (
                        <>
                          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                            <h3 className="text-xs font-semibold text-[var(--foreground)] mb-2">Campaign Correlation</h3>
                            <p className="text-xs text-[var(--muted-foreground)]">{JSON.stringify(correlation.correlation, null, 2)}</p>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-[var(--muted-foreground)] text-center py-16">No correlation data available</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Demo Scenarios ───────────────────────────────────── */}
          <div className="space-y-4">
            <h2 className="text-xs font-mono text-[var(--muted-foreground)] uppercase tracking-wider">Demo Scenarios</h2>
            <div className="space-y-2.5">
              {DEMO_SCENARIOS.map(demo => {
                const Icon = demo.icon;
                return (
                  <button key={demo.id} onClick={() => loadDemo(demo)}
                    className="w-full text-left p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/30 hover:-translate-y-0.5 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${demo.color}15`, border: `1px solid ${demo.color}30` }}>
                        <Icon size={15} style={{ color: demo.color }} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">{demo.label}</p>
                        <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 line-clamp-1">{demo.content.substring(0, 60)}...</p>
                      </div>
                      <Play size={13} className="ml-auto text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Analysis Summary (when result exists) */}
            {analysisResult && (
              <div className="space-y-4 mt-6">
                <h2 className="text-xs font-mono text-[var(--muted-foreground)] uppercase tracking-wider">Analysis Summary</h2>
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-3">
                  {ml && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-[var(--muted-foreground)]">Classification</span>
                        <span className="text-xs font-mono text-[var(--primary)]">{ml.predicted_class}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-[var(--muted-foreground)]">Confidence</span>
                        <span className="text-xs font-mono text-[var(--foreground)]">{(ml.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[var(--muted-foreground)]">Risk Score</span>
                    <span className="text-xs font-mono font-bold text-[var(--foreground)]">{analysisResult.risk_score || 0}/100</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[var(--muted-foreground)]">IOCs Found</span>
                    <span className="text-xs font-mono text-[var(--foreground)]">{iocSummary?.total || analysisResult.indicators?.length || 0}</span>
                  </div>
                  {iocSummary?.malicious > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-[var(--muted-foreground)]">Malicious IOCs</span>
                      <span className="text-xs font-mono text-red-400">{iocSummary.malicious}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[var(--muted-foreground)]">Claims</span>
                    <span className="text-xs font-mono text-[var(--foreground)]">{analysisResult.claims?.length || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Email Connect Modal ────────────────────────────────────────── */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-[var(--primary)]" />
                <h2 className="text-base font-semibold text-[var(--foreground)]">Connect Email Inbox</h2>
              </div>
              <button onClick={() => setShowEmailModal(false)} className="p-1 rounded-lg hover:bg-[var(--secondary)] text-[var(--muted-foreground)]">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[var(--muted-foreground)] mb-1.5 block">IMAP Host</label>
                <select
                  value={emailConfig.host}
                  onChange={(e) => setEmailConfig({ ...emailConfig, host: e.target.value })}
                  className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/50"
                >
                  <option value="imap.gmail.com">Gmail (imap.gmail.com)</option>
                  <option value="outlook.office365.com">Outlook (outlook.office365.com)</option>
                  <option value="imap.mail.yahoo.com">Yahoo (imap.mail.yahoo.com)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--muted-foreground)] mb-1.5 block">Email Address</label>
                <input
                  type="email"
                  value={emailConfig.email}
                  onChange={(e) => setEmailConfig({ ...emailConfig, email: e.target.value })}
                  placeholder="you@gmail.com"
                  className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50 focus:outline-none focus:border-[var(--primary)]/50"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted-foreground)] mb-1.5 block">App Password</label>
                <input
                  type="password"
                  value={emailConfig.password}
                  onChange={(e) => setEmailConfig({ ...emailConfig, password: e.target.value })}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50 focus:outline-none focus:border-[var(--primary)]/50"
                />
                <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5 flex items-center gap-1">
                  <Lock size={10} /> Generate at Google Account &rarr; Security &rarr; App Passwords
                </p>
              </div>
              <button
                onClick={handleEmailConnect}
                disabled={emailConnecting || !emailConfig.email || !emailConfig.password}
                className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] hover:shadow-[0_0_24px_rgba(var(--primary-rgb),0.4)] transition-all disabled:opacity-40"
              >
                {emailConnecting ? 'Connecting...' : 'Connect & Monitor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Loading Overlay ────────────────────────────────────────────── */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-center shadow-2xl">
            <div className="w-12 h-12 border-3 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-medium text-[var(--foreground)] mb-1">Analyzing Threat</p>
            <p className="text-xs text-[var(--muted-foreground)]">ML Model + IOC Enrichment + Heuristics</p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <span className="text-[10px] font-mono text-[var(--primary)] animate-pulse">Layer 1: Heuristics</span>
              <span className="text-[10px] font-mono text-[var(--primary)] animate-pulse" style={{ animationDelay: '0.3s' }}>Layer 2: ML Model</span>
              <span className="text-[10px] font-mono text-[var(--primary)] animate-pulse" style={{ animationDelay: '0.6s' }}>Layer 3: Intel</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
