"use client";

import { useState } from 'react';
import { Shield, Upload, Link as LinkIcon, FileText, Image as ImageIcon, Mail, MessageSquare, AlertTriangle } from 'lucide-react';
import { SERVER_URL_1 } from '@/utils/commonHelper';

const INPUT_MODES = [
  { id: 'email_text', label: 'Phishing Email', icon: Mail, description: 'Analyze suspicious email content' },
  { id: 'sms_text', label: 'SMS / Smishing', icon: MessageSquare, description: 'Analyze suspicious text messages' },
  { id: 'social_post', label: 'Social Post', icon: MessageSquare, description: 'Analyze social media content' },
  { id: 'url', label: 'URL / Domain', icon: LinkIcon, description: 'Analyze suspicious URLs or domains' },
  { id: 'screenshot', label: 'Screenshot', icon: ImageIcon, description: 'Upload image for OCR analysis' },
  { id: 'attachment', label: 'Attachment / File', icon: FileText, description: 'Analyze files and attachments' },
  { id: 'raw_text', label: 'Raw Text', icon: FileText, description: 'Paste any suspicious content' }
];

export default function AnalyzePage() {
  const [selectedMode, setSelectedMode] = useState(INPUT_MODES[0]);
  const [content, setContent] = useState('');
  const [sourcePlatform, setSourcePlatform] = useState('');
  const [claimedBrand, setClaimedBrand] = useState('');
  const [notes, setNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!content.trim()) {
      setError('Please provide content to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      // First normalize the input
      const normalizeResponse = await fetch(`${SERVER_URL_1}/api/threats/normalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_type: selectedMode.id,
          content: content.trim(),
          metadata: {
            source_platform: sourcePlatform || undefined,
            target_brand: claimedBrand || undefined,
            analyst_notes: notes || undefined
          }
        })
      });

      if (!normalizeResponse.ok) {
        throw new Error('Failed to normalize input');
      }

      const normalizeData = await normalizeResponse.json();

      // Then run full analysis
      const analyzeResponse = await fetch(`${SERVER_URL_1}/api/threats/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifact: normalizeData.artifact,
          options: {
            extract_iocs: true,
            extract_entities: true,
            score_content: true,
            build_graph: true
          }
        })
      });

      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze content');
      }

      const analyzeData = await analyzeResponse.json();
      setAnalysisResult(analyzeData.analysis);

    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setContent('');
    setSourcePlatform('');
    setClaimedBrand('');
    setNotes('');
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Threat Analysis Workbench</h1>
              <p className="text-sm text-muted-foreground">Analyze malicious content, phishing attempts, and digital threats</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Left Panel: Input Configuration */}
          <div className="space-y-6">
            {/* Input Mode Selector */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Analysis Mode</h2>
              <div className="space-y-2">
                {INPUT_MODES.map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = selectedMode.id === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setSelectedMode(mode)}
                      className={`w-full rounded-lg border p-3 text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-background hover:border-primary/50 hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`mt-0.5 h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div>
                          <div className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                            {mode.label}
                          </div>
                          <div className="text-xs text-muted-foreground">{mode.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Metadata */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Optional Context</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Source Platform</label>
                  <input
                    type="text"
                    value={sourcePlatform}
                    onChange={(e) => setSourcePlatform(e.target.value)}
                    placeholder="e.g., Gmail, WhatsApp, Twitter"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Claimed Brand</label>
                  <input
                    type="text"
                    value={claimedBrand}
                    onChange={(e) => setClaimedBrand(e.target.value)}
                    placeholder="e.g., PayPal, Amazon, Bank of America"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Analyst Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional context or observations..."
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Content Input & Results */}
          <div className="space-y-6">
            {/* Content Input */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Content to Analyze</h2>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Paste ${selectedMode.label.toLowerCase()} content here...`}
                rows={12}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
              />

              {error && (
                <div className="mt-4 rounded-lg border border-destructive bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !content.trim()}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Threat'}
                </button>
                <button
                  onClick={handleReset}
                  className="rounded-lg border border-border bg-background px-4 py-2.5 font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Reset
                </button>
              </div>
              
              {analysisResult && (
                <div className="mt-3">
                  <a
                    href={`/chat?context=threat_analysis&artifact_id=${analysisResult.artifact_id}`}
                    className="flex items-center justify-center gap-2 rounded-lg border border-primary bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Discuss in Threat Investigator
                  </a>
                </div>
              )}
            </div>

            {/* Analysis Results */}
            {analysisResult && (
              <div className="space-y-4">
                {/* Risk Score Card */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="mb-4 text-lg font-semibold text-foreground">Risk Assessment</h2>
                  
                  <div className="mb-6 flex items-center gap-6">
                    <div className="flex-shrink-0">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-primary bg-primary/10">
                        <span className="text-3xl font-bold text-primary">{analysisResult.risk_score.overall_score}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Severity:</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                          analysisResult.risk_score.severity === 'critical' ? 'bg-destructive text-destructive-foreground' :
                          analysisResult.risk_score.severity === 'high' ? 'bg-orange-500 text-white' :
                          analysisResult.risk_score.severity === 'medium' ? 'bg-yellow-500 text-white' :
                          'bg-green-500 text-white'
                        }`}>
                          {analysisResult.risk_score.severity}
                        </span>
                      </div>
                      
                      {/* Threat Family Classification */}
                      {analysisResult.classification && (
                        <div className="mb-3 flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">Threat Family:</span>
                          <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase text-primary-foreground">
                            {analysisResult.classification.primary_family.replace(/_/g, ' ')}
                          </span>
                          {analysisResult.total_risk_signals && (
                            <span className="text-xs text-muted-foreground">
                              ({analysisResult.total_risk_signals} risk signals)
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Content Risk</span>
                          <span className="font-semibold text-foreground">{analysisResult.risk_score.content_score}/100</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Infrastructure Risk</span>
                          <span className="font-semibold text-foreground">{analysisResult.risk_score.infrastructure_score}/100</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Behavior Risk</span>
                          <span className="font-semibold text-foreground">{analysisResult.risk_score.behavior_score}/100</span>
                        </div>
                        {analysisResult.risk_score.financial_score > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Financial Risk</span>
                            <span className="font-semibold text-foreground">{analysisResult.risk_score.financial_score}/100</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {analysisResult.risk_score.reasons.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-foreground">Risk Reasons</h3>
                      <ul className="space-y-1.5">
                        {analysisResult.risk_score.reasons.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Indicators */}
                {analysisResult.indicators && analysisResult.indicators.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-6">
                    <h2 className="mb-4 text-lg font-semibold text-foreground">Extracted Indicators ({analysisResult.indicators.length})</h2>
                    
                    {(() => {
                      // Group indicators by type
                      const grouped = analysisResult.indicators.reduce((acc, indicator) => {
                        if (!acc[indicator.type]) acc[indicator.type] = [];
                        acc[indicator.type].push(indicator);
                        return acc;
                      }, {});
                      
                      return (
                        <div className="space-y-4">
                          {Object.entries(grouped).slice(0, 5).map(([type, indicators]) => (
                            <div key={type}>
                              <h3 className="mb-2 text-sm font-semibold text-foreground uppercase">{type}s ({indicators.length})</h3>
                              <div className="space-y-1.5">
                                {indicators.slice(0, 5).map((indicator, idx) => (
                                  <div key={idx} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                                    <div className="flex-1 overflow-hidden">
                                      <div className="truncate font-mono text-sm text-foreground">{indicator.value}</div>
                                      {indicator.attributes && Object.keys(indicator.attributes).length > 0 && (
                                        <div className="mt-0.5 flex gap-1.5">
                                          {Object.entries(indicator.attributes).slice(0, 2).map(([key, val]) => (
                                            val === true && (
                                              <span key={key} className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">
                                                {key.replace(/_/g, ' ')}
                                              </span>
                                            )
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <div className="ml-2 text-xs text-muted-foreground">
                                      {Math.round(indicator.confidence * 100)}%
                                    </div>
                                  </div>
                                ))}
                                {indicators.length > 5 && (
                                  <p className="text-xs text-muted-foreground">+{indicators.length - 5} more {type}s</p>
                                )}
                              </div>
                            </div>
                          ))}
                          {Object.keys(grouped).length > 5 && (
                            <p className="text-center text-sm text-muted-foreground">
                              +{Object.keys(grouped).length - 5} more indicator types
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Entities */}
                {analysisResult.entities && analysisResult.entities.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-6">
                    <h2 className="mb-4 text-lg font-semibold text-foreground">Extracted Entities ({analysisResult.entities.length})</h2>
                    <div className="space-y-2">
                      {analysisResult.entities.slice(0, 10).map((entity, idx) => (
                        <div key={idx} className="rounded-lg border border-border bg-background p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">{entity.value}</span>
                            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                              {entity.entity_type}
                            </span>
                          </div>
                          {entity.role && (
                            <div className="mt-1 text-xs text-muted-foreground">Role: {entity.role}</div>
                          )}
                        </div>
                      ))}
                      {analysisResult.entities.length > 10 && (
                        <p className="text-center text-sm text-muted-foreground">
                          +{analysisResult.entities.length - 10} more entities
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Claims */}
                {analysisResult.claims && analysisResult.claims.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-6">
                    <h2 className="mb-4 text-lg font-semibold text-foreground">Detected Claims ({analysisResult.claims.length})</h2>
                    <div className="space-y-3">
                      {analysisResult.claims.slice(0, 8).map((claim, idx) => (
                        <div key={idx} className="rounded-lg border border-border bg-background p-3">
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <p className="flex-1 text-sm text-foreground">{claim.claim_text}</p>
                            <span className={`flex-shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                              claim.risk_level === 'high' ? 'bg-destructive/10 text-destructive' :
                              claim.risk_level === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
                              'bg-green-500/10 text-green-600'
                            }`}>
                              {claim.risk_level}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">
                              {claim.claim_type.replace(/_/g, ' ')}
                            </span>
                            <span>{Math.round(claim.confidence * 100)}% confidence</span>
                            {claim.risk_score && (
                              <span>Risk: {claim.risk_score}/100</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {analysisResult.claims.length > 8 && (
                        <p className="text-center text-sm text-muted-foreground">
                          +{analysisResult.claims.length - 8} more claims
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Evidence */}
                {analysisResult.evidence && analysisResult.evidence.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-6">
                    <h2 className="mb-4 text-lg font-semibold text-foreground">Evidence Trail ({analysisResult.evidence.length})</h2>
                    <div className="space-y-2">
                      {analysisResult.evidence.map((evidence, idx) => (
                        <div key={idx} className="rounded-lg border border-border bg-background p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              {evidence.evidence_type}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(evidence.confidence * 100)}% confidence
                            </span>
                          </div>
                          <p className="text-sm text-foreground">{evidence.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
