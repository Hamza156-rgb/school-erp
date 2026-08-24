import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, CircleAlert, Loader2, MailCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo } from "react";

export default function VerifyEmail() {
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") ?? "", []);
  const verify = trpc.auth.verifyEmail.useMutation();
  useEffect(() => { if (token && !verify.isPending && !verify.isSuccess && !verify.isError) verify.mutate({ token }); }, [token, verify]);
  const state = !token ? "invalid" : verify.isSuccess ? "success" : verify.isError ? "error" : "pending";
  const content = state === "success" ? { icon: CheckCircle2, title: "Email verified", text: "Your School ERP account is verified. You can now sign in securely.", color: "text-emerald-600" } : state === "pending" ? { icon: Loader2, title: "Verifying your email", text: "We’re confirming this secure verification link.", color: "text-bluebrand" } : { icon: CircleAlert, title: "Verification link unavailable", text: verify.error?.message || "This link is invalid or may already have been used.", color: "text-amber-600" };
  const Icon = content.icon;
  return <main className="grid min-h-screen place-items-center bg-cloud p-5"><section className="w-full max-w-md rounded-[28px] bg-white p-8 text-center shadow-[0_28px_80px_rgba(21,42,84,.11)]"><div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-navy text-white"><Sparkles className="h-5 w-5" /></div><div className="mx-auto mt-8 grid h-14 w-14 place-items-center rounded-2xl bg-[#f6f8fc]"><Icon className={state === "pending" ? "h-7 w-7 animate-spin text-bluebrand" : `h-7 w-7 ${content.color}`} /></div><h1 className="mt-5 font-display text-2xl font-extrabold tracking-[-.05em] text-ink">{content.title}</h1><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{content.text}</p><Button onClick={() => { window.location.href = "/sign-in"; }} className="mt-7 h-11 w-full rounded-xl bg-bluebrand text-sm font-bold">{state === "success" ? "Continue to sign in" : "Back to sign in"}</Button><div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-500"><MailCheck className="h-3.5 w-3.5" />Secure email verification</div></section></main>;
}
