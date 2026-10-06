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

import { supabase } from '../../../../lib/supabaseClient';

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
  const [joining, setJoining] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/login?returnUrl=${encodeURIComponent(`/competitions/${id}/submit`)}`);
        return;
      }

      try {
        const comp = await apiClient.getCompetition(id);
        setCompetition(comp);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load competition');
      }
    }
    load();
  }, [id, router]);

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

  function cropToRequiredRatio() {
    if (!previewUrl || !selectedFile || !competition) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const req = competition.required_aspect_ratio;
      let targetRatio = 1.0;
      if (req === '16:9') targetRatio = 16 / 9;
      else if (req === '9:16') targetRatio = 9 / 16;
      else if (req === '4:3') targetRatio = 4 / 3;
      else if (req === '3:4') targetRatio = 3 / 4;

      const currentRatio = img.width / img.height;
      let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;

      if (currentRatio > targetRatio) {
        srcW = img.height * targetRatio;
        srcX = (img.width - srcW) / 2;
      } else {
        srcH = img.width / targetRatio;
        srcY = (img.height - srcH) / 2;
      }

      canvas.width = Math.min(Math.round(srcW), 2048);
      canvas.height = Math.min(Math.round(srcH), 2048);

      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const croppedFile = new File([blob], selectedFile.name.replace(/\.[^/.]+$/, '') + '_cropped.jpg', {
          type: 'image/jpeg'
        });
        setSelectedFile(croppedFile);
        const newUrl = URL.createObjectURL(croppedFile);
        setPreviewUrl(newUrl);
        setFileDimensions({
          width: canvas.width,
          height: canvas.height,
          ratio: Math.round((canvas.width / canvas.height) * 100) / 100
        });
        setErrorMsg(null);
      }, 'image/jpeg', 0.95);
    };
    img.src = previewUrl;
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
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400 text-xs">
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
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to {competition.title}</span>
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Submit AI Recreation
        </h1>
        <p className="text-xs text-slate-400">
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
        <div className="rounded-2xl border border-emerald-500/30 bg-[#0B1D35]/90 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#002B49] pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <h2 className="text-xl font-bold text-white">Evaluation Complete!</h2>
              </div>
              <p className="text-xs text-slate-400">
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
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0085CA] to-[#005A8C] hover:from-[#0096E6] hover:to-[#006BA6] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-[#0085CA]/20 active:scale-95"
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
              className="px-4 py-2.5 rounded-xl border border-[#002B49] bg-[#002B49] hover:bg-[#003860] text-slate-200 text-xs font-semibold transition-colors"
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
              <span className="text-xs font-medium text-slate-400">Target Reference Image</span>
              <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-[#002B49] bg-[#040C16] flex items-center justify-center">
                {competition.reference_image_url ? (
                  <img
                    src={competition.reference_image_url}
                    alt="Benchmark"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-500">No reference image</span>
                )}
              </div>
            </div>

            {/* Candidate Recreation Upload dropzone */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-400">Your Recreation File</span>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative aspect-square w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
                  previewUrl
                    ? 'border-[#0085CA]/40 bg-[#040C16]'
                    : 'border-[#002B49] hover:border-[#0085CA] bg-[#0B1D35]/40 hover:bg-[#0B1D35]/70'
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
                    <div className="mx-auto w-12 h-12 rounded-full bg-[#002B49] flex items-center justify-center text-[#00A3E0]">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-200">
                        Click to browse or drop recreation image
                      </p>
                      <p className="text-[11px] text-slate-400">
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
                    <span>{fileDimensions.width} x {fileDimensions.height} px</span>
                    <span>Aspect ratio: {fileDimensions.ratio}:1</span>
                  </div>

                  {competition.required_aspect_ratio &&
                    competition.required_aspect_ratio !== 'any' &&
                    (() => {
                      const req = competition.required_aspect_ratio;
                      const target = req === '1:1' ? 1.0 : req === '16:9' ? 16 / 9 : req === '9:16' ? 9 / 16 : req === '4:3' ? 4 / 3 : req === '3:4' ? 3 / 4 : 1.0;
                      const isMismatch = Math.abs(fileDimensions.ratio - target) / target > 0.08;
                      if (!isMismatch) return null;
                      return (
                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between gap-2">
                          <span>
                            Ratio is {fileDimensions.ratio}:1, but this competition requires <strong>{req}</strong>.
                          </span>
                          <button
                            type="button"
                            onClick={cropToRequiredRatio}
                            className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors shrink-0 shadow"
                          >
                            Auto-Crop to {req}
                          </button>
                        </div>
                      );
                    })()}
                </div>
              )}
            </div>
          </div>

          {/* Submission button */}
          <div className="pt-4 border-t border-[#002B49] flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {attemptsRemaining > 0 ? `${attemptsRemaining} attempts left` : 'No attempts left'}
            </span>

            <button
              type="submit"
              disabled={submitting || !selectedFile || attemptsRemaining <= 0}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#0085CA] to-[#005A8C] hover:from-[#0096E6] hover:to-[#006BA6] disabled:opacity-50 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-md shadow-[#0085CA]/20 active:scale-95"
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
