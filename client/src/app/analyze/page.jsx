"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Shield, FileText, Mail, MessageSquare,
  AlertTriangle, GitMerge, Network, Briefcase,
  Target, Globe, Smartphone, Scan,
  BarChart3, Activity, Zap, Layers,
  CheckCircle, Copy, Check, Radio, Wifi, WifiOff,
  ChevronDown, ChevronRight, X, Send, Eye, Brain,
  ShieldAlert, ShieldCheck, ShieldX, Play, Lock,
  Download, Trash2, Clock, Search, Filter,
  History, Settings, Inbox, RotateCcw, ExternalLink,
  FileDown, ChevronLeft, MoreVertical, Bell, Archive
} from 'lucide-react';
import { SERVER_URL_1 } from '@/utils/commonHelper';
import ENDPOINTS from '@/config/endpoints';
import ThreatGraphViewer from '@/components/ThreatGraphViewer';
import PatternResult from '@/components/PatternResult';

/* ─── Constants ────────────────────────────────────────────────────────────── */

const INPUT_MODES = [
  { id: 'email_text', label: 'Email', icon: Mail, desc: 'Phishing, BEC, spoofed headers', color: '#e54b4f' },
  { id: 'sms_text', label: 'SMS', icon: Smartphone, desc: 'Text message scams', color: '#f59e0b' },
  { id: 'social_post', label: 'Social', icon: MessageSquare, desc: 'Misinformation, scams', color: '#8c5cff' },
  { id: 'url', label: 'URL', icon: Globe, desc: 'Malicious links', color: '#ff9f6b' },
  { id: 'raw_text', label: 'Raw Text', icon: FileText, desc: 'Any content', color: '#6aa9ff' },
];

const SIDEBAR_ITEMS = [
  { id: 'analyze', label: 'Analyze', icon: Scan, desc: 'Manual threat analysis' },
  { id: 'monitor', label: 'Live Monitor', icon: Radio, desc: 'Real-time email feed' },
  { id: 'history', label: 'History', icon: History, desc: 'Past analyses' },
];

const DEMO_SCENARIOS = [
  { id: 'phishing', label: 'Phishing Email', icon: Mail, color: '#e54b4f', mode: 'email_text',
    content: `From: PayPal Security <security@paypa1-verify.com>\nSubject: Urgent: Verify Your Account Within 24 Hours\n\nDear Valued Customer,\n\nWe have detected unusual activity on your PayPal account. For your security, we have temporarily limited your account access.\n\nTo restore full access, please verify your identity immediately:\n\nhttps://paypa1-verify.com/account/restore?id=8f4a2b9c\n\nWARNING: Failure to verify within 24 hours will result in permanent account suspension.\n\nPlease update your password and billing information.\n\nPayPal Security Team` },
  { id: 'smishing', label: 'Smishing SMS', icon: Smartphone, color: '#f59e0b', mode: 'sms_text',
    content: `FedEx: Your package delivery failed. Reschedule & track here: http://bit.ly/3xK9mw2 Reply STOP to unsubscribe` },
  { id: 'scam', label: 'Crypto Scam', icon: Briefcase, color: '#8c5cff', mode: 'social_post',
    content: `EXCLUSIVE CRYPTO OPPORTUNITY\n\nOur AI trading bot guarantees 350% returns in 14 days.\nMinimum investment: $500\nDeposit to: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2\n\nJoin 15,000+ investors! Limited spots remaining!` },
  { id: 'misinfo', label: 'Misinformation', icon: AlertTriangle, color: '#6aa9ff', mode: 'social_post',
    content: `BREAKING: Mainstream media HIDING the truth! New study PROVES vaccines cause autism - but Big Pharma doesn't want you to know! Share before this gets deleted!` },
  { id: 'malurl', label: 'Malicious URL', icon: Globe, color: '#ff9f6b', mode: 'url',
    content: `https://micros0ft-login.com/oauth/authorize?client_id=a8b2c4d&redirect=https://attacker-infra.net/harvest` },
  { id: 'aml', label: 'AML Pattern', icon: Layers, color: '#34b27b', mode: 'raw_text',
    content: `Transaction Network Analysis:\n\nEntity A (Corp XYZ Ltd) -> Loan $500,000 -> Entity B (Offshore Holdings Inc)\nEntity B -> Repayment $520,000 -> Entity A [7 days later]\nEntity A -> New Loan $550,000 -> Entity B [1 day later]\n\nPattern: Circular loan structure with increasing principal amounts\nRed Flags: Same parties, short cycles, offshore jurisdiction` },
];

const RESULT_TABS = [
  { id: 'verdict', label: 'AI Verdict', icon: Brain },
  { id: 'indicators', label: 'IOC Intel', icon: Target },
  { id: 'scoring', label: 'Risk Breakdown', icon: BarChart3 },
  { id: 'graph', label: 'Threat Graph', icon: Network },
  { id: 'pattern', label: 'Pattern', icon: Layers },
  { id: 'correlation', label: 'Correlation', icon: GitMerge },
];

/* ─── Inline Styles for Animations ─────────────────────────────────────────── */

const KEYFRAMES = `
@keyframes slideInRight { from { opacity:0; transform:translateX(24px) } to { opacity:1; transform:translateX(0) } }
@keyframes slideInUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
@keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
@keyframes scaleIn { from { opacity:0; transform:scale(0.92) } to { opacity:1; transform:scale(1) } }
@keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
@keyframes scan { 0%,100% { transform:translateY(0); opacity:0.5 } 50% { transform:translateY(100%); opacity:1 } }
@keyframes pulseRing { 0% { transform:scale(0.8); opacity:0.8 } 100% { transform:scale(2.2); opacity:0 } }
@keyframes progressFill { from { width:0% } to { width:100% } }
@keyframes toastIn { from { opacity:0; transform:translateY(16px) scale(0.95) } to { opacity:1; transform:translateY(0) scale(1) } }
`;

/* ─── Sub-Components ──────────────────────────────────────────────────────── */

