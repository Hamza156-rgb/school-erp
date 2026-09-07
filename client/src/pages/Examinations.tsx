import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Download, GraduationCap, LockKeyhole } from "lucide-react";

const subjects = [
  ["Mathematics", "91", "A"],
  ["Physics", "88", "A"],
  ["English Language", "94", "A+"],
  ["History", "86", "A"],
  ["Chemistry", "89", "A"],
];

export default function Examinations() {
  return (
    <main className="min-h-screen bg-cloud p-4 sm:p-7">
      <div className="mx-auto max-w-5xl">
        <button onClick={() => { window.location.href = "/dashboard"; }} className="mb-5 inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-navy">
          <ArrowLeft className="h-3.5 w-3.5" />Back to workspace
        </button>
        <section className="soft-card overflow-hidden rounded-[24px] bg-white">
          <div className="flex flex-col gap-4 bg-navy p-6 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.15em] text-cyan">Term 2 examinations</p>
              <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-.06em]">Results centre</h1>
              <p className="mt-1 text-sm text-blue-200">Grade 10 A · Academic session 2025–26</p>
            </div>
            <Button onClick={() => window.print()} className="h-10 w-full rounded-xl bg-white text-xs font-bold text-navy hover:bg-blue-50 sm:w-auto">
              <Download className="mr-1.5 h-4 w-4" />Print report cards
            </Button>
          </div>
          <div className="grid gap-5 p-5 lg:grid-cols-[.75fr_1.25fr]">
            <aside className="rounded-2xl bg-[#f6f8fc] p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-bluebrand"><GraduationCap className="h-5 w-5" /></span>
              <p className="mt-5 text-xs font-bold text-slate-500">Overall class average</p>
              <p className="mt-1 font-display text-5xl font-extrabold tracking-[-.08em] text-ink">86.4%</p>
              <div className="mt-6 space-y-4">
                <Metric label="Results published" value="28 of 28" />
                <Metric label="Approval status" value="Approved" />
                <Metric label="Report cards" value="Ready to print" />
              </div>
            </aside>
            <section className="min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-sm font-bold">Subject performance</p><p className="mt-1 text-xs text-slate-500">Final marks after moderation</p></div>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Published</span>
              </div>
              <div className="mt-5 overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full min-w-[520px] text-left">
                  <thead><tr className="bg-[#fbfcfe] text-[10px] font-bold uppercase tracking-[.09em] text-slate-500"><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Average</th><th className="px-4 py-3">Grade</th><th className="px-4 py-3">Status</th></tr></thead>
                  <tbody>{subjects.map(([name, mark, grade]) => <tr key={name} className="border-t border-slate-50"><td className="px-4 py-3 text-xs font-bold text-ink">{name}</td><td className="px-4 py-3 text-xs font-bold text-bluebrand">{mark}%</td><td className="px-4 py-3 text-xs font-bold text-ink">{grade}</td><td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />Finalised</span></td></tr>)}</tbody>
                </table>
              </div>
              <div className="mt-5 flex gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-[11px] leading-5 text-blue-800"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />Results are locked after publishing. Authorized academic leaders can initiate a controlled amendment request.</div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="flex flex-col gap-1 border-b border-slate-200 pb-3 text-xs sm:flex-row sm:items-center sm:justify-between"><span className="text-slate-500">{label}</span><b className="whitespace-nowrap text-ink sm:text-right">{value}</b></div>;
}
