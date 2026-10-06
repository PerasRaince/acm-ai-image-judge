'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { apiClient } from '../../../lib/apiClient';
import { Competition } from '../../../types';
import { Upload, ArrowLeft, AlertCircle, CheckCircle2, Copy, Check, Sparkles, ArrowRight } from 'lucide-react';

export default function CreateCompetitionPage() {
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
  const [visibility, setVisibility] = useState<'public' | 'hidden_until_close' | 'participants_only'>('public');

  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdComp, setCreatedComp] = useState<Competition | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push(`/login?returnUrl=${encodeURIComponent('/competitions/create')}`);
      } else {
        setCheckingAuth(false);
      }
    });
  }, [router]);

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
      setErrorMsg('Target reference image file is required.');
      return;
    }

    if (new Date(endsAt) <= new Date(startsAt)) {
      setErrorMsg('Competition end deadline must be after start time.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('rules', rules.trim());
      formData.append('required_aspect_ratio', aspectRatio);
      formData.append('starts_at', new Date(startsAt).toISOString());
      formData.append('ends_at', new Date(endsAt).toISOString());
      formData.append('submission_limit', submissionLimit.toString());
      formData.append('leaderboard_visibility', visibility);
      formData.append('reference_image', referenceFile);

      const created = await apiClient.createCompetition(formData);
      setCreatedComp(created);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create competition');
    } finally {
      setLoading(false);
    }
  }

  const copyToClipboard = (text: string, isLink: boolean) => {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center">
        <div className="text-slate-400 text-sm">Checking authentication...</div>
      </div>
    );
  }

  // Success view with shareable code & link
  if (createdComp) {
    const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${createdComp.code}`;

    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-[#0B1D35]/90 border border-[#002B49] rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Competition Created!
            </h1>
            <p className="text-xs text-slate-400">
              Your competition <strong className="text-slate-200">{createdComp.title}</strong> is live and ready for contestants.
            </p>
          </div>

          {/* Unique Competition Code Box */}
          <div className="bg-[#071527] border border-[#002B49] rounded-2xl p-5 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Competition Code
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(createdComp.code, false)}
                className="inline-flex items-center gap-1.5 text-xs text-[#00A3E0] hover:text-sky-300 font-medium transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-[#00A3E0] tracking-wider">
              {createdComp.code}
            </div>
            <p className="text-[11px] text-slate-400">
              Contestants can join directly by entering this code on the homepage or dashboard.
            </p>
          </div>

          {/* Invitation Link Box */}
          <div className="bg-[#071527] border border-[#002B49] rounded-2xl p-5 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Shareable Invitation Link
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(inviteUrl, true)}
                className="inline-flex items-center gap-1.5 text-xs text-[#00A3E0] hover:text-sky-300 font-medium transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
            <div className="text-xs font-mono text-slate-300 truncate bg-[#0B1D35] px-3 py-2.5 rounded-lg border border-[#002B49]">
              {inviteUrl}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href={`/competitions/${createdComp.id}`}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#0085CA] to-[#005A8C] hover:from-[#0096E6] hover:to-[#006BA6] text-white font-semibold text-xs transition-all shadow-md shadow-[#0085CA]/20 inline-flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Go to Competition</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#002B49] hover:bg-[#003860] border border-[#0085CA]/20 text-slate-200 font-semibold text-xs transition-all"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-2 text-[#00A3E0] text-xs font-semibold mb-1 uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Host a Challenge</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Create Competition
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Upload a target reference image. An invitation code and shareable link will be generated automatically.
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
          <label className="text-slate-300 font-medium">
            Target Reference Image <span className="text-rose-400">*</span>
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#002B49] hover:border-[#0085CA] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-[#0B1D35]/50 hover:bg-[#0B1D35]/80 transition-all text-center min-h-[220px]"
          >
            {previewUrl ? (
              <div className="space-y-3">
                <div className="relative w-44 h-44 mx-auto rounded-xl overflow-hidden border border-[#002B49] shadow-md">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="text-[11px] text-slate-400">Click to change target image</p>
              </div>
            ) : (
              <div className="space-y-2 flex flex-col items-center">
                <div className="p-3.5 rounded-2xl bg-[#0085CA]/15 text-[#00A3E0] border border-[#0085CA]/30">
                  <Upload className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-200">
                    Upload high-resolution reference image
                  </p>
                  <p className="text-slate-400 text-[11px]">PNG, JPEG, or WebP up to 15MB</p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Basic Details */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium" htmlFor="title">
              Competition Title <span className="text-rose-400">*</span>
            </label>
            <input
              id="title"
              type="text"
              required
              minLength={3}
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cyberpunk Neon Cathedral Recreation"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#040C16] border border-[#002B49] text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0085CA]/50 focus:border-[#0085CA] transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium" htmlFor="description">
              Description & Context
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the challenge, themes, or style instructions..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#040C16] border border-[#002B49] text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0085CA]/50 focus:border-[#0085CA] transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium" htmlFor="rules">
              Rules & Guidelines
            </label>
            <textarea
              id="rules"
              rows={3}
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="e.g. Only Midjourney v6 or Stable Diffusion models allowed. No exact reference modifications."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#040C16] border border-[#002B49] text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0085CA]/50 focus:border-[#0085CA] transition-all"
            />
          </div>
        </div>

        {/* Competition Rules & Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium" htmlFor="aspectRatio">
              Required Aspect Ratio
            </label>
            <select
              id="aspectRatio"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#040C16] border border-[#002B49] text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0085CA]/50 focus:border-[#0085CA]"
            >
              <option value="any">Any Aspect Ratio</option>
              <option value="1:1">1:1 (Square)</option>
              <option value="16:9">16:9 (Landscape)</option>
              <option value="4:3">4:3 (Landscape)</option>
              <option value="9:16">9:16 (Portrait)</option>
              <option value="3:4">3:4 (Portrait)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium" htmlFor="submissionLimit">
              Max Attempts per Contestant
            </label>
            <input
              id="submissionLimit"
              type="number"
              min={1}
              max={50}
              value={submissionLimit}
              onChange={(e) => setSubmissionLimit(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#040C16] border border-[#002B49] text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0085CA]/50 focus:border-[#0085CA]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium" htmlFor="startsAt">
              Start Date & Time
            </label>
            <input
              id="startsAt"
              type="datetime-local"
              required
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#040C16] border border-[#002B49] text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0085CA]/50 focus:border-[#0085CA]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium" htmlFor="endsAt">
              End Date & Time
            </label>
            <input
              id="endsAt"
              type="datetime-local"
              required
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#040C16] border border-[#002B49] text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0085CA]/50 focus:border-[#0085CA]"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-slate-300 font-medium" htmlFor="visibility">
              Leaderboard Visibility
            </label>
            <select
              id="visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#040C16] border border-[#002B49] text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0085CA]/50 focus:border-[#0085CA]"
            >
              <option value="public">Public (Visible to everyone in real time)</option>
              <option value="hidden_until_close">Hidden until competition closes</option>
              <option value="participants_only">Visible only to joined contestants</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-[#002B49]">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#0085CA] to-[#005A8C] hover:from-[#0096E6] hover:to-[#006BA6] disabled:opacity-50 text-white font-semibold transition-all shadow-md shadow-[#0085CA]/20 active:scale-95"
          >
            {loading ? 'Creating Competition & Generating Code...' : 'Create Competition & Get Code'}
          </button>
        </div>
      </form>
    </div>
  );
}
