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
  Hash,
  HelpCircle,
  FileCheck2,
  Calendar,
  MapPin,
  Users,
  Compass,
  CheckCircle2,
  Lock,
  Flame
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col space-y-20 py-10 md:py-16">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        {/* Chapter Header Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#DCE4F3] bg-[#E7ECFA] text-[#376DDD] text-xs font-semibold shadow-xs">
          <img src="/acm-logo-blue.png" alt="ACM" className="h-4 w-4 object-contain inline shrink-0" />
          <span>ACM Student Chapter • Government Engineering College Thrissur</span>
        </div>

        {/* Main Title */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="inline-block px-3 py-1 rounded-md bg-[#E7ECFA] border border-[#DCE4F3] text-[#376DDD] text-[11px] font-mono uppercase tracking-widest font-semibold">
            Orientation 2026 • AI Challenge Arena
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#101A35] leading-tight">
            Master the Prompt.{' '}
            <span className="bg-gradient-to-r from-[#376DDD] to-[#31B8D0] bg-clip-text text-transparent">
              Recreate the Vision.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-[#526079] max-w-2xl mx-auto leading-relaxed">
            Welcome to the official AI Image Recreation Competition organized by the <strong>ACM Student Chapter at GEC Thrissur</strong>. Recreate target reference visuals through creative generative AI prompting, submit your recreations, and receive an instant, objective <strong>Reference Similarity Score (0–100)</strong> calculated by our 6-metric PyTorch vision ensemble.
          </p>
        </div>

        {/* Action Hub */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
          <div className="w-full sm:w-auto flex-1">
            <JoinCodeInput size="large" />
          </div>

          <Link
            href="/competitions/create"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#376DDD] hover:bg-[#285BC4] active:bg-[#204CA8] text-white font-semibold text-sm transition-all shadow-sm shadow-[#376DDD]/20 whitespace-nowrap active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Host Challenge</span>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs text-[#526079]">
          <Link
            href="/competitions"
            className="inline-flex items-center gap-1.5 hover:text-[#376DDD] transition-colors"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Browse Active Competitions</span>
          </Link>
          <span className="text-[#DCE4F3] hidden sm:inline">•</span>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 hover:text-[#376DDD] transition-colors"
          >
            <span>Sign In to Your Account</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </section>

      {/* How It Works (Orientation Workflow) */}
      {/* How It Works (Orientation Workflow) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 py-10 rounded-3xl bg-[#E7ECFA]/70 border border-[#DCE4F3]">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#DCE4F3] text-[#376DDD] text-xs font-semibold shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-[#31B8D0]" />
            <span>Competition Workflow</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#101A35] tracking-tight">
            How the Orientation Challenge Works
          </h2>
          <p className="text-sm text-[#526079] max-w-xl mx-auto">
            From benchmark revelation to real-time leaderboard ranking in 4 transparent steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="p-6 rounded-2xl border border-[#DCE4F3] bg-[#FFFFFF] space-y-3 relative group hover:border-[#376DDD]/50 transition-colors shadow-xs">
            <div className="h-8 w-8 rounded-lg bg-[#E7ECFA] border border-[#DCE4F3] flex items-center justify-center text-xs font-bold font-mono text-[#376DDD]">
              01
            </div>
            <h3 className="font-semibold text-[#101A35] text-sm">Examine Benchmark Visual</h3>
            <p className="text-xs text-[#526079] leading-relaxed">
              Upon joining a competition room with your code, inspect the official target reference image provided by the GEC Thrissur ACM orientation coordinators.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl border border-[#DCE4F3] bg-[#FFFFFF] space-y-3 relative group hover:border-[#376DDD]/50 transition-colors shadow-xs">
            <div className="h-8 w-8 rounded-lg bg-[#E7ECFA] border border-[#DCE4F3] flex items-center justify-center text-xs font-bold font-mono text-[#376DDD]">
              02
            </div>
            <h3 className="font-semibold text-[#101A35] text-sm">Engineer Generative Prompts</h3>
            <p className="text-xs text-[#526079] leading-relaxed">
              Use any generative AI platform (Midjourney, Stable Diffusion, DALL-E, Flux, Adobe Firefly) to formulate prompts matching scene composition and style.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl border border-[#DCE4F3] bg-[#FFFFFF] space-y-3 relative group hover:border-[#376DDD]/50 transition-colors shadow-xs">
            <div className="h-8 w-8 rounded-lg bg-[#E7ECFA] border border-[#DCE4F3] flex items-center justify-center text-xs font-bold font-mono text-[#376DDD]">
              03
            </div>
            <h3 className="font-semibold text-[#101A35] text-sm">Submit Recreation</h3>
            <p className="text-xs text-[#526079] leading-relaxed">
              Upload your candidate image within the active round deadline. Each participant has an allocated submission quota to test and refine iterations.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-6 rounded-2xl border border-[#DCE4F3] bg-[#FFFFFF] space-y-3 relative group hover:border-[#376DDD]/50 transition-colors shadow-xs">
            <div className="h-8 w-8 rounded-lg bg-[#E7ECFA] border border-[#DCE4F3] flex items-center justify-center text-xs font-bold font-mono text-[#376DDD]">
              04
            </div>
            <h3 className="font-semibold text-[#101A35] text-sm">Automated Score & Rank</h3>
            <p className="text-xs text-[#526079] leading-relaxed">
              Our 6-metric PyTorch vision ensemble evaluates structural, perceptual, and semantic similarity in seconds, updating the live leaderboard immediately.
            </p>
          </div>
        </div>
      </section>

      {/* Event Details & Rules Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Event Details Card */}
          <div className="p-8 rounded-3xl border border-[#DCE4F3] bg-[#FFFFFF] space-y-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#E7ECFA] border border-[#DCE4F3] text-[#376DDD]">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#101A35]">Orientation Event Details</h3>
                <p className="text-xs text-[#526079]">Government Engineering College Thrissur (GEC Thrissur)</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FCFDFF] border border-[#DCE4F3]">
                <Users className="h-4 w-4 text-[#376DDD] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[#101A35]">Organized By</div>
                  <div className="text-[#526079] mt-0.5">
                    ACM Student Chapter, Government Engineering College Thrissur (GEC Thrissur).
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FCFDFF] border border-[#DCE4F3]">
                <MapPin className="h-4 w-4 text-[#376DDD] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[#101A35]">Venue & Competition Platform</div>
                  <div className="text-[#526079] mt-0.5">
                    GEC Thrissur Campus & Live Online AI Image Judge Arena.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FCFDFF] border border-[#DCE4F3]">
                <Calendar className="h-4 w-4 text-[#376DDD] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[#101A35]">Schedule, Rounds & Deadlines</div>
                  <div className="text-[#526079] mt-0.5">
                    Configured dynamically per competition round by the GEC Thrissur ACM event coordinators. Check your specific room code for exact countdown timers.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FCFDFF] border border-[#DCE4F3]">
                <FileCheck2 className="h-4 w-4 text-[#376DDD] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[#101A35]">Eligibility</div>
                  <div className="text-[#526079] mt-0.5">
                    Open to all GEC Thrissur students and orientation participants. Accounts can be created instantly with email or Google sign-in.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rules & Integrity Card */}
          <div className="p-8 rounded-3xl border border-[#DCE4F3] bg-[#FFFFFF] space-y-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#E7ECFA] border border-[#DCE4F3] text-[#376DDD]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#101A35]">Competition Rules & Integrity</h3>
                <p className="text-xs text-[#526079]">Strict academic fairness standards enforced</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FCFDFF] border border-[#DCE4F3]">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[#101A35]">Authentic Prompting Only</div>
                  <div className="text-[#526079] mt-0.5">
                    All submitted visuals must be generated during the active competition round using generative AI prompt engineering. Pre-existing assets or manual Photoshop edits are prohibited.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FCFDFF] border border-[#DCE4F3]">
                <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[#101A35]">Anti-Duplication Hash Verification</div>
                  <div className="text-[#526079] mt-0.5">
                    Submissions are verified against the benchmark reference using byte-level SHA-256 hashing. Uploading the exact reference image or direct copies is instantly blocked.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FCFDFF] border border-[#DCE4F3]">
                <Flame className="h-4 w-4 text-[#376DDD] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[#101A35]">Submission Attempt Limits</div>
                  <div className="text-[#526079] mt-0.5">
                    Organizers enforce an attempt quota (e.g. 3 attempts per contestant). Only the highest calibrated score is recorded on the live leaderboard.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FCFDFF] border border-[#DCE4F3]">
                <ShieldCheck className="h-4 w-4 text-[#31B8D0] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[#101A35]">Screen & Clipboard Protection</div>
                  <div className="text-[#526079] mt-0.5">
                    Integrated screenshot protection interceptors and window privacy veils ensure target reference images are kept secure within the competition portal.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6-Metric Ensemble Breakdown */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7ECFA] border border-[#DCE4F3] text-[#376DDD] text-xs font-semibold">
            <Cpu className="h-3.5 w-3.5 text-[#31B8D0]" />
            <span>Evaluation Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#101A35] tracking-tight">
            Transparent 6-Metric Vision Ensemble
          </h2>
          <p className="text-sm text-[#526079] max-w-xl mx-auto">
            Zero subjective bias. Every recreation is evaluated across six calibrated computer vision models to generate a composite Reference Similarity Score (0–100).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* DreamSim */}
          <div className="p-6 rounded-2xl border border-[#DCE4F3] bg-[#FFFFFF] space-y-3 hover:border-[#376DDD]/50 transition-colors shadow-xs">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-[#E7ECFA] text-[#376DDD]">
                <Eye className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#E7ECFA] text-[#376DDD] border border-[#DCE4F3]">
                35% Weight
              </span>
            </div>
            <h3 className="font-semibold text-[#101A35] text-base">DreamSim Perceptual Similarity</h3>
            <p className="text-xs text-[#526079] leading-relaxed">
              Trained on human visual preference data to evaluate holistic perceptual likeness, composition, and visual impact.
            </p>
          </div>

          {/* DINOv2 */}
          <div className="p-6 rounded-2xl border border-[#DCE4F3] bg-[#FFFFFF] space-y-3 hover:border-[#376DDD]/50 transition-colors shadow-xs">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-[#E7ECFA] text-[#376DDD]">
                <Layers className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#E7ECFA] text-[#376DDD] border border-[#DCE4F3]">
                30% Weight
              </span>
            </div>
            <h3 className="font-semibold text-[#101A35] text-base">DINOv2 Structural Correspondence</h3>
            <p className="text-xs text-[#526079] leading-relaxed">
              Self-supervised Vision Transformer representations matching object silhouettes, spatial layouts, and geometry.
            </p>
          </div>

          {/* CLIP */}
          <div className="p-6 rounded-2xl border border-[#DCE4F3] bg-[#FFFFFF] space-y-3 hover:border-[#376DDD]/50 transition-colors shadow-xs">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-[#E7ECFA] text-[#376DDD]">
                <Cpu className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#E7ECFA] text-[#376DDD] border border-[#DCE4F3]">
                15% Weight
              </span>
            </div>
            <h3 className="font-semibold text-[#101A35] text-base">OpenCLIP Semantic Alignment</h3>
            <p className="text-xs text-[#526079] leading-relaxed">
              Contrastive multimodal embeddings measuring semantic conceptual match, key subjects, themes, and motifs.
            </p>
          </div>

          {/* LPIPS */}
          <div className="p-6 rounded-2xl border border-[#DCE4F3] bg-[#FFFFFF] space-y-3 hover:border-[#376DDD]/50 transition-colors shadow-xs">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-[#E7ECFA] text-[#31B8D0]">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#E7ECFA] text-[#376DDD] border border-[#DCE4F3]">
                10% Weight
              </span>
            </div>
            <h3 className="font-semibold text-[#101A35] text-base">LPIPS Detail & Patch Distance</h3>
            <p className="text-xs text-[#526079] leading-relaxed">
              Deep feature patch distance inspecting micro-textures, edge sharpness, and local pixel consistency.
            </p>
          </div>

          {/* Color Similarity */}
          <div className="p-6 rounded-2xl border border-[#DCE4F3] bg-[#FFFFFF] space-y-3 hover:border-[#376DDD]/50 transition-colors shadow-xs">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Palette className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                5% Weight
              </span>
            </div>
            <h3 className="font-semibold text-[#101A35] text-base">Color Distribution Fidelity</h3>
            <p className="text-xs text-[#526079] leading-relaxed">
              3D HSV histogram intersection and CIE L*a*b* color centroid distance assessing atmospheric lighting and palette.
            </p>
          </div>

          {/* Technical Quality */}
          <div className="p-6 rounded-2xl border border-[#DCE4F3] bg-[#FFFFFF] space-y-3 hover:border-[#376DDD]/50 transition-colors shadow-xs">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                5% Weight
              </span>
            </div>
            <h3 className="font-semibold text-[#101A35] text-base">Technical Image Integrity</h3>
            <p className="text-xs text-[#526079] leading-relaxed">
              Laplacian sharpness variance and dynamic range verification to penalize severe blur, artifacts, or distortion.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#DCE4F3] bg-[#E7ECFA] p-8 sm:p-12 text-center space-y-6 shadow-sm relative overflow-hidden">
          <div className="max-w-xl mx-auto space-y-3">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#101A35] tracking-tight">
              Ready to Join the Orientation Challenge?
            </h3>
            <p className="text-xs sm:text-sm text-[#526079]">
              Enter the competition room code shared by your GEC Thrissur ACM orientation coordinators, or sign in to track your scores.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <div className="w-full sm:w-auto flex-1">
              <JoinCodeInput size="large" />
            </div>
            <Link
              href="/signup"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#376DDD] hover:bg-[#285BC4] active:bg-[#204CA8] text-white font-semibold text-xs transition-all shadow-sm shadow-[#376DDD]/20 whitespace-nowrap active:scale-95"
            >
              Register / Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
