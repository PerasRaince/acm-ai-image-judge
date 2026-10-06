import FormData from 'form-data';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface AIScoreResult {
  final_score: number;
  component_scores: {
    dreamsim: number;
    dino: number;
    clip: number;
    lpips: number;
    color: number;
    quality: number;
  };
  raw_metrics: Record<string, unknown>;
  inference_duration_ms: number;
  device: string;
  scoring_version: string;
  is_exact_reference_match: boolean;
  reference_sha256: string;
  candidate_sha256: string;
  aspect_ratio: number;
}

export class AIScoringService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = env.AI_SERVICE_URL;
  }

  /**
   * Health check to determine if the AI service is responsive.
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Sends reference image buffer and candidate image buffer to AI Service for scoring.
   */
  async scoreImages(params: {
    referenceBuffer: Buffer;
    referenceFilename: string;
    candidateBuffer: Buffer;
    candidateFilename: string;
    requiredAspectRatio?: string;
    scoringVersion?: string;
  }): Promise<AIScoreResult> {
    logger.info(`Dispatching image scoring request to AI service at ${this.baseUrl}/v1/score`);

    const form = new FormData();
    form.append('reference_file', params.referenceBuffer, {
      filename: params.referenceFilename || 'reference.jpg',
      contentType: 'image/jpeg'
    });
    form.append('candidate_file', params.candidateBuffer, {
      filename: params.candidateFilename || 'candidate.jpg',
      contentType: 'image/jpeg'
    });

    if (params.requiredAspectRatio) {
      form.append('required_aspect_ratio', params.requiredAspectRatio);
    }
    if (params.scoringVersion) {
      form.append('scoring_version', params.scoringVersion);
    }

    const response = await fetch(`${this.baseUrl}/v1/score`, {
      method: 'POST',
      body: form.getBuffer() as unknown as BodyInit,
      headers: form.getHeaders()
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error(`AI scoring service returned error (${response.status}): ${errText}`);
      throw new Error(`AI Scoring Service error: ${errText || response.statusText}`);
    }

    const result = (await response.json()) as AIScoreResult;
    logger.info(
      `Scoring succeeded! Final: ${result.final_score}, Duration: ${result.inference_duration_ms}ms, Device: ${result.device}`
    );

    return result;
  }
}

export const aiScoringService = new AIScoringService();
