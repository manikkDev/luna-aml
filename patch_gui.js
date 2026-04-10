const fs = require('fs');
const file = 'client/src/app/analyze/page.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Insert SMS Monitor View before HISTORY VIEW
const historyMarker = "{/* ══ HISTORY VIEW";
const smsMonitorView = `
        {/* ══ SMS MONITOR VIEW ════════════════════════════════════════════════ */}
        {activeView === 'smsMonitor' && (
          <div className="w-full max-w-[1200px] mx-auto px-10 py-8" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-4 border-b border-white/5 gap-4">
              <div>
                <h1 className="text-3xl font-black text-[var(--foreground)] flex items-center gap-3">
                  <Smartphone size={28} className="text-[var(--primary)]"/> 
                  SMS Gateway Monitor
                  {smsActive && <span className="w-3 h-3 rounded-full bg-green-400 inline-block mb-1" style={{ boxShadow: '0 0 16px #34b27b', animation: 'pulseRing 2s infinite' }} />}
                </h1>
                <p className="text-sm text-[var(--muted-foreground)] mt-2 font-medium">
                  {smsActive ? \`Android Webhook Gateway Active · Inspecting payload \${smsLiveFeed.length}\` : 'Connect an Android device via Webhook to stream and analyze incoming SMS messages (Smishing) in real-time.'}
                </p>
              </div>
              <button
                onClick={() => smsActive ? setShowSmsDisconnectModal(true) : setShowSmsModal(true)}
                className={\`inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all border \${
                  smsActive ? 'bg-green-500/10 border-green-500/30 text-[var(--foreground)] hover:bg-green-500/20' : 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] hover:shadow-[0_0_30px_rgba(52,178,123,0.35)]'
                }\`}
              >
                {smsActive ? <><Smartphone size={18} className="text-green-400" /> Active (Sever Connection)</> : <><Smartphone size={18} /> Establish Connection</>}
              </button>
            </div>

            {!smsActive && smsLiveFeed.length === 0 ? (
              <EmptyState icon={Smartphone} title="Gateway Offline" subtitle="Start the Android SMS Gateway listener. The AI engine will passively evaluate SMS texts for Smishing threats as they arrive." />
            ) : (
              <div className="space-y-4">
                {smsLiveFeed.map((item, i) => {
                  const isDel = deletingItems.includes(item.id);
                  const isSel = selectedSmsFeedItem === i;
                  const itemScore = extractScore(item.risk_score) || extractScore(item.ml_classification) || extractScore(item.scoring_breakdown) || 0;
                  return (
                    <div key={item.id}
                      className={\`rounded-2xl border transition-all \${isDel ? 'slide-out' : ''} \${
                        isSel ? 'bg-[#111614] border-[var(--primary)]/40 shadow-[0_10px_40px_rgba(52,178,123,0.08)]' : 'bg-[#111614]/50 border-white/5 hover:border-white/20 hover:bg-[#111614]'
                      }\`}
                      style={!isDel ? { animation: \`slideInUp 0.4s ease \${i * 0.04}s both\` } : {}}
                    >
                      {/* Condensed Header */}
                      <div className="flex items-center gap-5 p-5 cursor-pointer" onClick={() => setSelectedSmsFeedItem(isSel ? null : i)}>
                        <div className="flex-shrink-0">
                          <SeverityBadge severity={item.ml_classification?.severity || 'medium'} large />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-[var(--foreground)] truncate flex items-center gap-2">
                            {item.sms?.text?.substring(0, 80) || 'NO CONTENT'}...
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)] mt-1.5 font-mono truncate">
                            FROM: <span className="text-[var(--foreground)]">{item.sms?.from || 'Unknown Sender'}</span>
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-[10px] font-mono text-[var(--muted-foreground)] tracking-widest uppercase mb-1">Threat Index</p>
                            <p className="text-2xl font-black tabular-nums">{itemScore}<span className="text-xs text-[var(--muted-foreground)] font-medium">/100</span></p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-[var(--muted-foreground)] bg-white/5 px-2 py-1 rounded-lg flex items-center gap-1.5">
                              <Clock size={12}/> {new Date(item.timestamp).toLocaleTimeString()}
                            </span>
                            <button onClick={(e) => { e.stopPropagation(); deleteSmsFeedItem(item.id); }} className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-400 transition-colors" title="Purge Record">
                              <Trash2 size={16} />
                            </button>
                            <ChevronDown size={20} className={\`text-[var(--muted-foreground)] transition-transform duration-300 \${isSel ? 'rotate-180' : ''}\`} />
                          </div>
                        </div>
                      </div>

                      {/* Expanded Forensic Detail */}
                      {isSel && (
                        <div className="px-5 pb-5 pt-2 border-t border-white/5" style={{ animation: 'fadeIn 0.3s ease' }}>
                          <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 mt-4">
                            {/* Detailed Info */}
                            <div className="space-y-5">
                              <div className="flex gap-4">
                                <div className="flex-1 bg-[#161c1a] p-4 rounded-xl border border-white/5">
                                  <p className="text-[10px] font-mono text-[var(--muted-foreground)] uppercase mb-1">AI Verdict</p>
                                  <p className="text-sm font-bold text-[var(--primary)] uppercase">{item.ml_classification?.predicted_class?.replace(/_/g, ' ') || 'Unknown'}</p>
                                </div>
                                <div className="flex-1 bg-[#161c1a] p-4 rounded-xl border border-white/5">
                                  <p className="text-[10px] font-mono text-[var(--muted-foreground)] uppercase mb-1">Model Confidence</p>
                                  <p className="text-sm font-bold font-mono text-[var(--foreground)]">{item.ml_classification?.confidence ? \`\${(item.ml_classification.confidence * 100).toFixed(2)}%\` : 'N/A'}</p>
                                </div>
                                <div className="flex-1 bg-[#161c1a] p-4 rounded-xl border border-white/5">
                                  <p className="text-[10px] font-mono text-[var(--muted-foreground)] uppercase mb-1">IOCs Discovered</p>
                                  <p className="text-sm font-bold font-mono text-[var(--foreground)]">{item.indicator_summary?.total || 0}</p>
                                </div>
                              </div>

                              <div>
                                <p className="text-[11px] font-bold text-[var(--foreground)] uppercase mb-2 flex items-center gap-2"><Smartphone size={14} className="text-[var(--primary)]"/> Raw SMS Payload</p>
                                <div className="p-4 rounded-xl bg-black/40 border border-white/5 max-h-[250px] overflow-y-auto custom-scrollbar">
                                  <pre className="text-sm font-mono text-[var(--muted-foreground)] whitespace-pre-wrap leading-relaxed">{item.sms?.text || 'No readable body content extracted.'}</pre>
                                </div>
                              </div>
                            </div>
                            
                            {/* Evidence / Features */}
                            <div className="space-y-4">
                              <div className="bg-[#161c1a] p-4 rounded-xl border border-white/5">
                                <p className="text-[11px] font-bold text-[var(--foreground)] uppercase mb-4 flex items-center gap-2"><Brain size={14} className="text-[var(--primary)]"/> Conviction Evidence</p>
                                {item.conviction_reasons?.length > 0 ? (
                                  <div className="space-y-3">
                                    {item.conviction_reasons.slice(0, 3).map((r, idx) => (
                                      <div key={idx} className="flex flex-col gap-1 text-xs">
                                        <span className={\`font-bold \${r.severity === 'critical' ? 'text-red-400' : r.severity === 'high' ? 'text-orange-400' : 'text-yellow-400'}\`}>{r.category}</span>
                                        <span className="text-[10px] text-[var(--muted-foreground)] leading-relaxed">{r.detail}</span>
                                      </div>
                                    ))}
                                    <button onClick={() => loadHistoryItemToAnalyze(item)} className="w-full mt-4 py-2 text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 rounded-lg transition-colors border border-[var(--primary)]/20">
                                      Load Full Forensic View
                                    </button>
                                  </div>
                                ) : <p className="text-xs text-[var(--muted-foreground)]">No direct feature evidence attached to feed object.</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

`;
content = content.replace(historyMarker, smsMonitorView + historyMarker);

