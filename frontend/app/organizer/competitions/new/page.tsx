'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../../lib/apiClient';
import { Upload, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function NewCompetitionPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [startsAt, setStartsAt] = useState(new Date().toISOString().slice(0, 16));
  const [endsAt, setEndsAt] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [submissionLimit, setSubmissionLimit] = useState(3);
  const [visibility, setVisibility] = useState('public');

  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setReferenceFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!referenceFile) {
      setErrorMsg('Reference image file is required.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('rules', rules);
      formData.append('required_aspect_ratio', aspectRatio);
      formData.append('starts_at', new Date(startsAt).toISOString());
      formData.append('ends_at', new Date(endsAt).toISOString());
      formData.append('submission_limit', submissionLimit.toString());
      formData.append('leaderboard_visibility', visibility);
      formData.append('reference_image', referenceFile);

      const created = await apiClient.createCompetition(formData);
      router.push(`/organizer/competitions/${created.id}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create competition');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/organizer"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Organizer Studio</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Create New AI Competition
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Upload your target reference image and configure rules, aspect ratio, and deadlines.
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Reference Image Dropzone */}
        <div className="space-y-2">
          <label className="text-zinc-300 font-medium">Target Reference Image (Benchmark)</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative aspect-video max-h-80 w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
              previewUrl
                ? 'border-zinc-700 bg-zinc-950'
                : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900/60'
            }`}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Selected reference preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <Upload className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-zinc-200">
                    Click to select reference image
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    High resolution JPEG, PNG, or WebP up to 25MB
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
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-zinc-300 font-medium" htmlFor="title">
              Competition Title
            </label>
            <input
              id="title"
              type="text"
              required
              minLength={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cyberpunk Neon Portrait Recreation"
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-zinc-300 font-medium" htmlFor="description">
              Description & Objectives
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the goals of the recreation challenge and desired visual nuances..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-zinc-300 font-medium" htmlFor="rules">
              Rules & Guidelines
            </label>
            <textarea
              id="rules"
              rows={2}
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="e.g. Any generator allowed (Midjourney, Flux, SD). No post-generation Photoshop."
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-300 font-medium">Required Aspect Ratio</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="any">Any Aspect Ratio</option>
              <option value="1:1">1:1 (Square)</option>
              <option value="16:9">16:9 (Landscape)</option>
              <option value="9:16">9:16 (Portrait / Story)</option>
              <option value="4:3">4:3 (Classic Landscape)</option>
              <option value="3:4">3:4 (Classic Portrait)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-300 font-medium">Max Attempts Per Participant</label>
            <input
              type="number"
              min={1}
              max={20}
              value={submissionLimit}
              onChange={(e) => setSubmissionLimit(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-300 font-medium">Starts At</label>
            <input
              type="datetime-local"
              required
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-300 font-medium">Ends At</label>
            <input
              type="datetime-local"
              required
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !referenceFile}
          className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold transition-colors shadow-lg shadow-blue-600/20"
        >
          {loading ? 'Creating Competition...' : 'Launch Competition'}
        </button>
      </form>
    </div>
  );
}
