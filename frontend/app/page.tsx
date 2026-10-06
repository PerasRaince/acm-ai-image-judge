import Link from 'next/link';
import { Trophy, Sparkles, ShieldCheck, Cpu, ArrowRight, Layers, Eye, Palette } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col space-y-24 py-12 md:py-20">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Next-Generation AI Competition Infrastructure</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Transparent, Automated{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            AI Image Recreation
          </span>{' '}
          Competitions
        </h1>

        <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Organizers provide a reference image. Participants generate recreate attempts.
          Our deterministic versioned AI ensemble evaluates perceptual, structural, and semantic fidelity to produce an explainable <strong className="text-zinc-200">Reference Similarity Score (0–100)</strong>.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/competitions"
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-600/20 transition-all text-sm"
          >
            <Trophy className="h-4 w-4" />
            <span>Explore Active Contests</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/organizer/competitions/new"
            className="flex items-center gap-2 px-6 py-3 rounded-lg border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 font-medium transition-all text-sm"
          >
            <Layers className="h-4 w-4" />
            <span>Host a Competition</span>
          </Link>
        </div>
      </section>

      {/* 6-Metric Ensemble Breakdown */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Deterministic 6-Metric Evaluation Pipeline
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            No subjective human bias or opaque single-model predictions. Every score is a transparent weighted ensemble computed with frozen model versions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* DreamSim */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-3 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Eye className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
                35% Weight
              </span>
            </div>
            <h3 className="font-semibold text-zinc-100 text-base">DreamSim Perceptual Similarity</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Human-aligned perceptual distance evaluating deep visual impressions and overall fidelity.
            </p>
          </div>

          {/* DINOv2 */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-3 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Layers className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                30% Weight
              </span>
            </div>
            <h3 className="font-semibold text-zinc-100 text-base">DINOv2 Structural Correspondence</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Self-supervised visual transformer features matching object boundaries, layout, and scene architecture.
            </p>
          </div>

          {/* CLIP */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-3 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Cpu className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">
                15% Weight
              </span>
            </div>
            <h3 className="font-semibold text-zinc-100 text-base">OpenCLIP Semantic Similarity</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Image-to-image conceptual embeddings ensuring key subject matter, themes, and motifs correspond.
            </p>
          </div>

          {/* LPIPS */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-3 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                10% Weight
              </span>
            </div>
            <h3 className="font-semibold text-zinc-100 text-base">LPIPS Detail & Texture Distance</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Learned patch similarity evaluating high-frequency texture, surface micro-details, and edge crispness.
            </p>
          </div>

          {/* Color Similarity */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-3 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Palette className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
                5% Weight
              </span>
            </div>
            <h3 className="font-semibold text-zinc-100 text-base">Color Distribution Fidelity</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              CIE L*a*b* centroids and 3D HSV histogram correlation verifying palette consistency.
            </p>
          </div>

          {/* Technical Quality */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-3 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400">
                5% Weight
              </span>
            </div>
            <h3 className="font-semibold text-zinc-100 text-base">Technical Image Integrity</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Laplacian blur analysis and dynamic range inspection to penalize severe distortion and smearing.
            </p>
          </div>
        </div>
      </section>

      {/* Anti-Cheating & Fairness Guarantee */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/80 to-zinc-950 p-8 sm:p-12 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Built-in Competition Integrity & Anti-Cheat</h3>
              <p className="text-xs text-zinc-400">Guaranteed fair play across all contestant recreations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 text-xs">
            <div className="space-y-1.5">
              <h4 className="font-semibold text-zinc-200">Exact Upload Interception</h4>
              <p className="text-zinc-400 leading-relaxed">
                SHA-256 fingerprint matching instantly rejects participants attempting to re-upload the original reference.
              </p>
            </div>
            <div className="space-y-1.5">
              <h4 className="font-semibold text-zinc-200">Attempt Cap & Deadlines</h4>
              <p className="text-zinc-400 leading-relaxed">
                Strict database-level constraints enforce submission limits and close deadlines with microsecond precision.
              </p>
            </div>
            <div className="space-y-1.5">
              <h4 className="font-semibold text-zinc-200">Frozen Scoring Versions</h4>
              <p className="text-zinc-400 leading-relaxed">
                Weights and model versions are frozen at competition start, ensuring zero algorithmic drift across contestants.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