// 2. Insert SMS Modals before Analysis Loading Overlay
const overlayMarker = "{/* Analysis Loading Overlay */";
const smsModals = `
      {/* SMS Disconnect Confirmation Modal */}
      {showSmsDisconnectModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md" style={{ animation: 'fadeIn 0.2s ease' }}>
          <div className="w-full max-w-sm mx-4 bg-[#111614] rounded-3xl border border-white/10 shadow-2xl p-6 text-center" style={{ animation: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 mx-auto flex items-center justify-center mb-4">
              <Smartphone size={28} />
            </div>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Disable Gateway?</h2>
            <p className="text-sm text-[var(--muted-foreground)] mb-8">This will immediately reject HTTP webhooks from the Android SMS Gateway. Incoming messages will not be analyzed.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowSmsDisconnectModal(false)} className="flex-1 py-3 rounded-xl text-sm font-bold border border-white/10 bg-white/5 hover:bg-white/10 text-[var(--foreground)] transition-all">Cancel</button>
              <button onClick={handleSmsDisconnect} className="flex-1 py-3 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all">Sever Status</button>
            </div>
          </div>
        </div>
      )}

      {/* SMS Connect Modal */}
      {showSmsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md" style={{ animation: 'fadeIn 0.2s ease' }}>
          <div className="w-full max-w-lg mx-4 rounded-3xl border border-[var(--primary)]/20 bg-[#0a0f0d] shadow-2xl overflow-hidden" style={{ animation: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <div className="px-8 py-6 border-b border-white/5 bg-[var(--primary)]/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20"><Smartphone size={24} className="text-[var(--primary)]" /></div>
                <div>
                  <h2 className="text-lg font-black text-[var(--foreground)]">Wire Android SMS Gateway</h2>
                  <p className="text-xs text-[var(--primary)] font-mono uppercase tracking-widest mt-0.5">Webhook Ingestion Port</p>
                </div>
              </div>
              <button onClick={() => setShowSmsModal(false)} className="p-2 rounded-xl hover:bg-white/10 text-[var(--muted-foreground)] hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <div className="p-8 space-y-5 bg-[#111614]">
              <div className="bg-white/5 border border-[var(--primary)]/20 p-4 rounded-xl flex items-start gap-4">
                <Brain size={24} className="text-[var(--primary)] mt-1 flex-shrink-0" />
                <div>
                  <p className="text-[13px] text-[var(--foreground)] font-bold mb-1">Local ML Smishing Classification</p>
                  <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                    SMS messages forwarded to this gateway are processed by an offline Gradient Boosting Machine Learning model trained on 3,000+ Smishing and benign text samples. It assesses 25 separate linguistic anomalies (urgency scores, payload composition, link obfuscation ratios) within ~50ms, achieving 96% validation accuracy without sending data to external AI APIs.
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-[var(--muted-foreground)] mb-2 block uppercase tracking-wider">Android Webhook Configuration Instructions</label>
                <ol className="list-decimal pl-4 space-y-2 text-xs text-[var(--muted-foreground)] leading-relaxed mb-4">
                  <li>Download the <strong className="text-white">"SMS to URL Forwarder"</strong> or similar Webhook app on your Android Phone.</li>
                  <li>In the app, set up a new filter to forward <strong className="text-white">ALL incoming SMS</strong>.</li>
                  <li>Copy the following Webhook URL exactly and paste it as the target HTTP endpoint:</li>
                </ol>
                <div className="flex cursor-pointer hover:opacity-80 transition-opacity" onClick={() => { navigator.clipboard.writeText('http://192.168.0.100:5001/api/sms/webhook'); alert('Webhook URL copied to clipboard'); }}>
                  <div className="bg-black border border-white/20 border-r-0 rounded-l-xl px-4 py-3 flex-1 flex items-center overflow-x-auto">
                    <span className="text-[13px] font-mono text-[var(--primary)] whitespace-nowrap select-all tracking-wider">http://192.168.0.100:5001/api/sms/webhook</span>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-r-xl px-4 flex items-center justify-center hover:bg-white/20">
                    <Copy size={16} className="text-white font-bold" />
                  </div>
                </div>
              </div>
              
              <button onClick={handleSmsConnect}
                className="w-full mt-4 py-4 rounded-xl text-sm font-black uppercase tracking-wider bg-[var(--primary)] text-[var(--primary-foreground)] hover:shadow-[0_0_40px_rgba(52,178,123,0.4)] transition-all">
                Activate Webhook Listener
              </button>
            </div>
          </div>
        </div>
      )}

`;
content = content.replace(overlayMarker, smsModals + overlayMarker);

fs.writeFileSync(file, content);
console.log('Patch complete.');
