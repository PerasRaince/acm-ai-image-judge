'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '../../../../lib/apiClient';
import { Competition, Submission, Score } from '../../../../types';
import { ScoreBadge } from '../../../../components/ScoreBadge';
import { MetricBar } from '../../../../components/MetricBar';
import { ImageComparison } from '../../../../components/ImageComparison';
import { Upload, ArrowLeft, AlertCircle, CheckCircle2, Sparkles, Trophy } from 'lucide-react';

export default function SubmitRecreationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileDimensions, setFileDimensions] = useState<{ width: number; height: number; ratio: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ submission: Submission; score: Score } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const comp = await apiClient.getCompetition(id);
        setCompetition(comp);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load competition');
      }
    }
    load();
  }, [id]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSelectedFile(file);

    // Create object URL for local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Inspect image dimensions in browser
    const img = new Image();
    img.onload = () => {
      setFileDimensions({
        width: img.width,
        height: img.height,
        ratio: Math.round((img.width / img.height) * 100) / 100
      });
    };
    img.src = objectUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile || !competition) return;

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('recreation_image', selectedFile);

      const result = await apiClient.submitRecreation(competition.id, formData);
      setSubmissionResult(result);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (!competition) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-zinc-400 text-xs">
        Loading competition data...
      </div>
    );
  }

  const attemptsRemaining = competition.submission_limit - (competition.attempts_used || 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href={`/competitions/${competition.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to {competition.title}</span>
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Submit AI Recreation
        </h1>
        <p className="text-xs text-zinc-400">
          Upload your recreation image. Our versioned multi-metric AI scoring engine will evaluate it against the reference benchmark.
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Result Card: Shown when scoring completes */}
      {submissionResult && submissionResult.score && (
        <div className="rounded-2xl border border-emerald-500/30 bg-zinc-900/80 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <h2 className="text-xl font-bold text-white">Evaluation Complete!</h2>
              </div>
              <p className="text-xs text-zinc-400">
                Deterministic versioned evaluation computed in {submissionResult.score.inference_duration_ms}ms on {submissionResult.score.device}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ScoreBadge score={submissionResult.score.final_score} size="xl" />
            </div>
          </div>

          {/* Visual Comparison */}
          <ImageComparison
            referenceUrl={competition.reference_image_url || ''}
            candidateUrl={previewUrl || ''}
          />

          {/* Detailed Metric Bars */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Explainable Component Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <MetricBar
                label="DreamSim Perceptual Similarity"
                score={submissionResult.score.dreamsim_score}
                weight={0.35}
                description="Human-perceptual similarity distance"
              />
              <MetricBar
                label="DINOv2 Structural Correspondence"
                score={submissionResult.score.dino_score}
                weight={0.30}
                description="Layout and object boundary correspondence"
              />
              <MetricBar
                label="OpenCLIP Semantic Match"
                score={submissionResult.score.clip_score}
                weight={0.15}
                description="High-level subject matter and concept embedding"
              />
              <MetricBar
                label="LPIPS Texture Fidelity"
                score={submissionResult.score.lpips_score}
                weight={0.10}
                description="Micro-texture and edge patch similarity"
              />
              <MetricBar
                label="Color Distribution"
                score={submissionResult.score.color_score}
                weight={0.05}
                description="CIE L*a*b* & HSV palette consistency"
              />
              <MetricBar
                label="Technical Quality"
                score={submissionResult.score.quality_score}
                weight={0.05}
                description="Sharpness and dynamic range integrity"
              />
            </div>
          </div>

          <div className="pt-4 flex flex-wrap gap-3">
            <Link
              href={`/competitions/${competition.id}/leaderboard`}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Trophy className="h-4 w-4" />
              <span>View Ranked Leaderboard</span>
            </Link>
            <button
              onClick={() => {
                setSubmissionResult(null);
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              className="px-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
            >
              Submit Another Attempt
            </button>
          </div>
        </div>
      )}

      {/* Upload Form: Shown when not yet submitted */}
      {!submissionResult && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Target Reference preview */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-zinc-400">Target Reference Image</span>
              <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center">
                {competition.reference_image_url ? (
                  <img
                    src={competition.reference_image_url}
                    alt="Benchmark"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-zinc-600">No reference image</span>
                )}
              </div>
            </div>

            {/* Candidate Recreation Upload dropzone */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-zinc-400">Your Recreation File</span>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative aspect-square w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
                  previewUrl
                    ? 'border-zinc-700 bg-zinc-950'
                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900/60'
                }`}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Uploaded candidate preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-zinc-200">
                        Click to browse or drop recreation image
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        JPEG, PNG, or WebP up to 25MB
                      </p>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {fileDimensions && (
                <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 font-mono">
                  <span>{fileDimensions.width} x {fileDimensions.height} px</span>
                  <span>Aspect ratio: {fileDimensions.ratio}:1</span>
                </div>
              )}
            </div>
          </div>

          {/* Submission button */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-400">
              {attemptsRemaining > 0 ? `${attemptsRemaining} attempts left` : 'No attempts left'}
            </span>

            <button
              type="submit"
              disabled={submitting || !selectedFile || attemptsRemaining <= 0}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <Sparkles className="h-4 w-4" />
              <span>{submitting ? 'Scoring Recreation with AI Models...' : 'Submit & Score'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