function RiskGauge({ score, size = 140 }) {
  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? '#e54b4f' : score >= 50 ? '#f59e0b' : score >= 25 ? '#6aa9ff' : '#34b27b';
  const label = score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW';
  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size / 1.4 }}>
      <svg width={size} height={size / 1.5} viewBox={`0 0 ${size} ${size / 1.5}`}>
        <path d={`M 10,${size/1.5 - 6} A ${radius},${radius} 0 0,1 ${size - 10},${size/1.5 - 6}`}
              fill="none" stroke="var(--border)" strokeWidth="10" strokeLinecap="round" opacity="0.4" />
        <path d={`M 10,${size/1.5 - 6} A ${radius},${radius} 0 0,1 ${size - 10},${size/1.5 - 6}`}
              fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1), stroke 0.5s ease', filter: `drop-shadow(0 0 8px ${color}60)` }} />
      </svg>
      <div className="absolute bottom-2 text-center">
        <span className="text-3xl font-black tabular-nums" style={{ color, textShadow: `0 0 20px ${color}40` }}>{score}</span>
        <span className="text-[10px] font-mono font-bold block mt-0.5 tracking-widest" style={{ color }}>{label}</span>
      </div>
    </div>
  );
}

function SeverityBadge({ severity, large }) {
  const styles = {
    critical: { bg: 'rgba(229,75,79,0.12)', color: '#e54b4f', border: 'rgba(229,75,79,0.35)' },
    high: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.35)' },
    medium: { bg: 'rgba(106,169,255,0.12)', color: '#6aa9ff', border: 'rgba(106,169,255,0.35)' },
    low: { bg: 'rgba(52,178,123,0.12)', color: '#34b27b', border: 'rgba(52,178,123,0.35)' },
  };
  const s = styles[severity] || styles.medium;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-semibold border ${large ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[11px]'}`}
      style={{ background: s.bg, color: s.color, borderColor: s.border }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
      {(severity || 'unknown').toUpperCase()}
    </span>
  );
}

function ReputationBadge({ reputation }) {
  const map = {
    malicious: { icon: ShieldX, color: '#e54b4f', label: 'MALICIOUS' },
    suspicious: { icon: ShieldAlert, color: '#f59e0b', label: 'SUSPICIOUS' },
    clean: { icon: ShieldCheck, color: '#34b27b', label: 'CLEAN' },
    unknown: { icon: Shield, color: '#666', label: 'UNKNOWN' },
  };
  const c = map[reputation] || map.unknown;
  const Icon = c.icon;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold" style={{ color: c.color }}>
      <Icon size={13} /> {c.label}
    </span>
  );
}

function SkeletonCard({ lines = 3 }) {
  return (
    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]" style={{ animation: 'fadeIn 0.3s ease' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 rounded-full mb-2.5 last:mb-0"
             style={{ width: `${60 + Math.random() * 30}%`, background: 'linear-gradient(90deg, var(--secondary) 25%, var(--border) 50%, var(--secondary) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite ease-in-out' }} />
      ))}
    </div>
  );
}

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const colors = { success: '#34b27b', error: '#e54b4f', info: '#6aa9ff' };
  const icons = { success: CheckCircle, error: AlertTriangle, info: Bell };
  const Icon = icons[type];
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl"
         style={{ background: 'var(--card)', borderColor: `${colors[type]}50`, animation: 'toastIn 0.3s ease' }}>
      <Icon size={16} style={{ color: colors[type] }} />
      <span className="text-sm text-[var(--foreground)]">{message}</span>
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 opacity-60" style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(52,178,123,0.08)', border: '1px solid rgba(52,178,123,0.15)' }}>
        <Icon size={28} className="text-[var(--primary)]" />
      </div>
      <p className="text-sm font-medium text-[var(--foreground)] mb-1">{title}</p>
      <p className="text-xs text-[var(--muted-foreground)] max-w-xs text-center">{subtitle}</p>
    </div>
  );
}

/* ─── Report Generator ─────────────────────────────────────────────────────── */

