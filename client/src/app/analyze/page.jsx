"use client";

import { useState } from 'react';
import { 
  Shield, FileText, Image as ImageIcon, Mail, MessageSquare, 
  AlertTriangle, GitMerge, Network, MessageCircle, Briefcase,
  ChevronRight, ChevronLeft, Target, Globe, Smartphone, Scan,
  BarChart3, ScrollText, Activity, AlertOctagon, Zap, Layers,
  CheckCircle, Copy, Check
} from 'lucide-react';
import { SERVER_URL_1 } from '@/utils/commonHelper';
import ThreatGraphViewer from '@/components/ThreatGraphViewer';
import PatternResult from '@/components/PatternResult';

const INPUT_MODES = [
  { id: 'email_text', label: 'Email / Phishing', icon: Mail, desc: 'Phishing, BEC, spoofed headers' },
  { id: 'sms_text', label: 'SMS / Smishing', icon: Smartphone, desc: 'Text message scams' },
  { id: 'social_post', label: 'Social Post', icon: MessageSquare, desc: 'Misinformation, scams' },
  { id: 'url', label: 'URL / Domain', icon: Globe, desc: 'Malicious links, typosquats' },
  { id: 'screenshot', label: 'Screenshot', icon: ImageIcon, desc: 'Image analysis, OCR' },
  { id: 'raw_text', label: 'Raw Content', icon: FileText, desc: 'Any suspicious text' }
];

const OUTPUT_SECTIONS = [
  { id: 'summary', label: 'Summary', icon: Shield },
  { id: 'indicators', label: 'Indicators', icon: Target },
  { id: 'graph', label: 'Graph View', icon: Network },
  { id: 'pattern', label: 'Pattern', icon: BarChart3 },
  { id: 'correlation', label: 'Correlation', icon: GitMerge },
];

const DEMO_SCENARIOS = {
  phishing: `From: PayPal Security <security@paypa1-verify.com>
Subject: Urgent: Verify Your Account Within 24 Hours

Dear Valued Customer,

We have detected unusual activity on your PayPal account. For your security, we have temporarily limited your account access.

To restore full access, please verify your identity immediately:

https://paypa1-verify.com/account/restore?id=8f4a2b9c

?? WARNING: Failure to verify within 24 hours will result in permanent account suspension.`,
  smishing: "FedEx: Your package delivery failed. Reschedule & track here: http://fedex-tracking.xyz/track?id=FDX9872461 Reply STOP to unsubscribe",
  url: "https://microso ft-login.com/oauth/authorize?client_id=a8b2c4d&redirect=https://attacker-infra.net/harvest",
  misinfo: "?? BREAKING: Mainstream media HIDING the truth! New study PROVES dangerous claims - but Big Pharma doesn't want you to know! Share before this gets deleted!",
  scam: "?? I turned $500 into $12,000 in just 2 WEEKS! No experience needed! DM me 'READY'. Investment Fund: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
  aml: `Transaction Network Analysis:

Entity A (Corp XYZ Ltd) ? Loan $500,000 ? Entity B (Offshore Holdings Inc)
Entity B ? Repayment $520,000 ? Entity A [7 days later]
Entity A ? New Loan $550,000 ? Entity B [1 day later]

Pattern: Circular loan structure with increasing principal amounts
Red Flags: Same parties, short cycles, offshore jurisdiction
Risk Score: 0.89
Pattern: P2 - Loan Evergreening`
};

