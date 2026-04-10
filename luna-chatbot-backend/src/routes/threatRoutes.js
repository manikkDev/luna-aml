/**
 * Threat Analysis API Routes
 * 
 * Endpoints for digital threat analysis and investigation.
 */

import express from 'express';

import {
  createThreatAnalysisRequest,
  createThreatAnalysisResult,
  createThreatGraphPayload
} from '../types/threatSchema.js';

import {
  normalizeRawInput,
  extractTextFromArtifact,
  normalizeArtifactMetadata
} from '../helpers/threatNormalizer.js';

import { extractAllIOCs } from '../helpers/iocExtractor.js';
import { extractAllEntities, analyzeContentTone } from '../helpers/entityExtractor.js';
import { computeThreatScore } from '../helpers/threatScorer.js';
import { extractAndClassifyClaims, getClaimSummary } from '../helpers/claimExtractor.js';
import { buildThreatFeatures } from '../helpers/threatFeatureBuilder.js';
import { computeEnhancedThreatScore, THREAT_FAMILIES } from '../helpers/threatScorerV2.js';

const router = express.Router();

/**
 * POST /api/threats/normalize
 * 
 * Accept raw analyst input and convert it into a ThreatArtifact / ThreatAnalysisRequest
 */
router.post('/normalize', async (req, res) => {
  try {
    const { input_type, content, metadata = {} } = req.body;
    
    if (!input_type || !content) {
      return res.status(400).json({
        error: 'Missing required fields: input_type and content'
      });
    }
    
    // Normalize the input
    const artifact = normalizeRawInput(input_type, content, metadata);
    
    // Extract text if needed
    const extraction = await extractTextFromArtifact(artifact);
    if (extraction.extracted_text) {
      artifact.extracted_text = extraction.extracted_text;
    }
    artifact.extraction_method = extraction.extraction_method;
    
    // Normalize metadata
    const normalizedArtifact = normalizeArtifactMetadata(artifact);
    
    // Create analysis request
    const analysisRequest = createThreatAnalysisRequest(normalizedArtifact, {
      extract_iocs: true,
      extract_entities: true,
      score_content: true,
      build_graph: false
    });
    
    res.json({
      success: true,
      artifact: normalizedArtifact,
      analysis_request: analysisRequest
    });
    
  } catch (error) {
    console.error('Normalization error:', error);
    res.status(500).json({
      error: 'Failed to normalize input',
      message: error.message
    });
  }
});

/**
 * POST /api/threats/extract
 * 
 * Extract indicators and entities from normalized content
 */
router.post('/extract', async (req, res) => {
  try {
    const { artifact } = req.body;
    
    if (!artifact) {
      return res.status(400).json({
        error: 'Missing artifact in request body'
      });
    }
    
    // Determine which text to analyze
    const textToAnalyze = artifact.extracted_text || artifact.raw_content || '';
    
    // Extract IOCs with enhanced normalization
    const indicators = extractAllIOCs(textToAnalyze);
    
    // Extract entities
    const entities = extractAllEntities(textToAnalyze, artifact.metadata || {});
    
    // Extract claims
    const claims = extractAndClassifyClaims(textToAnalyze);
    const claimSummary = getClaimSummary(claims);
    
    // Analyze tone
    const toneAnalysis = analyzeContentTone(textToAnalyze);
    
    // Build features
    const features = buildThreatFeatures(textToAnalyze, indicators, entities, claims);
    
    res.json({
      success: true,
      artifact_id: artifact.artifact_id,
      indicators,
      entities,
      claims,
      claim_summary: claimSummary,
      tone_analysis: toneAnalysis,
      features: {
        total_risk_signals: features.total_risk_signals,
        content_features: features.content,
        infrastructure_features: features.infrastructure,
        behavior_features: features.behavior,
        financial_features: features.financial
      },
      extraction_metadata: {
        indicator_count: indicators.length,
        entity_count: entities.length,
        claim_count: claims.length,
        text_length: textToAnalyze.length,
        risk_signals: features.total_risk_signals
      }
    });
    
  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({
      error: 'Failed to extract indicators and entities',
      message: error.message
    });
  }
});

/**
 * POST /api/threats/analyze
 * 
 * Run end-to-end normalized analysis and return score + evidence + extracted items
 */
