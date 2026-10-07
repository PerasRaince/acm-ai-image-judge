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

export function normalizeAiServiceUrl(rawUrl?: string): string {
  if (!rawUrl) return 'http://localhost:7860';
  let url = rawUrl.trim().replace(/\/$/, '');

  // If user pasted Hugging Face Space page URL:
  // e.g. https://huggingface.co/spaces/username/space-name
  const hfMatch = url.match(/huggingface\.co\/spaces\/([^/]+)\/([^/]+)/);
  if (hfMatch) {
    const owner = hfMatch[1].toLowerCase().replace(/_/g, '-');
    const name = hfMatch[2].toLowerCase().replace(/_/g, '-');
    url = `https://${owner}-${name}.hf.space`;
  }

  return url;
}

export class AIScoringService {
  /**
   * Dynamically resolves the active AI service URL (supports Hugging Face Spaces & localhost).
   */
  public get baseUrl(): string {
    return normalizeAiServiceUrl(process.env.AI_SERVICE_URL || env.AI_SERVICE_URL);
  }

  /**
   * Health check to determine if the AI service is responsive.
   */
  async checkHealth(): Promise<boolean> {
    const endpoint = this.baseUrl;
    try {
      const response = await fetch(`${endpoint}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000)
      });
      return response.ok;
    } catch (err) {
      logger.warn(`AI service health check failed at ${endpoint}/health: ${(err as Error).message}`);
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

    const formBuffer = form.getBuffer();
    const headers = {
      ...form.getHeaders(),
      'Content-Length': String(formBuffer.length)
    };

    let lastError: Error | null = null;
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        logger.info(`Dispatching image scoring attempt ${attempt}/${maxAttempts} to ${this.baseUrl}/v1/score`);

        const response = await fetch(`${this.baseUrl}/v1/score`, {
          method: 'POST',
          body: formBuffer as unknown as BodyInit,
          headers,
          signal: AbortSignal.timeout(180000)
        });

        if (!response.ok) {
          const errText = await response.text();
          logger.error(`AI scoring service returned error (${response.status}): ${errText}`);
          if (response.status === 502 || response.status === 503 || response.status === 504) {
            throw new Error('AI service gateway timeout or warming up (502/503). The models may still be downloading.');
          }
          try {
            const parsed = JSON.parse(errText);
            if (parsed.detail) {
              throw new Error(parsed.detail);
            }
          } catch {
            // Not json, throw text
          }
          throw new Error(`AI Scoring Service error: ${errText || response.statusText}`);
        }

        const result = (await response.json()) as AIScoreResult;
        logger.info(
          `Scoring succeeded! Final: ${result.final_score}, Duration: ${result.inference_duration_ms}ms, Device: ${result.device}`
        );

        return result;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const errMsg = lastError.message.toLowerCase();
        const isNetworkGlitch =
          errMsg.includes('terminated') ||
          errMsg.includes('fetch failed') ||
          errMsg.includes('econnreset') ||
          errMsg.includes('socket') ||
          errMsg.includes('gateway timeout') ||
          errMsg.includes('502') ||
          errMsg.includes('503');

        if (attempt < maxAttempts && isNetworkGlitch) {
          logger.warn(`AI scoring connection attempt ${attempt} interrupted (${lastError.message}). Retrying in 2.5s...`);
          await new Promise((resolve) => setTimeout(resolve, 2500));
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new Error('Failed to score images after retry attempts.');
  }
}

export const aiScoringService = new AIScoringService();
