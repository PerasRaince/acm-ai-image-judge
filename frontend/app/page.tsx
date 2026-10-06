import Link from 'next/link';
import JoinCodeInput from '../components/JoinCodeInput';
import {
  Trophy,
  Sparkles,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Layers,
  Eye,
  Palette,
  PlusCircle,
  Hash
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col space-y-24 py-12 md:py-20">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#0085CA]/40 bg-[#0085CA]/10 text-[#00A3E0] text-xs font-semibold backdrop-blur-sm shadow-sm">
          <img src="/acm-logo-blue.png" alt="ACM" className="h-4 w-4 object-contain inline" />
          <span>ACM Student Chapter • AI Image Recreation Benchmark</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Transparent, Automated{' '}
          <span className="bg-gradient-to-r from-[#0085CA] via-[#00A3E0] to-sky-200 bg-clip-text text-transparent">
            AI Image Recreation
          </span>{' '}
          Competitions
        </h1>

        <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Hosted by the Institutional ACM Student Chapter. Challenge peers with a target reference image or enter a code to compete under our reproducible 6-metric PyTorch evaluation pipeline.
        </p>

        {/* Action Bar: Host or Enter Code */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
          <Link
            href="/competitions/create"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#0085CA] to-[#005A8C] hover:from-[#0096E6] hover:to-[#006BA6] text-white font-semibold text-sm transition-all shadow-lg shadow-[#0085CA]/20 whitespace-nowrap active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Host New Competition</span>
          </Link>

          <div className="w-full sm:w-auto flex-1">
            <JoinCodeInput size="large" />
          </div>
        </div>

        <div className="pt-2">
          <Link
            href="/competitions"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#00A3E0] transition-colors"
          >
            <span>Or browse public competition directory</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* 6-Metric Ensemble Breakdown */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Deterministic 6-Metric Evaluation Pipeline
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            No subjective human bias or opaque single-model predictions. Every score is a transparent weighted ensemble computed with frozen model versions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* DreamSim */}
          <div className="p-6 rounded-2xl border border-[#002B49] bg-[#0B1D35]/60 space-y-3 hover:border-[#0085CA]/50 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-[#0085CA]/15 text-[#00A3E0]">
                <Eye className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#0085CA]/15 text-[#00A3E0] border border-[#0085CA]/30">
                35% Weight
              </span>
            </div>
            <h3 className="font-semibold text-slate-100 text-base">DreamSim Perceptual Similarity</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Human-aligned perceptual distance evaluating deep visual impressions and overall fidelity.
            </p>
          </div>

          {/* DINOv2 */}
          <div className="p-6 rounded-2xl border border-[#002B49] bg-[#0B1D35]/60 space-y-3 hover:border-[#0085CA]/50 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-[#0075A2]/20 text-[#38BDF8]">
                <Layers className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#0075A2]/20 text-[#38BDF8] border border-[#0075A2]/30">
                30% Weight
              </span>
            </div>
            <h3 className="font-semibold text-slate-100 text-base">DINOv2 Structural Correspondence</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Self-supervised visual transformer features matching object boundaries, layout, and scene architecture.
            </p>
          </div>

          {/* CLIP */}
          <div className="p-6 rounded-2xl border border-[#002B49] bg-[#0B1D35]/60 space-y-3 hover:border-[#0085CA]/50 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-sky-500/15 text-sky-400">
                <Cpu className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
                15% Weight
              </span>
            </div>
            <h3 className="font-semibold text-slate-100 text-base">OpenCLIP Semantic Similarity</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Image-to-image conceptual embeddings ensuring key subject matter, themes, and motifs correspond.
            </p>
          </div>

          {/* LPIPS */}
          <div className="p-6 rounded-2xl border border-[#002B49] bg-[#0B1D35]/60 space-y-3 hover:border-[#0085CA]/50 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-teal-500/15 text-teal-300">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                10% Weight
              </span>
            </div>
            <h3 className="font-semibold text-slate-100 text-base">LPIPS Detail & Texture Distance</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Learned patch similarity evaluating high-frequency texture, surface micro-details, and edge crispness.
            </p>
          </div>

          {/* Color Similarity */}
          <div className="p-6 rounded-2xl border border-[#002B49] bg-[#0B1D35]/60 space-y-3 hover:border-[#0085CA]/50 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-amber-500/15 text-amber-300">
                <Palette className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                5% Weight
              </span>
            </div>
            <h3 className="font-semibold text-slate-100 text-base">Color Distribution Fidelity</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              CIE L*a*b* centroids and 3D HSV histogram correlation verifying palette consistency.
            </p>
          </div>

          {/* Technical Quality */}
          <div className="p-6 rounded-2xl border border-[#002B49] bg-[#0B1D35]/60 space-y-3 hover:border-[#0085CA]/50 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                5% Weight
              </span>
            </div>
            <h3 className="font-semibold text-slate-100 text-base">Technical Image Integrity</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Laplacian blur analysis and dynamic range inspection to penalize severe distortion and smearing.
            </p>
          </div>
        </div>
      </section>

      {/* Anti-Cheating & Fairness Guarantee */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#002B49] bg-gradient-to-br from-[#0B1D35]/90 via-[#071527] to-[#040C16] p-8 sm:p-12 space-y-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#0085CA]/15 border border-[#0085CA]/30 text-[#00A3E0]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Built-in Competition Integrity & Anti-Cheat</h3>
              <p className="text-xs text-slate-400">Guaranteed fair play across all contestant recreations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 text-xs">
            <div className="space-y-1.5">
              <h4 className="font-semibold text-slate-200">Exact Upload Interception</h4>
              <p className="text-slate-400 leading-relaxed">
                SHA-256 fingerprint matching instantly rejects participants attempting to re-upload the original reference.
              </p>
            </div>
            <div className="space-y-1.5">
              <h4 className="font-semibold text-slate-200">Attempt Cap & Deadlines</h4>
              <p className="text-slate-400 leading-relaxed">
                Strict database-level constraints enforce submission limits and close deadlines with microsecond precision.
              </p>
            </div>
            <div className="space-y-1.5">
              <h4 className="font-semibold text-slate-200">Frozen Scoring Versions</h4>
              <p className="text-slate-400 leading-relaxed">
                Weights and model versions are frozen at competition start, ensuring zero algorithmic drift across contestants.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