function generateReport(analysis) {
  const ml = analysis?.ml_classification;
  const scoring = analysis?.scoring_breakdown;
  const iocData = analysis?.ioc_enrichment;
  const now = new Date().toLocaleString();
  let report = '';
  report += '═══════════════════════════════════════════════════\n';
  report += '         LUNA SHIELD — THREAT ANALYSIS REPORT\n';
  report += '═══════════════════════════════════════════════════\n\n';
  report += `Report Generated: ${now}\n`;
  report += `Analysis ID: ${analysis?.analysis_id || 'N/A'}\n\n`;
  report += '─── VERDICT ──────────────────────────────────────\n\n';
  if (ml) {
    report += `  Classification:  ${(ml.predicted_class || 'unknown').toUpperCase()}\n`;
    report += `  Confidence:      ${(ml.confidence * 100).toFixed(1)}%\n`;
    report += `  Severity:        ${(ml.severity || 'unknown').toUpperCase()}\n`;
    report += `  Risk Score:      ${analysis.risk_score || 0}/100\n\n`;
  }
  if (scoring) {
    report += '─── SCORING BREAKDOWN ────────────────────────────\n\n';
    report += `  Heuristic Score: ${scoring.heuristic_score || 0} (Weight: 30%)\n`;
    report += `  ML Model Score:  ${scoring.ml_score || 0} (Weight: 50%)\n`;
    report += `  Intel Score:     ${scoring.intel_score || 0} (Weight: 20%)\n`;
    report += `  Fused Score:     ${scoring.fused_score || analysis.risk_score || 0}\n\n`;
  }
  if (ml?.all_probabilities) {
    report += '─── CLASS PROBABILITIES ──────────────────────────\n\n';
    Object.entries(ml.all_probabilities).sort(([, a], [, b]) => b - a).forEach(([cls, prob]) => {
      const bar = '█'.repeat(Math.round(prob * 30));
      report += `  ${cls.padEnd(18)} ${bar} ${(prob * 100).toFixed(1)}%\n`;
    });
    report += '\n';
  }
  if (iocData?.enriched?.length > 0) {
    report += '─── IOC INTELLIGENCE ─────────────────────────────\n\n';
    report += `  Total IOCs:    ${iocData.summary?.total || 0}\n`;
    report += `  Malicious:     ${iocData.summary?.malicious || 0}\n`;
    report += `  Suspicious:    ${iocData.summary?.suspicious || 0}\n`;
    report += `  Clean:         ${iocData.summary?.clean || 0}\n\n`;
    iocData.enriched.forEach(ioc => {
      report += `  [${(ioc.enrichment?.reputation || 'unknown').toUpperCase()}] ${ioc.type}: ${ioc.value || ioc.normalized_value}\n`;
      if (ioc.enrichment?.details && typeof ioc.enrichment.details === 'string')
        report += `    └─ ${ioc.enrichment.details}\n`;
    });
    report += '\n';
  }
  if (ml?.top_features?.length > 0) {
    report += '─── TOP ML FEATURES ──────────────────────────────\n\n';
    ml.top_features.forEach(f => {
      report += `  ${f.feature.padEnd(32)} Value: ${f.value?.toFixed(3) || 'N/A'}\n`;
    });
    report += '\n';
  }
  if (analysis?.tone_analysis) {
    const t = analysis.tone_analysis;
    report += '─── TONE ANALYSIS ────────────────────────────────\n\n';
    report += `  Urgency Level:  ${t.urgency_level || 'N/A'}\n`;
    report += `  Fear Level:     ${t.fear_level || 'N/A'}\n`;
    report += `  Impersonation:  ${t.impersonation_signals?.length || 0} signals\n\n`;
  }
  report += '═══════════════════════════════════════════════════\n';
  report += '  Powered by Luna Shield Threat Intelligence Engine\n';
  report += '  ML Model: GradientBoosting + TF-IDF + 25 Features\n';
  report += '═══════════════════════════════════════════════════\n';
  return report;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AnalyzePage() {
  // Navigation
  const [activeView, setActiveView] = useState('analyze');

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
  const [analyzeStep, setAnalyzeStep] = useState(0);

  // Email monitor state
  const [emailConnected, setEmailConnected] = useState(false);
  const [emailMonitoring, setEmailMonitoring] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailConfig, setEmailConfig] = useState({ email: '', password: '', host: 'imap.gmail.com' });
  const [emailConnecting, setEmailConnecting] = useState(false);
  const [liveFeed, setLiveFeed] = useState([]);
  const [selectedFeedItem, setSelectedFeedItem] = useState(null);
  const eventSourceRef = useRef(null);

  // History
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('');
  const [historySort, setHistorySort] = useState('newest');

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = 'success') => setToast({ message, type }), []);

  // SSE connection
  useEffect(() => {
    const es = new EventSource(ENDPOINTS.emailFeed);
    eventSourceRef.current = es;
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setLiveFeed(prev => [data, ...prev].slice(0, 50));
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
      try { setLiveFeed(JSON.parse(e.data).slice(0, 50)); } catch (err) { /* ignore */ }
    });
    return () => es.close();
  }, []);

  // Load history from localStorage
  useEffect(() => {
    try { const h = JSON.parse(localStorage.getItem('luna_analysis_history') || '[]'); setAnalysisHistory(h); } catch (e) { /* ignore */ }
  }, []);
  const saveHistory = useCallback((history) => {
    setAnalysisHistory(history);
    try { localStorage.setItem('luna_analysis_history', JSON.stringify(history.slice(0, 100))); } catch (e) { /* ignore */ }
  }, []);

  /* ─── Handlers ───────────────────────────────────────────────────────── */

  const loadDemo = (demo) => {
    setContent(demo.content);
    const mode = INPUT_MODES.find(m => m.id === demo.mode) || INPUT_MODES[0];
    setSelectedMode(mode);
    setActiveView('analyze');
  };

  const handleAnalyze = async () => {
    if (!content.trim()) { setError('Please provide content to analyze'); return; }
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setActiveTab('verdict');
    setAnalyzeStep(1);

    try {
      setAnalyzeStep(1);
      const normalizeRes = await fetch(`${SERVER_URL_1}/api/threats/normalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_type: selectedMode.id, content: content.trim(), metadata: { source_platform: sourcePlatform || undefined } }),
      });
      if (!normalizeRes.ok) throw new Error('Normalization failed');
      const { artifact } = await normalizeRes.json();
      if (!artifact) throw new Error('Invalid normalization');

      setAnalyzeStep(2);
      const analyzeRes = await fetch(`${SERVER_URL_1}/api/threats/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artifact, options: { extract_iocs: true, extract_entities: true, score_content: true } }),
      });
      if (!analyzeRes.ok) throw new Error('Analysis failed');
      const { analysis } = await analyzeRes.json();
      if (!analysis) throw new Error('Invalid analysis result');

      setAnalyzeStep(3);
      setAnalysisResult(analysis);

      if (analysis?.classification) {
        const family = analysis.classification.primary_family;
        const FAMILY_TO_CODE = { phishing: 'T1', malicious_url: 'T2', malicious_attachment: 'T3', social_engineering_scam: 'T4', misinformation: 'T5', impersonation: 'T6' };
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

      // Save to history
      const historyItem = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        content: content.substring(0, 200),
        mode: selectedMode.id,
        risk_score: analysis.risk_score || 0,
        classification: analysis.ml_classification?.predicted_class || 'unknown',
        severity: analysis.ml_classification?.severity || 'unknown',
        confidence: analysis.ml_classification?.confidence || 0,
        analysis,
      };
      saveHistory([historyItem, ...analysisHistory]);

      buildGraph(analysis);
      correlateAnalysis(analysis);
      showToast('Analysis complete');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
      setAnalyzeStep(0);
    }
  };

  const buildGraph = async (analysis) => {
    if (!analysis) return;
    setIsBuildingGraph(true);
    try {
      const res = await fetch(`${SERVER_URL_1}/api/threats/graph`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ analysis }) });
      if (res.ok) { const data = await res.json(); if (data?.graph) setGraphData(data.graph); }
    } catch (e) { /* ignore */ }
    finally { setIsBuildingGraph(false); }
  };

  const correlateAnalysis = async (analysis) => {
    if (!analysis) return;
    try {
      const res = await fetch(`${SERVER_URL_1}/api/threats/correlate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ analysis }) });
      if (res.ok) { const data = await res.json(); if (data) setCorrelation(data); }
    } catch (e) { /* ignore */ }
  };

  const handleReset = () => {
    setContent(''); setSourcePlatform(''); setAnalysisResult(null); setGraphData(null);
    setCorrelation(null); setPatternResult(null); setActiveTab('verdict'); setError(null);
  };

  const handleEmailConnect = async () => {
    if (!emailConfig.email || !emailConfig.password) return;
    setEmailConnecting(true);
    try {
      const res = await fetch(ENDPOINTS.emailConnect, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(emailConfig) });
      const data = await res.json();
      if (data.success) { setEmailConnected(true); setEmailMonitoring(true); setShowEmailModal(false); showToast('Email monitoring active'); }
      else setError(data.error || 'Failed to connect');
    } catch (err) { setError('Connection failed: ' + err.message); }
    finally { setEmailConnecting(false); }
  };

  const handleEmailDisconnect = async () => {
    try { await fetch(ENDPOINTS.emailDisconnect, { method: 'POST' }); setEmailConnected(false); setEmailMonitoring(false); showToast('Disconnected', 'info'); } catch (err) { /* ignore */ }
  };

  const downloadReport = () => {
    if (!analysisResult) return;
    const report = generateReport(analysisResult);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `luna-threat-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Report downloaded');
  };

  const deleteHistoryItem = (id) => {
    const updated = analysisHistory.filter(h => h.id !== id);
    saveHistory(updated);
    showToast('Removed from history', 'info');
  };

  const deleteFeedItem = (index) => {
    setLiveFeed(prev => prev.filter((_, i) => i !== index));
    showToast('Email removed', 'info');
  };

  const loadHistoryItem = (item) => {
    setAnalysisResult(item.analysis);
    setActiveView('analyze');
    setActiveTab('verdict');
    if (item.analysis?.classification) {
      const family = item.analysis.classification.primary_family;
      const FAMILY_TO_CODE = { phishing: 'T1', malicious_url: 'T2', malicious_attachment: 'T3', social_engineering_scam: 'T4', misinformation: 'T5', impersonation: 'T6' };
      setPatternResult({
        pattern_code: FAMILY_TO_CODE[family] || 'T?',
        pattern_label: `${FAMILY_TO_CODE[family] || 'T?'} - ${family?.replace(/_/g, ' ') || 'Unknown'}`,
        family: 'digital_threat',
        risk_score: (item.analysis.risk_score || 0) / 100,
        confidence: item.analysis.ml_classification?.confidence || 0.7,
        severity: item.analysis.ml_classification?.severity || 'medium',
        decision: (item.analysis.risk_score || 0) >= 75 ? 'highly_suspicious' : 'likely_suspicious',
        top_features: item.analysis.ml_classification?.top_features?.slice(0, 5) || [],
        explanation: `ML Model: ${item.analysis.ml_classification?.predicted_class || 'unknown'}.`,
        all_results: [],
      });
    }
    buildGraph(item.analysis);
    showToast('Analysis loaded');
  };

  const copyJSON = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(JSON.stringify(analysisResult, null, 2));
    showToast('Copied to clipboard');
  };

  const filteredHistory = analysisHistory.filter(h => {
    if (!historyFilter) return true;
    const q = historyFilter.toLowerCase();
    return h.content?.toLowerCase().includes(q) || h.classification?.toLowerCase().includes(q) || h.severity?.toLowerCase().includes(q);
  }).sort((a, b) => historySort === 'newest' ? new Date(b.timestamp) - new Date(a.timestamp) : new Date(a.timestamp) - new Date(b.timestamp));

  const ml = analysisResult?.ml_classification;
  const scoring = analysisResult?.scoring_breakdown;
  const iocSummary = analysisResult?.ioc_enrichment?.summary;

  /* ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      <style>{KEYFRAMES}</style>

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className="sticky top-0 h-screen w-[220px] flex-shrink-0 border-r border-[var(--border)] bg-[var(--card)] flex flex-col z-40">
        <div className="px-4 h-14 flex items-center gap-2.5 border-b border-[var(--border)]">
          <Shield className="text-[var(--primary)]" size={20} />
          <span className="text-sm font-bold text-[var(--foreground)] tracking-tight">Threat Workbench</span>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {SIDEBAR_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            const isMonitor = item.id === 'monitor';
            return (
              <button key={item.id} onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] transition-all ${
                  isActive ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]'
                }`}>
                <Icon size={16} className={isMonitor && emailMonitoring ? 'animate-pulse' : ''} />
                <span className="font-medium">{item.label}</span>
                {isMonitor && emailMonitoring && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 8px #34b27b' }} />
                )}
                {item.id === 'history' && analysisHistory.length > 0 && (
                  <span className="ml-auto text-[10px] font-mono bg-[var(--secondary)] px-1.5 py-0.5 rounded-full">{analysisHistory.length}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer: Connection Status */}
        <div className="p-3 border-t border-[var(--border)]">
          <button
            onClick={() => emailConnected ? handleEmailDisconnect() : setShowEmailModal(true)}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all border ${
              emailMonitoring
                ? 'bg-green-500/8 border-green-500/30 text-green-400'
                : 'bg-[var(--secondary)] border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/30'
            }`}
          >
            {emailMonitoring ? (
              <>
                <div className="relative">
                  <Wifi size={14} />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400" style={{ animation: 'pulseRing 2s infinite' }} />
                </div>
                <span>Live Monitoring</span>
              </>
            ) : (
              <><WifiOff size={14} /> <span>Connect Email</span></>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* ══ ANALYZE VIEW ════════════════════════════════════════════════ */}
        {activeView === 'analyze' && (
          <div className="max-w-[1100px] mx-auto px-8 py-6" style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-[var(--foreground)]">Threat Analysis</h1>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Paste content below for ML-powered threat classification and IOC enrichment</p>
              </div>
              <div className="flex items-center gap-2">
                {analysisResult && (
                  <>
                    <button onClick={downloadReport} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/30 transition-all">
                      <Download size={13} /> Report
                    </button>
                    <button onClick={copyJSON} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/30 transition-all">
                      <Copy size={13} /> JSON
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
              {/* ── Left: Input + Results ────────────────────────────────── */}
              <div className="space-y-5">
                {/* Mode Pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  {INPUT_MODES.map(mode => {
                    const Icon = mode.icon;
                    const isActive = selectedMode.id === mode.id;
                    return (
                      <button key={mode.id} onClick={() => setSelectedMode(mode)}
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all border ${
                          isActive
                            ? 'text-[var(--foreground)] border-[var(--primary)]/40'
                            : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/20'
                        }`}
                        style={isActive ? { background: `${mode.color}10`, borderColor: `${mode.color}40` } : {}}
                      >
                        <Icon size={14} style={isActive ? { color: mode.color } : {}} /> {mode.label}
                      </button>
                    );
                  })}
                </div>

                {/* Input Area */}
                <div className="relative group">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`Paste ${selectedMode.desc?.toLowerCase() || 'content'} here...\n\nOr select a demo scenario from the right panel.`}
                    rows={10}
                    className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-5 py-4 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/40 focus:outline-none focus:border-[var(--primary)]/50 focus:shadow-[0_0_0_3px_rgba(52,178,123,0.08)] transition-all resize-none font-mono leading-relaxed"
                  />
                  {content && (
                    <button onClick={handleReset} className="absolute top-3 right-3 p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors opacity-0 group-hover:opacity-100">
                      <X size={14} />
                    </button>
                  )}
                  <div className="absolute bottom-3 right-3 text-[10px] font-mono text-[var(--muted-foreground)]/40">
                    {content.length} chars
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center gap-3">
                  <input
                    value={sourcePlatform}
                    onChange={(e) => setSourcePlatform(e.target.value)}
                    placeholder="Source (e.g., Gmail, WhatsApp, Twitter)"
                    className="flex-1 max-w-64 bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/40 focus:outline-none focus:border-[var(--primary)]/30 transition-all"
                  />
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !content.trim()}
                    className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-[var(--primary)] text-[var(--primary-foreground)] hover:shadow-[0_0_30px_rgba(52,178,123,0.35)] hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Scan size={16} /> Analyze
                  </button>
                  {analysisResult && (
                    <button onClick={handleReset} className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all">
                      <RotateCcw size={13} /> Reset
                    </button>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-500/8 border border-red-500/25 rounded-xl text-xs text-red-400" style={{ animation: 'slideInUp 0.3s ease' }}>
                    <AlertTriangle size={14} /> {error}
                    <button onClick={() => setError(null)} className="ml-auto"><X size={12} /></button>
                  </div>
                )}

                {/* ── Results ──────────────────────────────────────────────── */}
                {analysisResult && (
                  <div style={{ animation: 'slideInUp 0.4s ease' }}>
                    {/* Result Tabs */}
                    <div className="flex items-center gap-0.5 mb-4 bg-[var(--secondary)] p-1 rounded-xl overflow-x-auto">
                      {RESULT_TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                              activeTab === tab.id ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                            }`}>
                            <Icon size={13} /> {tab.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="min-h-[320px]">
                      {/* ── VERDICT TAB ──────────────────────────────────── */}
                      {activeTab === 'verdict' && (
                        <div className="space-y-4" style={{ animation: 'fadeIn 0.3s ease' }}>
                          {/* Hero Verdict */}
                          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] relative overflow-hidden">
                            <div className="absolute inset-0 opacity-[0.03]" style={{ background: `radial-gradient(ellipse at 30% 0%, ${ml?.severity === 'critical' ? '#e54b4f' : 'var(--primary)'} 0%, transparent 70%)` }} />
                            <div className="relative flex items-start gap-8">
                              <RiskGauge score={analysisResult.risk_score || 0} size={150} />
                              <div className="flex-1 min-w-0 pt-2">
                                <div className="flex items-center gap-2.5 mb-3">
                                  <SeverityBadge severity={ml?.severity || 'medium'} large />
                                  {ml && <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[var(--primary)]/8 text-[var(--primary)] border border-[var(--primary)]/15">{ml.predicted_class?.replace(/_/g, ' ')}</span>}
                                </div>
                                <h2 className="text-xl font-bold text-[var(--foreground)] mb-1.5">
                                  {ml ? `Classified as ${ml.predicted_class?.replace(/_/g, ' ')}` : 'Analysis Complete'}
                                </h2>
                                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                                  {ml ? `ML Confidence: ${(ml.confidence * 100).toFixed(1)}%  ·  Model Accuracy: ${(ml.model_accuracy * 100).toFixed(1)}%  ·  Model F1: ${(ml.model_f1 * 100).toFixed(1)}%` : 'No ML classification available'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Scoring Breakdown Cards */}
                          {scoring && (
                            <div className="grid grid-cols-3 gap-3">
                              {[
                                { label: 'Heuristic Engine', score: scoring.heuristic_score, weight: '30%', icon: Activity, color: '#6aa9ff' },
                                { label: 'ML Classification', score: scoring.ml_score, weight: '50%', icon: Brain, color: 'var(--primary)' },
                                { label: 'Threat Intel', score: scoring.intel_score, weight: '20%', icon: Shield, color: '#f59e0b' },
                              ].map(({ label, score: s, weight, icon: Icon, color }) => (
                                <div key={label} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] relative overflow-hidden">
                                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--secondary)]">
                                    <div className="h-full rounded-r-full transition-all duration-1000" style={{ width: `${Math.min(s || 0, 100)}%`, background: color }} />
                                  </div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Icon size={14} style={{ color }} />
                                    <span className="text-[11px] text-[var(--muted-foreground)] font-medium">{label}</span>
                                    <span className="text-[10px] ml-auto font-mono text-[var(--muted-foreground)] opacity-60">{weight}</span>
                                  </div>
                                  <p className="text-2xl font-black text-[var(--foreground)] tabular-nums">{s || 0}<span className="text-xs font-normal text-[var(--muted-foreground)]">/100</span></p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Features */}
                          {ml?.top_features?.length > 0 && (
                            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                              <h3 className="text-xs font-bold text-[var(--foreground)] mb-4 flex items-center gap-2"><Zap size={14} className="text-[var(--primary)]" /> Top Contributing Features</h3>
                              <div className="space-y-3">
                                {ml.top_features.map((f, i) => (
                                  <div key={i} className="flex items-center gap-3" style={{ animation: `slideInRight 0.3s ease ${i * 0.05}s both` }}>
                                    <span className="text-[11px] font-mono text-[var(--muted-foreground)] w-44 truncate">{f.feature}</span>
                                    <div className="flex-1 h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
                                      <div className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/60 rounded-full" style={{ width: `${Math.min(f.value * 100, 100)}%`, transition: 'width 0.8s cubic-bezier(.4,0,.2,1)' }} />
                                    </div>
                                    <span className="text-[10px] font-mono text-[var(--muted-foreground)] w-12 text-right tabular-nums">{f.value?.toFixed(3)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Probabilities */}
                          {ml?.all_probabilities && (
                            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                              <h3 className="text-xs font-bold text-[var(--foreground)] mb-4">Class Probability Distribution</h3>
                              <div className="space-y-2.5">
                                {Object.entries(ml.all_probabilities).sort(([, a], [, b]) => b - a).map(([cls, prob], i) => (
                                  <div key={cls} className="flex items-center gap-3" style={{ animation: `slideInRight 0.3s ease ${i * 0.04}s both` }}>
                                    <span className="text-[11px] font-mono text-[var(--muted-foreground)] w-32 truncate">{cls}</span>
                                    <div className="flex-1 h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
                                      <div className="h-full rounded-full" style={{ width: `${prob * 100}%`, background: i === 0 ? 'var(--primary)' : 'var(--muted-foreground)', opacity: i === 0 ? 1 : 0.3, transition: 'width 0.8s ease' }} />
                                    </div>
                                    <span className="text-[10px] font-mono text-[var(--muted-foreground)] w-14 text-right tabular-nums">{(prob * 100).toFixed(1)}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── INDICATORS TAB ──────────────────────────────── */}
                      {activeTab === 'indicators' && (
                        <div className="space-y-4" style={{ animation: 'fadeIn 0.3s ease' }}>
                          {iocSummary && (
                            <div className="grid grid-cols-4 gap-3">
                              {[
                                { label: 'Total IOCs', value: iocSummary.total, color: 'var(--foreground)', icon: Target },
                                { label: 'Malicious', value: iocSummary.malicious, color: '#e54b4f', icon: ShieldX },
                                { label: 'Suspicious', value: iocSummary.suspicious, color: '#f59e0b', icon: ShieldAlert },
                                { label: 'Clean', value: iocSummary.clean, color: '#34b27b', icon: ShieldCheck },
                              ].map(s => {
                                const Icon = s.icon;
                                return (
                                  <div key={s.label} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] text-center">
                                    <Icon size={18} className="mx-auto mb-2 opacity-60" style={{ color: s.color }} />
                                    <p className="text-2xl font-black tabular-nums" style={{ color: s.color }}>{s.value}</p>
                                    <p className="text-[10px] font-mono text-[var(--muted-foreground)] mt-1">{s.label}</p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div className="space-y-2">
                            {(analysisResult.ioc_enrichment?.enriched || analysisResult.indicators || []).map((ioc, i) => (
                              <div key={i} className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center gap-3 hover:border-[var(--primary)]/20 transition-all"
                                   style={{ animation: `slideInRight 0.3s ease ${i * 0.04}s both` }}>
                                <ReputationBadge reputation={ioc.enrichment?.reputation || 'unknown'} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-mono text-[var(--foreground)] truncate">{ioc.value || ioc.normalized_value}</p>
                                  <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{ioc.type} · {ioc.enrichment?.source || 'no enrichment'}{ioc.enrichment?.details && typeof ioc.enrichment.details === 'string' ? ` · ${ioc.enrichment.details}` : ''}</p>
                                </div>
                              </div>
                            ))}
                            {(!analysisResult.ioc_enrichment?.enriched?.length && !analysisResult.indicators?.length) &&
                              <EmptyState icon={Target} title="No IOCs Extracted" subtitle="The content didn't contain any identifiable indicators of compromise." />}
                          </div>
                        </div>
                      )}

                      {/* ── SCORING TAB ──────────────────────────────────── */}
                      {activeTab === 'scoring' && (
                        <div className="space-y-4" style={{ animation: 'fadeIn 0.3s ease' }}>
                          <div className="flex justify-center py-4"><RiskGauge score={analysisResult.risk_score || 0} size={200} /></div>
                          {analysisResult.features && (
                            <div className="grid grid-cols-2 gap-3">
                              {Object.entries(analysisResult.features || {}).filter(([k]) => typeof analysisResult.features[k] === 'object').map(([category, features]) => (
                                <div key={category} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                                  <h4 className="text-[11px] font-bold text-[var(--foreground)] mb-3 capitalize flex items-center gap-1.5">
                                    <Activity size={12} className="text-[var(--primary)]" />
                                    {category.replace(/_/g, ' ')}
                                  </h4>
                                  <div className="space-y-1.5">
                                    {Object.entries(features || {}).slice(0, 8).map(([k, v]) => (
                                      <div key={k} className="flex items-center justify-between">
                                        <span className="text-[10px] font-mono text-[var(--muted-foreground)] truncate max-w-[160px]">{k}</span>
                                        <span className="text-[10px] font-mono text-[var(--foreground)] font-semibold">{typeof v === 'boolean' ? (v ? 'Yes' : 'No') : v}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {analysisResult.tone_analysis && (
                            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                              <h3 className="text-xs font-bold text-[var(--foreground)] mb-4">Content Tone Analysis</h3>
                              <div className="grid grid-cols-3 gap-6">
                                <div><p className="text-[10px] text-[var(--muted-foreground)] mb-1">Urgency Level</p><p className="text-lg font-bold text-[var(--foreground)] capitalize">{analysisResult.tone_analysis.urgency_level}</p></div>
                                <div><p className="text-[10px] text-[var(--muted-foreground)] mb-1">Fear Level</p><p className="text-lg font-bold text-[var(--foreground)] capitalize">{analysisResult.tone_analysis.fear_level}</p></div>
                                <div><p className="text-[10px] text-[var(--muted-foreground)] mb-1">Impersonation Signals</p><p className="text-lg font-bold text-[var(--foreground)]">{analysisResult.tone_analysis.impersonation_signals?.length || 0}</p></div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── GRAPH, PATTERN, CORRELATION TABS ────────────── */}
                      {activeTab === 'graph' && (
                        <div style={{ animation: 'fadeIn 0.3s ease' }}>
                          {isBuildingGraph ? <div className="py-20"><SkeletonCard lines={5} /></div> : graphData ? <ThreatGraphViewer data={graphData} /> : <EmptyState icon={Network} title="No Graph Data" subtitle="Graph visualization will appear after analysis." />}
                        </div>
                      )}
                      {activeTab === 'pattern' && (
                        <div style={{ animation: 'fadeIn 0.3s ease' }}>
                          {patternResult ? <PatternResult result={patternResult} /> : <EmptyState icon={Layers} title="No Pattern Detected" subtitle="Pattern classification results will appear here." />}
                        </div>
                      )}
                      {activeTab === 'correlation' && (
                        <div style={{ animation: 'fadeIn 0.3s ease' }}>
                          {correlation?.correlation ? (
                            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                              <h3 className="text-xs font-bold text-[var(--foreground)] mb-3">Campaign Correlation</h3>
                              <pre className="text-xs font-mono text-[var(--muted-foreground)] whitespace-pre-wrap bg-[var(--secondary)] p-4 rounded-lg overflow-auto max-h-96">{JSON.stringify(correlation.correlation, null, 2)}</pre>
                            </div>
                          ) : <EmptyState icon={GitMerge} title="No Correlations" subtitle="Campaign correlation data is not available." />}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Right Sidebar: Demos ───────────────────────────────── */}
              <div className="space-y-4">
                <h2 className="text-[11px] font-mono text-[var(--muted-foreground)] uppercase tracking-widest px-1">Demo Scenarios</h2>
                <div className="space-y-2">
                  {DEMO_SCENARIOS.map(demo => {
                    const Icon = demo.icon;
                    return (
                      <button key={demo.id} onClick={() => loadDemo(demo)}
                        className="w-full text-left p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/25 hover:-translate-y-px transition-all group">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${demo.color}12`, border: `1px solid ${demo.color}25` }}>
                            <Icon size={13} style={{ color: demo.color }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">{demo.label}</p>
                            <p className="text-[10px] text-[var(--muted-foreground)] truncate mt-0.5">{demo.content.substring(0, 50)}...</p>
                          </div>
                          <Play size={11} className="text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors flex-shrink-0" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Quick Summary (when result) */}
                {analysisResult && (
                  <div className="space-y-3 mt-4 pt-4 border-t border-[var(--border)]" style={{ animation: 'slideInUp 0.3s ease' }}>
                    <h2 className="text-[11px] font-mono text-[var(--muted-foreground)] uppercase tracking-widest px-1">Quick Summary</h2>
                    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-2.5">
                      {[
                        { label: 'Classification', value: ml?.predicted_class?.replace(/_/g, ' ') || 'N/A', color: 'var(--primary)' },
                        { label: 'Confidence', value: ml ? `${(ml.confidence * 100).toFixed(1)}%` : 'N/A' },
                        { label: 'Risk Score', value: `${analysisResult.risk_score || 0}/100`, bold: true },
                        { label: 'IOCs Found', value: iocSummary?.total || analysisResult.indicators?.length || 0 },
                        ...(iocSummary?.malicious > 0 ? [{ label: 'Malicious IOCs', value: iocSummary.malicious, color: '#e54b4f' }] : []),
                        { label: 'Claims', value: analysisResult.claims?.length || 0 },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between items-center">
                          <span className="text-[11px] text-[var(--muted-foreground)]">{row.label}</span>
                          <span className={`text-xs font-mono ${row.bold ? 'font-bold' : 'font-medium'}`} style={{ color: row.color || 'var(--foreground)' }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ LIVE MONITOR VIEW ════════════════════════════════════════════ */}
        {activeView === 'monitor' && (
          <div className="max-w-[1100px] mx-auto px-8 py-6" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2.5">
                  Live Email Monitor
                  {emailMonitoring && <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" style={{ boxShadow: '0 0 10px #34b27b', animation: 'pulseRing 2s infinite' }} />}
                </h1>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  {emailMonitoring ? `Monitoring inbox in real-time · ${liveFeed.length} emails analyzed` : 'Connect your email to start real-time threat monitoring'}
                </p>
              </div>
              <button
                onClick={() => emailConnected ? handleEmailDisconnect() : setShowEmailModal(true)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  emailMonitoring ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/15' : 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:shadow-[0_0_24px_rgba(52,178,123,0.3)]'
                }`}
              >
                {emailMonitoring ? <><WifiOff size={15} /> Disconnect</> : <><Wifi size={15} /> Connect Email</>}
              </button>
            </div>

            {!emailMonitoring && liveFeed.length === 0 ? (
              <EmptyState icon={Inbox} title="No Emails Monitored Yet" subtitle="Connect your Gmail, Outlook, or Yahoo inbox to start real-time threat detection. As emails arrive, they'll automatically be analyzed and displayed here." />
            ) : (
              <div className="space-y-2.5">
                {liveFeed.map((item, i) => (
                  <div key={i}
                    className={`p-4 rounded-xl border bg-[var(--card)] transition-all cursor-pointer hover:border-[var(--primary)]/25 group ${
                      selectedFeedItem === i ? 'border-[var(--primary)]/40 shadow-[0_0_20px_rgba(52,178,123,0.06)]' : 'border-[var(--border)]'
                    }`}
                    onClick={() => setSelectedFeedItem(selectedFeedItem === i ? null : i)}
                    style={{ animation: `slideInUp 0.3s ease ${i * 0.03}s both` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <SeverityBadge severity={item.ml_classification?.severity || 'medium'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[var(--foreground)] truncate">{item.email?.subject || 'No Subject'}</p>
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">From: {item.email?.from || 'Unknown'}</p>
                      </div>
                      <div className="text-right flex-shrink-0 flex items-center gap-3">
                        <div>
                          <span className="text-xs font-mono font-bold text-[var(--foreground)]">{item.ml_classification?.risk_score || 0}</span>
                          <span className="text-[10px] text-[var(--muted-foreground)]">/100</span>
                          <p className="text-[10px] font-mono text-[var(--primary)] mt-0.5">{item.ml_classification?.predicted_class || '?'}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); deleteFeedItem(i); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-400 transition-colors" title="Remove">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--muted-foreground)] flex-shrink-0">{new Date(item.timestamp).toLocaleTimeString()}</span>
                    </div>

                    {/* Expanded Detail */}
                    {selectedFeedItem === i && (
                      <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-3" style={{ animation: 'slideInUp 0.2s ease' }}>
                        <div className="grid grid-cols-3 gap-3">
                          <div><p className="text-[10px] text-[var(--muted-foreground)]">Classification</p><p className="text-sm font-semibold text-[var(--primary)]">{item.ml_classification?.predicted_class || 'Unknown'}</p></div>
                          <div><p className="text-[10px] text-[var(--muted-foreground)]">Confidence</p><p className="text-sm font-semibold text-[var(--foreground)]">{item.ml_classification?.confidence ? `${(item.ml_classification.confidence * 100).toFixed(1)}%` : 'N/A'}</p></div>
                          <div><p className="text-[10px] text-[var(--muted-foreground)]">IOCs Found</p><p className="text-sm font-semibold text-[var(--foreground)]">{item.indicator_summary?.total || 0}</p></div>
                        </div>
                        {item.email?.bodyPreview && (
                          <div>
                            <p className="text-[10px] text-[var(--muted-foreground)] mb-1">Body Preview</p>
                            <p className="text-xs text-[var(--foreground)] bg-[var(--secondary)] p-3 rounded-lg font-mono leading-relaxed">{item.email.bodyPreview}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ HISTORY VIEW ════════════════════════════════════════════════ */}
        {activeView === 'history' && (
          <div className="max-w-[1100px] mx-auto px-8 py-6" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-[var(--foreground)]">Analysis History</h1>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{analysisHistory.length} past analyses stored locally</p>
              </div>
              {analysisHistory.length > 0 && (
                <button onClick={() => { saveHistory([]); showToast('History cleared', 'info'); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-[var(--border)] text-[var(--muted-foreground)] hover:text-red-400 hover:border-red-500/30 transition-all">
                  <Trash2 size={13} /> Clear All
                </button>
              )}
            </div>

            {/* Search & Filter */}
            {analysisHistory.length > 0 && (
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  <input value={historyFilter} onChange={e => setHistoryFilter(e.target.value)}
                    placeholder="Search history..." className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg pl-9 pr-3 py-2 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/40 focus:outline-none focus:border-[var(--primary)]/30 transition-all" />
                </div>
                <select value={historySort} onChange={e => setHistorySort(e.target.value)} className="bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none">
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            )}

            {filteredHistory.length === 0 ? (
              <EmptyState icon={History} title="No Analysis History" subtitle={historyFilter ? 'No results match your search.' : 'Your past analyses will appear here. Run an analysis to get started.'} />
            ) : (
              <div className="space-y-2">
                {filteredHistory.map((item, i) => (
                  <div key={item.id} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/20 transition-all group"
                       style={{ animation: `slideInUp 0.3s ease ${i * 0.03}s both` }}>
                    <div className="flex items-center gap-4">
                      <SeverityBadge severity={item.severity} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-[var(--foreground)] truncate">{item.content}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-[var(--muted-foreground)] flex items-center gap-1"><Clock size={10} /> {new Date(item.timestamp).toLocaleString()}</span>
                          <span className="text-[10px] font-mono text-[var(--primary)]">{item.classification}</span>
                          <span className="text-[10px] font-mono text-[var(--muted-foreground)]">Risk: {item.risk_score}/100</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => loadHistoryItem(item)} className="p-1.5 rounded-lg hover:bg-[var(--primary)]/10 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors" title="Load analysis">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => { const r = generateReport(item.analysis); const b = new Blob([r], { type: 'text/plain' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `report-${item.id}.txt`; a.click(); URL.revokeObjectURL(u); showToast('Report downloaded'); }}
                          className="p-1.5 rounded-lg hover:bg-[var(--primary)]/10 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors" title="Download report">
                          <Download size={14} />
                        </button>
                        <button onClick={() => deleteHistoryItem(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Email Connect Modal ───────────────────────────────────────── */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md" style={{ animation: 'fadeIn 0.2s ease' }}>
          <div className="w-full max-w-md mx-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden" style={{ animation: 'scaleIn 0.3s ease' }}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between" style={{ background: 'linear-gradient(135deg, rgba(52,178,123,0.05) 0%, transparent 100%)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center"><Mail size={18} className="text-[var(--primary)]" /></div>
                <div>
                  <h2 className="text-sm font-bold text-[var(--foreground)]">Connect Email Inbox</h2>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Real-time IMAP monitoring with SSL</p>
                </div>
              </div>
              <button onClick={() => setShowEmailModal(false)} className="p-1.5 rounded-lg hover:bg-[var(--secondary)] text-[var(--muted-foreground)]"><X size={16} /></button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-[var(--muted-foreground)] mb-1.5 block uppercase tracking-wider">Provider</label>
                <select value={emailConfig.host} onChange={(e) => setEmailConfig({ ...emailConfig, host: e.target.value })}
                  className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/50">
                  <option value="imap.gmail.com">Gmail (imap.gmail.com)</option>
                  <option value="outlook.office365.com">Outlook (outlook.office365.com)</option>
                  <option value="imap.mail.yahoo.com">Yahoo (imap.mail.yahoo.com)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--muted-foreground)] mb-1.5 block uppercase tracking-wider">Email Address</label>
                <input type="email" value={emailConfig.email} onChange={(e) => setEmailConfig({ ...emailConfig, email: e.target.value })}
                  placeholder="you@gmail.com" className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/40 focus:outline-none focus:border-[var(--primary)]/50" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--muted-foreground)] mb-1.5 block uppercase tracking-wider">App Password</label>
                <input type="password" value={emailConfig.password} onChange={(e) => setEmailConfig({ ...emailConfig, password: e.target.value })}
                  placeholder="xxxx xxxx xxxx xxxx" className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/40 focus:outline-none focus:border-[var(--primary)]/50" />
                <p className="text-[10px] text-[var(--muted-foreground)] mt-2 flex items-center gap-1"><Lock size={10} /> Google Account &rarr; Security &rarr; 2-Step Verification &rarr; App Passwords</p>
              </div>
              <button onClick={handleEmailConnect} disabled={emailConnecting || !emailConfig.email || !emailConfig.password}
                className="w-full py-3 rounded-xl text-sm font-bold bg-[var(--primary)] text-[var(--primary-foreground)] hover:shadow-[0_0_30px_rgba(52,178,123,0.35)] transition-all disabled:opacity-30">
                {emailConnecting ? <span className="inline-flex items-center gap-2"><span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> Connecting...</span> : 'Connect & Start Monitoring'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Analysis Loading Overlay ──────────────────────────────────── */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-md" style={{ animation: 'fadeIn 0.2s ease' }}>
          <div className="p-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-center shadow-2xl max-w-sm w-full" style={{ animation: 'scaleIn 0.3s ease' }}>
            {/* Animated Scanner */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-2xl border-2 border-[var(--primary)]/20" />
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-[var(--primary)] animate-spin" />
              <div className="absolute inset-3 rounded-xl border border-[var(--primary)]/10" />
              <div className="absolute inset-0 flex items-center justify-center"><Shield size={24} className="text-[var(--primary)]" /></div>
            </div>

            <p className="text-base font-bold text-[var(--foreground)] mb-2">Analyzing Threat</p>
            <p className="text-xs text-[var(--muted-foreground)] mb-6">Running 3-layer intelligence pipeline</p>

            {/* Step Progress */}
            <div className="space-y-3">
              {[
                { step: 1, label: 'Normalizing & extracting entities', icon: FileText },
                { step: 2, label: 'ML model + IOC enrichment', icon: Brain },
                { step: 3, label: 'Building threat graph', icon: Network },
              ].map(({ step, label, icon: Icon }) => (
                <div key={step} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    analyzeStep >= step ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-[var(--secondary)] text-[var(--muted-foreground)]'
                  }`}>{analyzeStep > step ? <Check size={12} /> : step}</div>
                  <span className={`text-xs ${analyzeStep >= step ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>{label}</span>
                  {analyzeStep === step && <div className="w-3 h-3 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin ml-auto" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