router.post('/analyze', async (req, res) => {
  try {
    const { artifact, options = {} } = req.body;
    
    if (!artifact) {
      return res.status(400).json({
        error: 'Missing artifact in request body'
      });
    }
    
    // Normalize artifact if needed
    let normalizedArtifact = artifact;
    if (!artifact.metadata?.submission_time) {
      normalizedArtifact = normalizeArtifactMetadata(artifact);
    }
    
    // Extract text if needed
    if (!normalizedArtifact.extracted_text && normalizedArtifact.raw_content) {
      const extraction = await extractTextFromArtifact(normalizedArtifact);
      if (extraction.extracted_text) {
        normalizedArtifact.extracted_text = extraction.extracted_text;
      }
    }
    
    const textToAnalyze = normalizedArtifact.extracted_text || normalizedArtifact.raw_content || '';
    
    // Extract IOCs, entities, and claims
    const indicators = extractAllIOCs(textToAnalyze);
    const entities = extractAllEntities(textToAnalyze, normalizedArtifact.metadata || {});
    const claims = extractAndClassifyClaims(textToAnalyze);
    
    // Compute enhanced threat score with classification
    const scoringResult = computeEnhancedThreatScore(textToAnalyze, indicators, entities, claims);
    
    // Analyze tone
    const toneAnalysis = analyzeContentTone(textToAnalyze);
    
    // Get claim summary
    const claimSummary = getClaimSummary(claims);
    
    // Build result
    const analysisResult = createThreatAnalysisResult(
      normalizedArtifact.artifact_id,
      normalizedArtifact,
      {
        indicators,
        entities,
        risk_score: scoringResult.risk_score,
        evidence: scoringResult.evidence
      }
    );
    
    // Add enhanced analysis data
    analysisResult.tone_analysis = toneAnalysis;
    analysisResult.claims = claims;
    analysisResult.claim_summary = claimSummary;
    analysisResult.features = scoringResult.features;
    analysisResult.classification = scoringResult.classification;
    analysisResult.total_risk_signals = scoringResult.total_risk_signals;
    
    res.json({
      success: true,
      analysis: analysisResult
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze threat',
      message: error.message
    });
  }
});

/**
 * POST /api/threats/graph
 * 
 * Convert the result into a graph payload that the frontend can render
 */
router.post('/graph', async (req, res) => {
  try {
    const { analysis } = req.body;
    
    if (!analysis) {
      return res.status(400).json({
        error: 'Missing analysis in request body'
      });
    }
    
    const nodes = [];
    const edges = [];
    
    // Create artifact node
    const artifactNode = {
      id: `artifact_${analysis.artifact_id}`,
      type: 'artifact',
      label: analysis.artifact_summary.input_type,
      properties: {
        input_type: analysis.artifact_summary.input_type,
        submission_time: analysis.artifact_summary.metadata?.submission_time
      }
    };
    nodes.push(artifactNode);
    
    // Create nodes for indicators
    analysis.indicators.forEach((indicator, idx) => {
      const nodeId = `indicator_${indicator.type}_${idx}`;
      nodes.push({
        id: nodeId,
        type: indicator.type,
        label: indicator.value,
        properties: {
          confidence: indicator.confidence,
          value: indicator.value
        }
      });
      
      // Connect to artifact
      edges.push({
        source: artifactNode.id,
        target: nodeId,
        type: 'CONTAINS',
        properties: { indicator_type: indicator.type }
      });
    });
    
    // Create nodes for entities
    analysis.entities.forEach((entity, idx) => {
      const nodeId = `entity_${entity.entity_type}_${idx}`;
      nodes.push({
        id: nodeId,
        type: entity.entity_type,
        label: entity.value,
        properties: {
          role: entity.role,
          ...entity.attributes
        }
      });
      
      // Connect to artifact
      edges.push({
        source: artifactNode.id,
        target: nodeId,
        type: 'MENTIONS',
        properties: { entity_type: entity.entity_type }
      });
    });
    
    // Create threat graph payload
    const graphPayload = createThreatGraphPayload(nodes, edges, {
      analysis_id: analysis.analysis_id,
      risk_score: analysis.risk_score.overall_score,
      severity: analysis.risk_score.severity
    });
    
    res.json({
      success: true,
      graph: graphPayload
    });
    
  } catch (error) {
    console.error('Graph generation error:', error);
    res.status(500).json({
      error: 'Failed to generate graph',
      message: error.message
    });
  }
});

/**
 * GET /api/threats/health
 * 
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'threat-analysis',
    version: '1.0.0',
    endpoints: [
      '/normalize',
      '/extract',
      '/analyze',
      '/graph'
    ]
  });
});

export default router;