export default function AnalyzePage() {
  const [selectedMode, setSelectedMode] = useState(INPUT_MODES[0]);
  const [content, setContent] = useState('');
  const [sourcePlatform, setSourcePlatform] = useState('');
  const [claimedBrand, setClaimedBrand] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [correlation, setCorrelation] = useState(null);
  const [patternResult, setPatternResult] = useState(null);
  const [activeSection, setActiveSection] = useState('summary');
  const [isBuildingGraph, setIsBuildingGraph] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadDemoScenario = (scenarioId) => {
    setContent(DEMO_SCENARIOS[scenarioId] || '');
    if (scenarioId === 'phishing') setSelectedMode(INPUT_MODES[0]);
    else if (scenarioId === 'smishing') setSelectedMode(INPUT_MODES[1]);
    else if (scenarioId === 'url') setSelectedMode(INPUT_MODES[3]);
    else if (scenarioId === 'misinfo') setSelectedMode(INPUT_MODES[2]);
    else if (scenarioId === 'scam') setSelectedMode(INPUT_MODES[2]);
    else if (scenarioId === 'aml') setSelectedMode(INPUT_MODES[5]);
  };

  const handleAnalyze = async () => {
    if (!content.trim()) {
      setError('Please provide content to analyze');
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const normalizeResponse = await fetch(`${SERVER_URL_1}/api/threats/normalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_type: selectedMode.id,
          content: content.trim(),
          metadata: {
            source_platform: sourcePlatform || undefined,
            target_brand: claimedBrand || undefined,
          }
        })
      });

      if (!normalizeResponse.ok) throw new Error('Failed to normalize');
      const normalizeData = await normalizeResponse.json();
      if (!normalizeData?.artifact) throw new Error('Invalid response');

      const analyzeResponse = await fetch(`${SERVER_URL_1}/api/threats/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifact: normalizeData.artifact,
          options: { extract_iocs: true, extract_entities: true, score_content: true, build_graph: true }
        })
      });

      if (!analyzeResponse.ok) throw new Error('Analysis failed');
      const analyzeData = await analyzeResponse.json();
      if (!analyzeData?.analysis) throw new Error('Invalid analysis');
      
      const analysis = analyzeData.analysis;
      setAnalysisResult(analysis);

      if (analysis?.classification) {
        const family = analysis.classification.primary_family;
        const FAMILY_TO_CODE = {
          phishing: 'T1', malicious_url: 'T2', malicious_attachment: 'T3',
          social_engineering_scam: 'T4', misinformation: 'T5', impersonation: 'T6'
        };
        setPatternResult({
          pattern_code: FAMILY_TO_CODE[family] || 'T?',
          pattern_label: `${FAMILY_TO_CODE[family] || 'T?'} - ${family?.replace(/_/g, ' ') || 'Unknown'}`,
          family: 'digital_threat',
          risk_score: (analysis.risk_score?.overall_score || 0) / 100,
          confidence: analysis.risk_score?.confidence || 0.7,
          severity: analysis.risk_score?.severity || 'medium',
          decision: (analysis.risk_score?.overall_score || 0) >= 75 ? 'highly_suspicious' : 'likely_suspicious',
          top_features: analysis.risk_score?.reasons?.slice(0, 5) || [],
          explanation: `Threat family: ${family || 'unknown'}. Risk signals: ${analysis.total_risk_signals || 0}.`,
          all_results: []
        });
      }

      buildGraph(analysis);
      correlate(analysis);

    } catch (err) {
      setError(err.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setContent('');
    setSourcePlatform('');
    setClaimedBrand('');
    setAnalysisResult(null);
    setGraphData(null);
    setCorrelation(null);
    setPatternResult(null);
    setActiveSection('summary');
    setError(null);
  };

  const buildGraph = async (analysis) => {
    if (!analysis) return;
    setIsBuildingGraph(true);
    try {
      const res = await fetch(`${SERVER_URL_1}/api/threats/graph`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis })
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.graph) setGraphData(data.graph);
      }
    } catch (e) {
      console.error('Graph error:', e);
    } finally {
      setIsBuildingGraph(false);
    }
  };

  const correlate = async (analysis) => {
    if (!analysis) return;
    try {
      const res = await fetch(`${SERVER_URL_1}/api/threats/correlate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis })
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.correlation || data?.total_correlated !== undefined) setCorrelation(data);
      }
    } catch (e) {
      console.error('Correlation error:', e);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Scan className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Threat Analysis Workbench</h1>
                <p className="text-xs text-muted-foreground">AI-powered IOC extraction & risk assessment</p>
              </div>
            </div>
            
            {analysisResult && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors lg:hidden"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Menu
                </button>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(analysisResult.risk_score?.severity)}`}>
                  {analysisResult.risk_score?.severity?.toUpperCase() || 'UNKNOWN'}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {analysisResult.risk_score?.overall_score || 0}/100
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="flex">
          {/* Sidebar */}
          <aside className={`${sidebarCollapsed ? 'w-16' : 'w-72'} border-r border-border bg-card/30 min-h-[calc(100vh-140px)] transition-all duration-300 flex-shrink-0`}>
            <div className="p-4 space-y-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex w-full items-center justify-center rounded-lg p-2 hover:bg-muted transition-colors"
              >
                {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
              </button>

              {!sidebarCollapsed && (
                <>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">Analysis Mode</p>
                    <div className="space-y-1">
                      {INPUT_MODES.map((mode) => {
                        const Icon = mode.icon;
                        const isSelected = selectedMode.id === mode.id;
                        return (
                          <button
                            key={mode.id}
                            onClick={() => setSelectedMode(mode)}
                            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                              isSelected ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-foreground'
                            }`}
                          >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium truncate">{mode.label}</p>
                              {!isSelected && <p className="text-xs opacity-70 truncate">{mode.desc}</p>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {!analysisResult && (
                    <div className="space-y-3 pt-2 border-t border-border">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">Context</p>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={sourcePlatform}
                          onChange={(e) => setSourcePlatform(e.target.value)}
                          placeholder="Source (Gmail, WhatsApp...)"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                        />
                        <input
                          type="text"
                          value={claimedBrand}
                          onChange={(e) => setClaimedBrand(e.target.value)}
                          placeholder="Brand (PayPal, Amazon...)"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {analysisResult && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">Results</p>
                      <div className="space-y-0.5">
                        {OUTPUT_SECTIONS.map((section) => {
                          const Icon = section.icon;
                          const isActive = activeSection === section.id;
                          const hasData = 
                            section.id === 'summary' ? true :
                            section.id === 'indicators' ? (analysisResult.indicators?.length > 0 || analysisResult.entities?.length > 0) :
                            section.id === 'graph' ? graphData :
                            section.id === 'pattern' ? patternResult :
                            section.id === 'correlation' ? correlation :
                            true;
                          
                          return (
                            <button
                              key={section.id}
                              onClick={() => hasData && setActiveSection(section.id)}
                              disabled={!hasData}
                              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-all ${
                                isActive ? 'bg-primary/10 text-primary font-medium' : hasData ? 'hover:bg-muted text-foreground' : 'text-muted-foreground/50 cursor-not-allowed'
                              }`}
                            >
                              <Icon className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{section.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {sidebarCollapsed && (
                <div className="space-y-1">
                  {INPUT_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setSelectedMode(mode)}
                      className={`w-full flex items-center justify-center rounded-lg p-2 ${selectedMode.id === mode.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                      title={mode.label}
                    >
                      <mode.icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-h-[calc(100vh-140px)]">
            {!analysisResult ? (
              /* INPUT MODE */
              <div className="p-6 lg:p-8">
                <div className="max-w-3xl mx-auto">
                  {/* Demo Bar */}
                  <div className="mb-6 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Quick demo:</span>
                    {Object.entries({phishing: 'Phishing', smishing: 'SMS', url: 'URL', misinfo: 'Misinfo', scam: 'Scam', aml: 'AML'}).map(([id, label]) => (
                      <button
                        key={id}
                        onClick={() => loadDemoScenario(id)}
                        className="rounded-full border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Input Area */}
                  <div className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <selectedMode.icon className="h-4 w-4 text-primary" />
                        <span className="font-medium">{selectedMode.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{selectedMode.desc}</span>
                    </div>
                    
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={`Paste ${selectedMode.label.toLowerCase()} content here...`}
                      rows={14}
                      className="w-full px-4 py-4 font-mono text-sm bg-transparent focus:outline-none resize-none"
                    />
                    
                    {error && (
                      <div className="mx-4 mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 flex items-center gap-2">
                        <AlertOctagon className="h-4 w-4 text-destructive" />
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}
                    
                    <div className="border-t border-border px-4 py-4 flex items-center gap-3">
                      <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !content.trim()}
                        className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        {isAnalyzing ? <><Activity className="h-4 w-4 animate-spin" /> Analyzing...</> : <><Scan className="h-4 w-4" /> Analyze Threat</>}
                      </button>
                      <button onClick={handleReset} className="rounded-lg border border-border px-4 py-2.5 font-medium hover:bg-muted transition-colors">Clear</button>
                      <span className="ml-auto text-xs text-muted-foreground">{content.length} chars</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* RESULTS MODE */
              <div className="h-[calc(100vh-140px)] overflow-auto">
                {/* Summary Section */}
                {activeSection === 'summary' && (
                  <div className="p-6 space-y-6">
                    <div className="rounded-xl border border-border bg-card p-6">
                      <div className="flex items-start gap-6">
                        <div className="flex-shrink-0">
                          <div className={`flex h-28 w-28 items-center justify-center rounded-full border-4 ${analysisResult.risk_score?.severity === 'critical' ? 'border-red-500' : analysisResult.risk_score?.severity === 'high' ? 'border-orange-500' : analysisResult.risk_score?.severity === 'medium' ? 'border-yellow-500' : 'border-green-500'} bg-primary/10`}>
                            <span className="text-4xl font-bold text-primary">{analysisResult.risk_score?.overall_score || 0}</span>
                          </div>
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-3">
                            <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${getSeverityColor(analysisResult.risk_score?.severity)}`}>
                              {analysisResult.risk_score?.severity?.toUpperCase() || 'UNKNOWN'}
                            </span>
                            {analysisResult.classification && (
                              <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                {analysisResult.classification.primary_family.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                              { label: 'Content Risk', score: analysisResult.risk_score?.content_score || 0 },
                              { label: 'Infrastructure', score: analysisResult.risk_score?.infrastructure_score || 0 },
                              { label: 'Behavior', score: analysisResult.risk_score?.behavior_score || 0 },
                              { label: 'Financial', score: analysisResult.risk_score?.financial_score || 0 },
                            ].map((item) => (
                              <div key={item.label} className="rounded-lg bg-muted/50 p-3">
                                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${item.score}%` }} />
                                  </div>
                                  <span className="text-sm font-bold w-8">{item.score}</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {(analysisResult.risk_score?.reasons?.length || 0) > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-semibold">Risk Indicators</p>
                              <div className="flex flex-wrap gap-2">
                                {analysisResult.risk_score.reasons.slice(0, 8).map((reason, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 text-destructive px-3 py-1 text-xs">
                                    <AlertTriangle className="h-3 w-3" />
                                    {reason}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => {
                          const family = analysisResult.classification?.primary_family || 'unknown';
                          const modeMap = { phishing: 'phishing', impersonation: 'phishing', malicious_url: 'url', malicious_attachment: 'url', social_engineering_scam: 'campaigns', misinformation: 'campaigns', aml_financial_threat: 'aml' };
                          const mode = modeMap[family] || 'copilot';
                          window.location.href = `/chat?mode=${mode}&context=analysis`;
                        }}
                        className="flex items-center gap-2 rounded-lg bg-primary/10 text-primary px-4 py-2.5 font-medium hover:bg-primary/20 transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Discuss in Copilot
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`${SERVER_URL_1}/api/cases`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                title: `${analysisResult.classification?.primary_family?.replace(/_/g, ' ') || 'Threat'} Investigation`,
                                summary: `Risk score: ${analysisResult.risk_score?.overall_score || 0}/100`,
                                threat_family: analysisResult.classification?.primary_family || 'unknown',
                                severity: analysisResult.risk_score?.severity || 'medium',
                                priority: (analysisResult.risk_score?.overall_score || 0) >= 75 ? 'high' : 'medium',
                                linked_artifact_ids: [analysisResult.artifact_id],
                                auto_recommend_actions: true,
                                created_by: 'analyst'
                              })
                            });
                            const data = await res.json();
                            if (data.case) window.location.href = `/cases/${data.case.case_id}`;
                          } catch(e) { console.error(e); }
                        }}
                        className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 font-medium hover:bg-muted transition-colors"
                      >
                        <Briefcase className="h-4 w-4" />
                        Create Case
                      </button>
                      <button onClick={handleReset} className="rounded-lg border border-border px-4 py-2.5 font-medium hover:bg-muted transition-colors ml-auto">New Analysis</button>
                    </div>
                  </div>
                )}
                {/* Indicators Section */}
                {activeSection === 'indicators' && (
                  <div className="p-6 space-y-6">
                    {analysisResult.indicators?.length > 0 && (
                      <div className="rounded-xl border border-border bg-card p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            Indicators of Compromise ({analysisResult.indicators.length})
                          </h3>
                          <button
                            onClick={() => copyToClipboard(analysisResult.indicators.map(i => i.value).join('\\n'))}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                          >
                            {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy all</>}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {analysisResult.indicators.map((indicator, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-lg border border-border bg-background p-3 group">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted uppercase">{indicator.type}</span>
                                  {indicator.confidence > 0.8 && <Zap className="h-3 w-3 text-yellow-500" />}
                                </div>
                                <p className="font-mono text-sm truncate" title={indicator.value}>{indicator.value}</p>
                              </div>
                              <button
                                onClick={() => copyToClipboard(indicator.value)}
                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-muted rounded transition-opacity"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysisResult.entities?.length > 0 && (
                      <div className="rounded-xl border border-border bg-card p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Layers className="h-5 w-5 text-primary" />
                          Extracted Entities ({analysisResult.entities.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.entities.map((entity, idx) => (
                            <div key={idx} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                              <span className="text-xs font-medium text-muted-foreground uppercase">{entity.type}</span>
                              <span className="font-medium">{entity.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Graph Section */}
                {activeSection === 'graph' && (
                  <div className="p-6 h-full">
                    {isBuildingGraph ? (
                      <div className="flex h-96 items-center justify-center rounded-xl border border-border bg-card">
                        <div className="text-center">
                          <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
                          <p className="text-muted-foreground">Building threat graph...</p>
                        </div>
                      </div>
                    ) : graphData ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Network className="h-5 w-5 text-primary" />
                            Threat Relationship Graph
                          </h3>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Domain</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500"></span> Email</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500"></span> Entity</span>
                          </div>
                        </div>
                        <ThreatGraphViewer graphData={graphData} height={500} />
                        <div className="grid grid-cols-3 gap-4">
                          <div className="rounded-lg bg-muted/50 p-3 text-center">
                            <p className="text-2xl font-bold">{graphData.metadata?.node_count || 0}</p>
                            <p className="text-xs text-muted-foreground">Nodes</p>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-3 text-center">
                            <p className="text-2xl font-bold">{graphData.metadata?.edge_count || 0}</p>
                            <p className="text-xs text-muted-foreground">Relationships</p>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-3 text-center">
                            <p className="text-lg font-bold capitalize">{graphData.metadata?.threat_family?.replace(/_/g, ' ') || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">Threat Family</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-96 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground">
                        No graph data available
                      </div>
                    )}
                  </div>
                )}

                {/* Pattern Section */}
                {activeSection === 'pattern' && (
                  <div className="p-6">
                    {patternResult ? (
                      <PatternResult result={patternResult} onViewGraph={() => setActiveSection('graph')} />
                    ) : (
                      <div className="flex h-96 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground">
                        No pattern classification available
                      </div>
                    )}
                  </div>
                )}

                {/* Correlation Section */}
                {activeSection === 'correlation' && (
                  <div className="p-6 space-y-6">
                    {correlation?.campaign_hint && (
                      <div className="rounded-xl border border-primary/40 bg-primary/5 p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <GitMerge className="h-5 w-5 text-primary" />
                          <span className="font-bold text-primary">Campaign Detected</span>
                        </div>
                        <p className="text-lg font-semibold">{correlation.campaign_hint.campaign_label}</p>
                        <p className="text-sm text-muted-foreground mt-1">{correlation.campaign_hint.description}</p>
                        <div className="flex gap-2 mt-3">
                          <span className="rounded bg-primary/10 px-2 py-1 text-xs text-primary">Pattern: {correlation.campaign_hint.inferred_pattern}</span>
                          <span className="rounded bg-muted px-2 py-1 text-xs">Confidence: {Math.round((correlation.campaign_hint.confidence || 0) * 100)}%</span>
                        </div>
                      </div>
                    )}

                    <div className="rounded-xl border border-border bg-card p-6">
                      <h3 className="text-lg font-semibold mb-4">Related Incidents ({correlation?.total_correlated || 0})</h3>
                      {!correlation?.matches?.length ? (
                        <p className="text-muted-foreground">No correlated incidents found</p>
                      ) : (
                        <div className="space-y-3">
                          {correlation.matches.slice(0, 5).map((match, idx) => (
                            <div key={idx} className="rounded-lg border border-border p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-xs text-muted-foreground">{match.artifact_id}</span>
                                <span className={`text-sm font-bold ${match.correlation_score >= 0.5 ? 'text-red-500' : match.correlation_score >= 0.3 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                                  {Math.round(match.correlation_score * 100)}% match
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{match.explanation}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
