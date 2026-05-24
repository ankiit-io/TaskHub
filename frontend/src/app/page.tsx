"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Wand2,
  ImageIcon,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-28 py-10">
      <section className="grid lg:grid-cols-2 gap-14 items-center min-h-[75vh]">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-gray-300">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            AI Workflow Platform
          </div>

          <div className="space-y-6">
            <h1 className="text-6xl font-bold leading-tight">
              Create, Review & Manage
              <span className="block text-gray-400">AI Product Imagery</span>
            </h1>

            <p className="text-lg text-gray-400 max-w-2xl">
              TaskHub helps teams generate AI product visuals, collaborate
              through review workflows, manage revisions, and streamline
              creative pipelines.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href={session?.user?.role === "admin" ? "/admin" : "/dashboard"}
              className="h-14 px-8 rounded-2xl bg-white text-black font-semibold hover:opacity-90 transition-all flex items-center gap-3"
            >
              Open Dashboard
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/login"
              className="h-14 px-8 rounded-2xl border border-white/10 hover:bg-white/5 transition-all flex items-center"
            >
              Login
            </Link>
          </div>

          <div className="flex flex-wrap gap-6 pt-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              AI Generation
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              Revision Workflow
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              Admin Review System
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full"></div>

          <div className="relative border border-white/10 bg-white/5 backdrop-blur-xl rounded-[32px] p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-white/10 rounded-2xl p-5 bg-black/40">
                <Wand2 className="h-7 w-7 text-blue-400 mb-4" />

                <h3 className="font-semibold text-lg">AI Generation</h3>

                <p className="text-sm text-gray-400 mt-2">
                  Generate multiple product image variations
                </p>
              </div>

              <div className="border border-white/10 rounded-2xl p-5 bg-black/40">
                <ShieldCheck className="h-7 w-7 text-green-400 mb-4" />

                <h3 className="font-semibold text-lg">Review System</h3>

                <p className="text-sm text-gray-400 mt-2">
                  Approvals, revisions and workflow management
                </p>
              </div>
            </div>

            <div className="border border-white/10 rounded-3xl overflow-hidden bg-black/40">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Product Workflow</h3>

                  <p className="text-sm text-gray-400 mt-1">
                    AI creative pipeline overview
                  </p>
                </div>

                <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                  Active
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center gap-4 border border-white/10 rounded-2xl p-4">
                  <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-blue-400" />
                  </div>

                  <div className="flex-1">
                    <p className="font-medium">Luxury Product Shoot</p>

                    <p className="text-sm text-gray-400">
                      6/8 images generated
                    </p>
                  </div>

                  <div className="text-green-400 text-sm">Submitted</div>
                </div>

                <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-[75%] bg-green-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-10">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold">Why Teams Use TaskHub</h2>

          <p className="text-gray-400 max-w-2xl mx-auto">
            Designed for modern AI-assisted creative workflows with
            collaborative review systems.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="border border-white/10 rounded-3xl p-8 bg-white/5">
            <Sparkles className="h-10 w-10 text-yellow-400 mb-6" />

            <h3 className="text-2xl font-semibold">Smart AI Workflow</h3>

            <p className="text-gray-400 mt-4">
              Generate, organize and review AI outputs efficiently with
              structured task pipelines.
            </p>
          </div>

          <div className="border border-white/10 rounded-3xl p-8 bg-white/5">
            <ShieldCheck className="h-10 w-10 text-green-400 mb-6" />

            <h3 className="text-2xl font-semibold">Admin Control</h3>

            <p className="text-gray-400 mt-4">
              Approve submissions, request revisions, manage users and maintain
              quality.
            </p>
          </div>

          <div className="border border-white/10 rounded-3xl p-8 bg-white/5">
            <ImageIcon className="h-10 w-10 text-blue-400 mb-6" />

            <h3 className="text-2xl font-semibold">Image Management</h3>

            <p className="text-gray-400 mt-4">
              Organize generated outputs, select finals and track completion
              visually.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
