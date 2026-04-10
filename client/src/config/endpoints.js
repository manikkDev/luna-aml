/**
 * endpoints.js
 *
 * Centralized backend endpoint configuration for Track 4 Luna platform.
 * 
 * Architecture note:
 * - LUNA_API: Main chatbot backend (port 5001) - handles chat, auth, threats, alerts, cases
 * - GRAPH_API: Legacy backend (port 5002) - provides Neo4j graph endpoints (transitional)
 * - ML_API: Python ML server (port 8000) - pattern classification for AML P1-P6
 */

// Main Luna chatbot backend (primary product backend)
export const LUNA_API = process.env.LUNA_API_URL || 
                        process.env.NEXT_PUBLIC_LUNA_API_URL || 
                        'http://localhost:5001';

// Legacy graph backend (transitional - will be migrated to LUNA_API)
export const GRAPH_API = process.env.NEXT_PUBLIC_GRAPH_API_URL || 
                         'http://localhost:5002';

// ML classification server
export const ML_API = process.env.NEXT_PUBLIC_ML_API_URL || 
                      'http://localhost:8000';

// Convenience exports for common patterns
export const ENDPOINTS = {
  // Chat & Conversations
  chat: `${LUNA_API}/api/chat`,
  chatStream: `${LUNA_API}/api/chat/stream`,
  conversations: `${LUNA_API}/api/conversations`,
  
  // Auth
  auth: `${LUNA_API}/api/auth`,
  users: `${LUNA_API}/api/users`,
  
  // Threat Analysis
  threats: `${LUNA_API}/api/threats`,
  threatsNormalize: `${LUNA_API}/api/threats/normalize`,
  threatsAnalyze: `${LUNA_API}/api/threats/analyze`,
  threatsGraph: `${LUNA_API}/api/threats/graph`,
  threatsCorrelate: `${LUNA_API}/api/threats/correlate`,
  
  // Alerts & Watchlist
  alerts: `${LUNA_API}/api/alerts`,
  alertsStream: `${LUNA_API}/api/alerts/stream`,
  watchlist: `${LUNA_API}/api/alerts/watchlist`,
  
  // Cases
  cases: `${LUNA_API}/api/cases`,
  
  // Actions
  actions: `${LUNA_API}/api/actions`,
  
  // Graph (legacy - transitional)
  graphQuery: `${GRAPH_API}/api/graph/query`,
  graphVisualize: `${GRAPH_API}/api/graph/visualize`,
  
  // ML Classification
  mlClassify: `${ML_API}/classify`,
  mlThreatClassify: `${ML_API}/threat/classify`,
  mlThreatHealth: `${ML_API}/threat/health`,
  
  // Email Monitoring
  emailConnect: `${LUNA_API}/api/email/connect`,
  emailDisconnect: `${LUNA_API}/api/email/disconnect`,
  emailStatus: `${LUNA_API}/api/email/status`,
  emailFeed: `${LUNA_API}/api/email/feed`,
  emailHistory: `${LUNA_API}/api/email/history`,
};

// Export individual APIs for backward compatibility
export const SERVER_URL_1 = LUNA_API;  // Preferred name going forward
export const SERVER_URL = GRAPH_API;    // Legacy name, will be phased out

export default ENDPOINTS;
