import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  ArrowUpDown,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  CreditCard,
  Download,
  FileText,
  GraduationCap,
  Grid2X2,
  House,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

type View =
  | "Dashboard"
  | "Students"
  | "Admissions"
  | "Attendance"
  | "Academics"
  | "Finance"
  | "Staff"
  | "Notices"
  | "Reports"
  | "Settings";

type NavItem = { label: View; icon: LucideIcon; badge?: string };
type WorkspaceAction = "enquiry" | "staff" | "invoice" | "notice" | "timetable";

const navigation: { heading: string; items: NavItem[] }[] = [
  { heading: "Overview", items: [{ label: "Dashboard", icon: LayoutDashboard }] },
  {
    heading: "People",
    items: [
      { label: "Students", icon: GraduationCap },
      { label: "Admissions", icon: ClipboardCheck, badge: "12" },
      { label: "Staff", icon: Users },
    ],
  },
  {
    heading: "Academics",
    items: [
      { label: "Academics", icon: BookOpen },
      { label: "Attendance", icon: CalendarDays },
    ],
  },
  {
    heading: "Operations",
    items: [
      { label: "Finance", icon: WalletCards },
      { label: "Notices", icon: Bell },
      { label: "Reports", icon: FileText },
    ],
  },
];

const enrolment = [
  { month: "Aug", students: 1092 },
  { month: "Sep", students: 1107 },
  { month: "Oct", students: 1124 },
  { month: "Nov", students: 1120 },
  { month: "Dec", students: 1144 },
  { month: "Jan", students: 1168 },
  { month: "Feb", students: 1184 },
];

const attendanceBySchool = [
  { name: "Nursery", value: 93 },
  { name: "Primary", value: 96 },
  { name: "Middle", value: 94 },
  { name: "Senior", value: 91 },
];

const studentRows = [
  { initials: "AM", name: "Aarav Mehta", id: "STU-10482", className: "Grade 10 · A", guardian: "Neel Mehta", balance: "$0", status: "Current", color: "indigo" },
  { initials: "SK", name: "Sana Kapoor", id: "STU-10463", className: "Grade 10 · A", guardian: "Riya Kapoor", balance: "$320", status: "Due", color: "violet" },
  { initials: "JE", name: "James Edwards", id: "STU-10451", className: "Grade 9 · C", guardian: "Naomi Edwards", balance: "$0", status: "Current", color: "green" },
  { initials: "NZ", name: "Noor Zaman", id: "STU-10429", className: "Grade 8 · B", guardian: "Aisha Zaman", balance: "$185", status: "Due", color: "amber" },
  { initials: "OA", name: "Olivia Anderson", id: "STU-10412", className: "Grade 7 · A", guardian: "Mark Anderson", balance: "$0", status: "Current", color: "blue" },
];

const applicants = [
  { initials: "EB", name: "Ethan Brooks", className: "Grade 7", stage: "Assessment", date: "Today, 10:30 AM", color: "violet" },
  { initials: "IW", name: "Ivy Wilson", className: "Grade 5", stage: "Documents", date: "Today, 1:00 PM", color: "indigo" },
  { initials: "LC", name: "Liam Chen", className: "Grade 1", stage: "Interview", date: "Tomorrow, 9:15 AM", color: "green" },
  { initials: "SL", name: "Sophia Lee", className: "Grade 9", stage: "Review", date: "Tomorrow, 3:30 PM", color: "amber" },
];

const avatarColors: Record<string, string> = {
  indigo: "bg-[#e4eafb] text-[#31589c]",
  violet: "bg-[#f3e8f9] text-[#8b438d]",
  green: "bg-[#dff3ee] text-[#187d72]",
  amber: "bg-[#fff1d8] text-[#aa6d19]",
  blue: "bg-[#e3ecfc] text-[#406fbb]",
};

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-navy text-white shadow-[0_8px_18px_rgba(20,40,82,.22)]">
        <Sparkles className="h-[18px] w-[18px]" />
      </div>
      {!compact && (
        <div>
          <p className="font-display text-[15px] font-extrabold tracking-[-0.04em] text-navy">northstar</p>
          <p className="-mt-0.5 text-[10px] font-bold uppercase tracking-[0.17em] text-cyan">school ERP</p>
        </div>
      )}
    </div>
  );
}

function AvatarMark({ initials, color = "indigo" }: { initials: string; color?: string }) {
  return (
    <Avatar className="h-9 w-9">
      <AvatarFallback className={cn("text-[10px] font-extrabold", avatarColors[color])}>{initials}</AvatarFallback>
    </Avatar>
  );
}

function Pill({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "amber" | "blue" | "purple" }) {
  const colors = {
    slate: "bg-slate-100 text-slate-600",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
  };
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold", colors[tone])}>{children}</span>;
}

function PageTitle({ title, description, section, action }: { title: string; description: string; section?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {section && (
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <House className="h-3.5 w-3.5" /> <ChevronRight className="h-3.5 w-3.5" /> <span>{section}</span>
            <ChevronRight className="h-3.5 w-3.5" /> <span className="text-ink">{title}</span>
          </div>
        )}
        <h1 className="font-display text-[27px] font-extrabold tracking-[-0.055em] text-ink sm:text-[30px]">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

function Metric({ title, value, detail, trend, icon: Icon, tone }: { title: string; value: string; detail: string; trend: string; icon: LucideIcon; tone: "blue" | "teal" | "violet" | "amber" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    teal: "bg-teal-50 text-teal-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="lift-on-hover soft-card rounded-2xl bg-white p-5">
      <div className="flex items-start justify-between">
        <div><p className="text-[12px] font-semibold text-slate-500">{title}</p><p className="mt-2 font-display text-[27px] font-extrabold tracking-[-0.06em] text-ink">{value}</p></div>
        <span className={cn("grid h-10 w-10 place-items-center rounded-xl", tones[tone])}><Icon className="h-5 w-5" /></span>
      </div>
      <div className="mt-4 flex gap-2 text-[11px]"><b className="text-emerald-600">+{trend}</b><span className="text-slate-500">{detail}</span></div>
    </div>
  );
}

function MiniMetric({ title, value, icon: Icon, color = "blue" }: { title: string; value: string; icon: LucideIcon; color?: "blue" | "teal" | "violet" | "amber" }) {
  const tones = { blue: "bg-blue-50 text-blue-600", teal: "bg-teal-50 text-teal-600", violet: "bg-violet-50 text-violet-600", amber: "bg-amber-50 text-amber-600" };
  return <div className="soft-card flex items-center gap-3 rounded-2xl bg-white p-4"><span className={cn("grid h-9 w-9 place-items-center rounded-xl", tones[color])}><Icon className="h-4 w-4" /></span><div><p className="font-display text-xl font-extrabold tracking-[-.06em]">{value}</p><p className="text-[11px] font-semibold text-slate-500">{title}</p></div></div>;
}

function Progress({ label, value, color }: { label: string; value: number; color: string }) {
  return <div><div className="mb-2 flex justify-between text-[11px]"><span className="font-semibold text-slate-600">{label}</span><b className="text-ink">{value}%</b></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} /></div></div>;
}

function Dashboard({ go, addStudent }: { go: (view: View) => void; addStudent: () => void }) {
  return (
    <div className="fade-rise">
      <PageTitle title="Good morning, Olivia" description="Here’s what needs your attention across North Campus today." action={<div className="flex gap-2"><Button variant="outline" onClick={() => toast.info("Your operational briefing is ready.")} className="h-10 rounded-xl border-slate-200 bg-white text-xs font-bold text-slate-600"><Download className="mr-2 h-4 w-4" />Briefing</Button><Button onClick={addStudent} className="h-10 rounded-xl bg-bluebrand text-xs font-bold shadow-[0_8px_18px_rgba(52,119,235,.22)] hover:bg-[#2569dc]"><Plus className="mr-1.5 h-4 w-4" />New student</Button></div>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Active students" value="1,184" detail="vs last term" trend="4.8%" icon={GraduationCap} tone="blue" />
        <Metric title="Attendance today" value="94.6%" detail="1,120 present" trend="1.2%" icon={ClipboardCheck} tone="teal" />
        <Metric title="Fees collected" value="$42,680" detail="this month" trend="8.6%" icon={WalletCards} tone="violet" />
        <Metric title="Open applications" value="32" detail="12 need action" trend="18.4%" icon={FileText} tone="amber" />
      </div>
      <div className="mb-6 grid gap-5 xl:grid-cols-[1.55fr_.75fr]">
        <section className="soft-card rounded-2xl bg-white p-5 sm:p-6">
          <div className="mb-4 flex justify-between"><div><p className="text-sm font-bold">Student enrolment</p><p className="mt-0.5 text-xs text-slate-500">Academic year 2025–26</p></div><Pill tone="blue">This year</Pill></div>
          <div className="h-[238px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={enrolment} margin={{ top: 12, right: 2, left: -20, bottom: 0 }}><defs><linearGradient id="enrolmentFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#3477eb" stopOpacity=".22" /><stop offset="100%" stopColor="#3477eb" stopOpacity="0" /></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf0f5" strokeDasharray="3 3" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8993a5" }} dy={8} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8993a5" }} tickFormatter={(value) => `${value / 1000}k`} /><Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #edf0f5", boxShadow: "0 12px 28px rgba(24,47,92,.12)", fontSize: 12 }} /><Area type="monotone" dataKey="students" stroke="#3477eb" strokeWidth={2.5} fill="url(#enrolmentFill)" /></AreaChart></ResponsiveContainer></div>
        </section>
        <section className="soft-card rounded-2xl bg-navy p-5 text-white sm:p-6">
          <div className="flex justify-between"><div><p className="text-sm font-bold">Attention required</p><p className="mt-0.5 text-xs text-blue-200">Prioritised for your role</p></div><CircleAlert className="h-5 w-5 text-[#7dd3fc]" /></div>
          <div className="mt-5 space-y-3">
            <ActionAlert icon={ClipboardCheck} title="12 admissions awaiting review" text="4 with all documents received" onClick={() => go("Admissions")} />
            <ActionAlert icon={CalendarDays} title="18 attendance follow-ups" text="Absences need guardian confirmation" onClick={() => go("Attendance")} />
            <ActionAlert icon={WalletCards} title="$8,950 in overdue balances" text="37 invoices past due date" onClick={() => go("Finance")} />
          </div>
          <button onClick={() => toast.success("All priority items have been marked for follow-up.")} className="mt-5 w-full rounded-lg border border-white/15 py-2 text-[11px] font-bold text-blue-100 hover:bg-white/10">Open action centre</button>
        </section>
      </div>
      <div className="grid gap-5 2xl:grid-cols-[1.12fr_.88fr_.7fr]">
        <section className="soft-card rounded-2xl bg-white p-5"><div className="mb-4 flex justify-between"><div><p className="text-sm font-bold">Today’s attendance</p><p className="mt-0.5 text-xs text-slate-500">Captured at 08:45 AM</p></div><button onClick={() => go("Attendance")} className="text-xs font-bold text-bluebrand">Open register</button></div><div className="h-[164px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={attendanceBySchool} margin={{ top: 7, right: 0, left: -18, bottom: 0 }} barSize={21}><CartesianGrid vertical={false} stroke="#edf0f5" strokeDasharray="3 3" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#8993a5", fontSize: 10 }} /><YAxis domain={[80, 100]} axisLine={false} tickLine={false} tick={{ fill: "#8993a5", fontSize: 10 }} tickFormatter={(value) => `${value}%`} /><Tooltip cursor={{ fill: "#f6f8fc" }} contentStyle={{ borderRadius: 12, border: "1px solid #edf0f5", fontSize: 12 }} /><Bar dataKey="value" radius={[7, 7, 2, 2]}>{attendanceBySchool.map((item, i) => <Cell key={item.name} fill={i === 3 ? "#f4b740" : "#5b8ef2"} />)}</Bar></BarChart></ResponsiveContainer></div></section>
        <section className="soft-card rounded-2xl bg-white p-5"><div className="mb-4 flex justify-between"><div><p className="text-sm font-bold">Recent payments</p><p className="mt-0.5 text-xs text-slate-500">Today’s collection activity</p></div><button onClick={() => go("Finance")} className="text-xs font-bold text-bluebrand">All payments</button></div><div className="space-y-3"><Payment initials="SK" color="violet" name="Sana Kapoor" detail="Tuition · INV-2043" amount="+$680" /><Payment initials="JE" color="green" name="James Edwards" detail="Transport · INV-2039" amount="+$220" /><Payment initials="AM" color="indigo" name="Aarav Mehta" detail="Activity fee · INV-2034" amount="+$95" /></div></section>
        <section className="soft-card rounded-2xl bg-white p-5"><div className="mb-4 flex justify-between"><div><p className="text-sm font-bold">Quick actions</p><p className="mt-0.5 text-xs text-slate-500">Move through your day</p></div><Grid2X2 className="h-4 w-4 text-slate-400" /></div><div className="space-y-2"><QuickAction icon={Plus} title="Enroll student" caption="Add a new student record" onClick={addStudent} /><QuickAction icon={ClipboardCheck} title="Mark attendance" caption="Open today’s class register" onClick={() => go("Attendance")} /><QuickAction icon={Bell} title="Post a notice" caption="Share a school update" onClick={() => go("Notices")} /></div></section>
      </div>
    </div>
  );
}

function ActionAlert({ icon: Icon, title, text, onClick }: { icon: LucideIcon; title: string; text: string; onClick: () => void }) {
  return <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl bg-white/[.08] p-3 text-left hover:bg-white/[.13]"><span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-blue-100"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-[12px] font-bold">{title}</span><span className="block truncate text-[11px] text-blue-200">{text}</span></span><ChevronRight className="h-4 w-4 text-blue-200" /></button>;
}
function Payment({ initials, color, name, detail, amount }: { initials: string; color: string; name: string; detail: string; amount: string }) { return <div className="flex items-center gap-3"><AvatarMark initials={initials} color={color} /><div className="min-w-0 flex-1"><p className="truncate text-[12px] font-bold">{name}</p><p className="truncate text-[10px] text-slate-500">{detail}</p></div><b className="text-xs text-emerald-600">{amount}</b></div>; }
function QuickAction({ icon: Icon, title, caption, onClick }: { icon: LucideIcon; title: string; caption: string; onClick: () => void }) { return <button onClick={onClick} className="lift-on-hover flex w-full items-center gap-3 rounded-xl bg-[#f7f9fc] p-3 text-left hover:bg-white hover:shadow-sm"><span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-bluebrand quiet-shadow"><Icon className="h-4 w-4" /></span><span><span className="block text-[12px] font-bold">{title}</span><span className="block text-[11px] text-slate-500">{caption}</span></span></button>; }

export function Students({ addStudent }: { addStudent: () => void }) {
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Current" | "Due">("all");
  const [classFilter, setClassFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");
  const classOptions = Array.from(new Set(studentRows.map(student => student.className))).sort();
  const results = [...studentRows]
    .filter(student => `${student.name} ${student.id} ${student.className} ${student.guardian}`.toLowerCase().includes(filter.toLowerCase()))
    .filter(student => statusFilter === "all" || student.status === statusFilter)
    .filter(student => classFilter === "all" || student.className === classFilter)
    .sort((a, b) => {
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      if (sortBy === "class-asc") return a.className.localeCompare(b.className) || a.name.localeCompare(b.name);
      if (sortBy === "balance-desc") return Number(b.balance.replace("$", "")) - Number(a.balance.replace("$", ""));
      if (sortBy === "balance-asc") return Number(a.balance.replace("$", "")) - Number(b.balance.replace("$", ""));
      if (sortBy === "status") return a.status.localeCompare(b.status) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
  const hasFilters = Boolean(filter || statusFilter !== "all" || classFilter !== "all");
  const clearFilters = () => { setFilter(""); setStatusFilter("all"); setClassFilter("all"); setSortBy("name-asc"); };
  return <div className="fade-rise"><PageTitle section="People" title="Students" description="Manage student profiles, placements, family relationships, and records." action={<Button onClick={addStudent} className="h-10 rounded-xl bg-bluebrand text-xs font-bold"><Plus className="mr-1.5 h-4 w-4" />Add student</Button>} /><div className="mb-5 grid gap-4 sm:grid-cols-3"><MiniMetric title="Total enrolled" value="1,184" icon={GraduationCap} /><MiniMetric title="New this term" value="68" icon={Sparkles} color="teal" /><MiniMetric title="Family accounts" value="924" icon={Users} color="violet" /></div><section className="soft-card overflow-hidden rounded-2xl bg-white"><div className="border-b border-slate-100 p-4"><div className="flex flex-col gap-3 lg:flex-row"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input aria-label="Search students" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search by name, admission number, class..." className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-9 text-xs" /></div><div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex"><label className="relative"><SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><select aria-label="Filter by status" value={statusFilter} onChange={event => setStatusFilter(event.target.value as "all" | "Current" | "Due")} className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs font-semibold text-slate-600 outline-none focus:border-bluebrand focus:ring-2 focus:ring-blue-100 sm:w-auto"><option value="all">All statuses</option><option value="Current">Current</option><option value="Due">Balance due</option></select></label><select aria-label="Filter by class" value={classFilter} onChange={event => setClassFilter(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none focus:border-bluebrand focus:ring-2 focus:ring-blue-100 sm:w-auto"><option value="all">All classes</option>{classOptions.map(className => <option key={className} value={className}>{className}</option>)}</select><label className="relative"><ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><select aria-label="Sort students" value={sortBy} onChange={event => setSortBy(event.target.value)} className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs font-semibold text-slate-600 outline-none focus:border-bluebrand focus:ring-2 focus:ring-blue-100 sm:w-auto"><option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option><option value="class-asc">Class</option><option value="balance-desc">Balance high–low</option><option value="balance-asc">Balance low–high</option><option value="status">Status</option></select></label></div><div className="flex gap-2 sm:justify-end"><Button variant="outline" onClick={() => toast.success("Student register export prepared.")} className="h-10 rounded-xl border-slate-200 text-xs font-bold"><Download className="mr-1.5 h-3.5 w-3.5" />Export</Button>{hasFilters && <Button variant="ghost" onClick={clearFilters} className="h-10 rounded-xl px-3 text-xs font-bold text-slate-500"><X className="mr-1.5 h-3.5 w-3.5" />Clear</Button>}</div></div><p className="mt-3 text-[11px] font-semibold text-slate-500">Showing <span className="text-ink">{results.length}</span> of {studentRows.length} demo records</p></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead><tr className="bg-[#fbfcfe] text-[10px] font-bold uppercase tracking-[.09em] text-slate-500"><th className="px-5 py-3">Student</th><th className="px-4 py-3">Class & section</th><th className="px-4 py-3">Primary guardian</th><th className="px-4 py-3">Balance</th><th className="px-4 py-3">Status</th><th className="px-5 py-3" /></tr></thead><tbody>{results.map((student) => <tr key={student.id} className="border-t border-slate-50 hover:bg-[#f8faff]"><td className="px-5 py-3.5"><div className="flex items-center gap-3"><AvatarMark initials={student.initials} color={student.color} /><div><p className="text-[12px] font-bold">{student.name}</p><p className="text-[10px] text-slate-500">{student.id}</p></div></div></td><td className="px-4 py-3.5 text-[12px] font-semibold text-slate-600">{student.className}</td><td className="px-4 py-3.5 text-[12px] text-slate-600">{student.guardian}</td><td className={cn("px-4 py-3.5 text-[12px] font-bold", student.balance === "$0" ? "text-emerald-600" : "text-amber-600")}>{student.balance}</td><td className="px-4 py-3.5"><Pill tone={student.status === "Current" ? "green" : "amber"}>{student.status}</Pill></td><td className="px-5 py-3.5 text-right"><button onClick={() => { window.location.href = "/student-profile"; }} className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-bluebrand"><MoreHorizontal className="h-4 w-4" /></button></td></tr>)}</tbody></table>{results.length === 0 && <EmptyState title="No students found" description="Try a different name, identifier, class, or filter." action="Clear filters" onClick={clearFilters} />}</div></section></div>;
}

export function Admissions({ openAction }: { openAction: (action: WorkspaceAction) => void }) { const stages = [["Enquiries", "46", "bg-slate-400"], ["Applied", "32", "bg-bluebrand"], ["Assessment", "18", "bg-violet-500"], ["Offered", "9", "bg-amber-400"], ["Enrolled", "24", "bg-emerald-500"]]; return <div className="fade-rise"><PageTitle section="People" title="Admissions" description="Turn family interest into confident enrollment decisions." action={<Button onClick={() => openAction("enquiry")} className="h-10 rounded-xl bg-bluebrand text-xs font-bold"><Plus className="mr-1.5 h-4 w-4" />New enquiry</Button>} /><div className="mb-6 grid gap-3 md:grid-cols-5">{stages.map(([label, count, color]) => <div key={label} className="soft-card rounded-2xl bg-white p-4"><span className={cn("mb-4 block h-1.5 w-10 rounded-full", color)} /><p className="font-display text-2xl font-extrabold tracking-[-.06em]">{count}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{label}</p></div>)}</div><div className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]"><section className="soft-card rounded-2xl bg-white p-5"><div className="mb-4"><p className="text-sm font-bold">Upcoming applicant moments</p><p className="mt-0.5 text-xs text-slate-500">Interviews and documents requiring a decision</p></div><div className="space-y-1">{applicants.map((applicant) => <button key={applicant.name} onClick={() => toast.info(`${applicant.name}'s application is now in focus.`)} className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-slate-50"><AvatarMark initials={applicant.initials} color={applicant.color} /><span className="min-w-0 flex-1"><span className="block text-[12px] font-bold">{applicant.name}</span><span className="block text-[10px] text-slate-500">{applicant.className} · {applicant.date}</span></span><Pill tone={applicant.stage === "Assessment" ? "purple" : applicant.stage === "Interview" ? "green" : applicant.stage === "Documents" ? "blue" : "amber"}>{applicant.stage}</Pill><ChevronRight className="h-4 w-4 text-slate-400" /></button>)}</div></section><section className="soft-card rounded-2xl bg-white p-5"><p className="text-sm font-bold">Pipeline health</p><p className="mt-0.5 text-xs text-slate-500">This academic session</p><div className="mt-5 space-y-5"><Progress label="Application completion" value={76} color="bg-bluebrand" /><Progress label="Documents verified" value={63} color="bg-violet-500" /><Progress label="Offer conversion" value={42} color="bg-emerald-500" /></div><div className="mt-6 flex gap-2 rounded-xl bg-[#f6f8fc] p-3.5"><CircleAlert className="h-4 w-4 shrink-0 text-amber-500" /><p className="text-[11px] leading-5 text-slate-600"><b className="text-ink">6 applications</b> are waiting for document verification for more than three days.</p></div></section></div></div>; }

function Attendance({ requestConfirmation }: { requestConfirmation: (value: { title: string; description: string; confirmLabel: string; onConfirm: () => void }) => void }) { const [saved, setSaved] = useState(false); return <div className="fade-rise"><PageTitle section="Academics" title="Attendance" description="A focused daily register with family-safe follow-up workflows." action={<Button onClick={() => { setSaved(true); toast.success("Grade 10 A attendance saved."); }} className="h-10 rounded-xl bg-bluebrand text-xs font-bold"><Check className="mr-1.5 h-4 w-4" />{saved ? "Saved" : "Save register"}</Button>} /><div className="mb-5 grid gap-4 lg:grid-cols-3"><MiniMetric title="Student attendance" value="94.6%" icon={ClipboardCheck} color="teal" /><MiniMetric title="Staff attendance" value="97.1%" icon={Users} /><MiniMetric title="Follow-ups due" value="18" icon={CircleAlert} color="amber" /></div><div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><section className="soft-card overflow-hidden rounded-2xl bg-white"><div className="flex justify-between border-b border-slate-100 p-4"><div><p className="text-sm font-bold">Grade 10 · Section A</p><p className="mt-0.5 text-xs text-slate-500">Thursday, 15 February 2026</p></div><Button variant="outline" onClick={() => toast.info("The register is set to all students.")} className="h-9 rounded-lg border-slate-200 text-[11px] font-bold">All students <ChevronDown className="ml-1 h-3.5 w-3.5" /></Button></div>{studentRows.map((student, index) => <div key={student.id} className="flex items-center gap-3 border-b border-slate-50 px-5 py-3"><AvatarMark initials={student.initials} color={student.color} /><div className="min-w-0 flex-1"><p className="text-[12px] font-bold">{student.name}</p><p className="text-[10px] text-slate-500">{student.id}</p></div><div className="flex gap-1.5">{["Present", "Late", "Absent"].map((state) => <button key={state} onClick={() => toast.info(`${student.name}: ${state} selected.`)} className={cn("rounded-lg px-2.5 py-1.5 text-[10px] font-bold", state === (index === 2 ? "Late" : index === 3 ? "Absent" : "Present") ? state === "Present" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : state === "Late" ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200" : "bg-red-50 text-red-700 ring-1 ring-red-200" : "bg-slate-50 text-slate-500 hover:bg-slate-100")}>{state}</button>)}</div></div>)}</section><section className="soft-card rounded-2xl bg-white p-5"><p className="text-sm font-bold">Low attendance signals</p><p className="mt-0.5 text-xs text-slate-500">Students below the configured threshold</p><div className="mt-5 space-y-4"><Signal initials="NZ" name="Noor Zaman" detail="4 absences this month" value="78%" color="amber" /><Signal initials="EB" name="Ethan Brooks" detail="3 late arrivals this month" value="81%" color="violet" /><Signal initials="LC" name="Liam Chen" detail="2 absences this month" value="83%" color="green" /></div><button onClick={() => requestConfirmation({ title: "Notify guardians?", description: "This will queue attendance follow-up notices for the guardians of selected students.", confirmLabel: "Queue notifications", onConfirm: () => toast.success("Guardian follow-up notifications queued.") })} className="mt-6 w-full rounded-xl bg-navy py-2.5 text-xs font-bold text-white">Notify guardians</button></section></div></div>; }
function Signal({ initials, name, detail, value, color }: { initials: string; name: string; detail: string; value: string; color: string }) { return <div className="flex items-center gap-3"><AvatarMark initials={initials} color={color} /><span className="min-w-0 flex-1"><span className="block text-[12px] font-bold">{name}</span><span className="block text-[10px] text-slate-500">{detail}</span></span><b className="text-xs text-amber-600">{value}</b></div>; }

function Academics({ openAction }: { openAction: (action: WorkspaceAction) => void }) { const courses = [["English", "Maths", "Physics", "History", "English"], ["Maths", "Chemistry", "Biology", "Sports", "Physics"], ["History", "English", "Art", "Maths", "Chemistry"], ["Physics", "Maths", "English", "Chemistry", "History"]]; const colors = ["bg-blue-50 text-blue-700 border-blue-100", "bg-violet-50 text-violet-700 border-violet-100", "bg-emerald-50 text-emerald-700 border-emerald-100", "bg-amber-50 text-amber-700 border-amber-100"]; return <div className="fade-rise"><PageTitle section="Academics" title="Academic operations" description="Coordinate classes, teaching assignments, timetables, and assessment cycles." action={<Button onClick={() => openAction("timetable")} className="h-10 rounded-xl bg-bluebrand text-xs font-bold"><Plus className="mr-1.5 h-4 w-4" />Build timetable</Button>} /><div className="mb-5 grid gap-4 sm:grid-cols-3"><MiniMetric title="Active classes" value="36" icon={BookOpen} /><MiniMetric title="Subject allocations" value="142" icon={Users} color="violet" /><MiniMetric title="Exams this term" value="8" icon={FileText} color="amber" /></div><section className="soft-card overflow-hidden rounded-2xl bg-white"><div className="flex justify-between border-b border-slate-100 p-4"><div><p className="text-sm font-bold">Grade 10 A · Weekly timetable</p><p className="mt-0.5 text-xs text-slate-500">Term 2 · Room 204</p></div><Button variant="outline" onClick={() => window.print()} className="h-9 rounded-lg border-slate-200 text-[11px] font-bold"><Download className="mr-1 h-3.5 w-3.5" />Print</Button></div><div className="overflow-x-auto"><div className="min-w-[720px] p-4"><div className="grid grid-cols-[72px_repeat(5,1fr)] gap-2"><div />{["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => <div key={day} className="p-2 text-center text-[11px] font-bold text-slate-500">{day}</div>)}{["08:15", "09:10", "10:20", "11:15"].map((time, row) => <div className="contents" key={time}><div className="flex items-center text-[10px] font-bold text-slate-400">{time}</div>{courses[row].map((course, column) => <button key={`${time}-${course}`} onClick={() => toast.info(`${course} lesson selected.`)} className={cn("min-h-[66px] rounded-xl border p-2 text-left hover:-translate-y-0.5", colors[(row + column) % colors.length])}><p className="text-[11px] font-bold">{course}</p><p className="mt-1 text-[9px] opacity-75">{["Ms. King", "Mr. Rao", "Dr. West", "Ms. Ali"][row]}</p></button>)}</div>)}</div></div></div></section></div>; }

export function Finance({ openAction }: { openAction: (action: WorkspaceAction) => void }) { const invoices = [["INV-2081", "Kapoor family", "14 Feb 2026", "$680", "Overdue"], ["INV-2078", "Zaman family", "18 Feb 2026", "$185", "Due"], ["INV-2074", "Anderson family", "05 Feb 2026", "$420", "Paid"], ["INV-2066", "Mehta family", "01 Feb 2026", "$95", "Paid"]]; return <div className="fade-rise"><PageTitle section="Operations" title="Fees & collections" description="A dependable view of invoices, payments, dues, and family balances." action={<div className="flex gap-2"><Button variant="outline" onClick={() => { window.location.href = "/portal"; }} className="h-10 rounded-xl border-slate-200 bg-white text-xs font-bold">Family portal</Button><Button onClick={() => openAction("invoice")} className="h-10 rounded-xl bg-bluebrand text-xs font-bold"><Plus className="mr-1.5 h-4 w-4" />Create invoice</Button></div>} /><div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric title="Collected this month" value="$42,680" detail="vs January" trend="8.6%" icon={WalletCards} tone="violet" /><Metric title="Outstanding balance" value="$8,950" detail="across 76 families" trend="3.2%" icon={CircleAlert} tone="amber" /><Metric title="Collection rate" value="91.4%" detail="by due date" trend="2.1%" icon={Activity} tone="teal" /><Metric title="Receipts today" value="24" detail="$3,180 received" trend="12.5%" icon={CreditCard} tone="blue" /></div><section className="soft-card overflow-hidden rounded-2xl bg-white"><div className="flex justify-between border-b border-slate-100 p-4"><div><p className="text-sm font-bold">Recent invoices</p><p className="mt-0.5 text-xs text-slate-500">Updated moments ago</p></div><Button variant="outline" onClick={() => toast.success("Finance export prepared.")} className="h-9 rounded-lg border-slate-200 text-[11px] font-bold"><Download className="mr-1 h-3.5 w-3.5" />Export</Button></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left"><thead><tr className="bg-[#fbfcfe] text-[10px] font-bold uppercase tracking-[.09em] text-slate-500"><th className="px-5 py-3">Invoice</th><th className="px-4 py-3">Family</th><th className="px-4 py-3">Due date</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{invoices.map(([invoice, family, due, total, status]) => <tr key={invoice} className="border-t border-slate-50 hover:bg-[#f8faff]"><td className="px-5 py-3.5 text-[12px] font-bold text-bluebrand">{invoice}</td><td className="px-4 py-3.5 text-[12px] font-semibold">{family}</td><td className="px-4 py-3.5 text-[12px] text-slate-500">{due}</td><td className="px-4 py-3.5 text-[12px] font-bold">{total}</td><td className="px-4 py-3.5"><Pill tone={status === "Paid" ? "green" : status === "Overdue" ? "amber" : "blue"}>{status}</Pill></td></tr>)}</tbody></table></div></section></div>; }

export function Staff({ openAction }: { openAction: (action: WorkspaceAction) => void }) { return <div className="fade-rise"><PageTitle section="People" title="Staff" description="Maintain employee records, faculty allocations, and daily staff oversight." action={<Button onClick={() => openAction("staff")} className="h-10 rounded-xl bg-bluebrand text-xs font-bold"><Plus className="mr-1.5 h-4 w-4" />Add staff</Button>} /><div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><section className="soft-card rounded-2xl bg-white p-5"><p className="text-sm font-bold">Staff status</p><p className="mt-0.5 text-xs text-slate-500">North Campus · Today</p><div className="mt-5 grid grid-cols-3 gap-3"><StaffStat value="142" label="Active" tone="blue" /><StaffStat value="138" label="Present" tone="green" /><StaffStat value="4" label="On leave" tone="amber" /></div><div className="mt-6 divide-y divide-slate-50"><StaffMember name="Sarah King" role="Head of Mathematics" initials="SK" color="violet" status="Present" /><StaffMember name="Harris Rao" role="Senior Science Teacher" initials="HR" color="indigo" status="Present" /><StaffMember name="Maya Ali" role="School Counsellor" initials="MA" color="green" status="Leave" /></div></section><section className="soft-card rounded-2xl bg-white p-5"><p className="text-sm font-bold">Faculty notices</p><p className="mt-0.5 text-xs text-slate-500">Audience: staff & teachers</p><div className="mt-5 space-y-3"><NoticeCard title="Term 2 assessment moderation" text="Moderation closes Friday at 4:00 PM." tone="blue" /><NoticeCard title="Safety drill briefing" text="All faculty at 07:45 AM in the auditorium." tone="amber" /></div><Button variant="outline" onClick={() => openAction("notice")} className="mt-5 h-10 w-full rounded-xl border-slate-200 text-xs font-bold">Manage notices</Button></section></div></div>; }
function StaffStat({ value, label, tone }: { value: string; label: string; tone: "blue" | "green" | "amber" }) { const colors = { blue: "bg-blue-50 text-blue-700", green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700" }; return <div className={cn("rounded-xl p-3", colors[tone])}><p className="font-display text-xl font-extrabold tracking-[-.06em]">{value}</p><p className="text-[10px] font-bold opacity-70">{label}</p></div>; }
function StaffMember({ name, role, initials, color, status }: { name: string; role: string; initials: string; color: string; status: string }) { return <div className="flex items-center gap-3 py-3"><AvatarMark initials={initials} color={color} /><span className="min-w-0 flex-1"><span className="block text-[12px] font-bold">{name}</span><span className="block text-[10px] text-slate-500">{role}</span></span><Pill tone={status === "Present" ? "green" : "amber"}>{status}</Pill></div>; }
function NoticeCard({ title, text, tone }: { title: string; text: string; tone: "blue" | "amber" | "green" }) { const colors = { blue: "border-blue-100 bg-blue-50/50 text-blue-600", amber: "border-amber-100 bg-amber-50/50 text-amber-600", green: "border-emerald-100 bg-emerald-50/50 text-emerald-600" }; return <div className={cn("rounded-xl border p-3.5", colors[tone])}><Bell className="h-4 w-4" /><p className="mt-3 text-[12px] font-bold text-ink">{title}</p><p className="mt-1 text-[11px] leading-5 text-slate-600">{text}</p></div>; }

export function Notices({ openAction }: { openAction: (action: WorkspaceAction) => void }) { const [posted, setPosted] = useState(false); return <div className="fade-rise"><PageTitle section="Operations" title="Notices" description="Create thoughtful, targeted school communications across every audience." action={<Button onClick={() => openAction("notice")} className="h-10 rounded-xl bg-bluebrand text-xs font-bold"><Plus className="mr-1.5 h-4 w-4" />Post notice</Button>} /><div className="grid gap-5 lg:grid-cols-3"><NoticeTile title="Parent–teacher conferences" text="Booking slots open next Monday for all Grades 1–10 families." tone="blue" /><NoticeTile title="Inter-house athletics day" text="Students should arrive in house colours by 07:45 AM." tone="green" /><NoticeTile title="Fee reminder · February" text="Term payment due Friday. Families can view balances in their portal." tone="amber" /></div>{posted && <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800"><Check className="h-5 w-5" /><span><b>Your notice has been posted.</b> It is now visible to the selected audience.</span><button onClick={() => setPosted(false)} className="ml-auto rounded-lg p-1 hover:bg-emerald-100"><X className="h-4 w-4" /></button></div>}<section className="soft-card mt-5 rounded-2xl bg-white p-5"><div className="mb-4 flex justify-between"><div><p className="text-sm font-bold">Communication coverage</p><p className="mt-0.5 text-xs text-slate-500">Audience engagement this week</p></div><Pill tone="blue">This week</Pill></div><div className="grid gap-3 sm:grid-cols-3"><Progress label="Parents reached" value={91} color="bg-bluebrand" /><Progress label="Students reached" value={88} color="bg-violet-500" /><Progress label="Staff reached" value={97} color="bg-emerald-500" /></div></section></div>; }
function NoticeTile({ title, text, tone }: { title: string; text: string; tone: "blue" | "green" | "amber" }) { const colors = { blue: "border-blue-100 bg-blue-50/50 text-blue-600", green: "border-emerald-100 bg-emerald-50/50 text-emerald-600", amber: "border-amber-100 bg-amber-50/50 text-amber-600" }; return <div className={cn("soft-card min-h-[165px] rounded-2xl border p-5", colors[tone])}><Bell className="h-5 w-5" /><p className="mt-3 text-sm font-bold text-ink">{title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{text}</p><button onClick={() => toast.info(`${title} is ready to edit.`)} className="mt-4 text-[11px] font-bold text-bluebrand">View notice <ChevronRight className="inline h-3.5 w-3.5" /></button></div>; }

function Reports() { const reports: [LucideIcon, string, string][] = [[GraduationCap, "Student directory", "Enrollment, classes, and household data."], [ClipboardCheck, "Attendance summary", "Daily, monthly, and low-attendance flags."], [WalletCards, "Collection report", "Invoices, receipts, and outstanding dues."], [BookOpen, "Academic progress", "Subjects, results, and performance trends."], [Users, "Staff register", "Faculty profiles and attendance history."]]; return <div className="fade-rise"><PageTitle section="Operations" title="Reports" description="A growing library of school, academic, attendance, and finance reports." /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{reports.map(([Icon, title, text]) => <button key={title} onClick={() => toast.success(`${title} report is being prepared.`)} className="lift-on-hover soft-card rounded-2xl bg-white p-5 text-left"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-bluebrand"><Icon className="h-5 w-5" /></span><p className="mt-4 text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p><span className="mt-4 inline-block text-[11px] font-bold text-bluebrand">Open report <ChevronRight className="inline h-3.5 w-3.5" /></span></button>)}<button onClick={() => toast.info("Custom report builder opened.")} className="lift-on-hover rounded-2xl border border-dashed border-slate-200 bg-white/50 p-6 text-center hover:bg-white"><span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-500"><Plus className="h-5 w-5" /></span><p className="mt-3 text-sm font-bold">Custom report</p><p className="mt-1 text-xs text-slate-500">Build a view around your school’s KPIs.</p></button></div></div>; }
type SettingsForm = {
  campusId: string;
  organizationName: string;
  organizationEmail: string;
  organizationPhone: string;
  organizationAddress: string;
  campusName: string;
  campusCode: string;
  campusPhone: string;
  campusAddress: string;
  sessionName: string;
  startsOn: string;
  endsOn: string;
};

const emptySettingsForm: SettingsForm = { campusId: "", organizationName: "", organizationEmail: "", organizationPhone: "", organizationAddress: "", campusName: "", campusCode: "", campusPhone: "", campusAddress: "", sessionName: "", startsOn: "", endsOn: "" };
const formatDateInput = (value?: Date | string | null) => value ? new Date(value).toISOString().slice(0, 10) : "";

export function Settings() {
  const { user } = useAuth();
  const settingsQuery = trpc.settings.get.useQuery();
  const utils = trpc.useUtils();
  const updateSettings = trpc.settings.update.useMutation({ onSuccess: async () => { await utils.settings.get.invalidate(); toast.success("School settings saved."); }, onError: error => toast.error(error.message || "School settings could not be saved.") });
  const setCurrentCampus = trpc.settings.setCurrentCampus.useMutation({ onSuccess: async () => { await utils.auth.me.invalidate(); await utils.settings.get.invalidate(); toast.success("Primary campus preference saved."); }, onError: error => toast.error(error.message) });
  const [form, setForm] = useState<SettingsForm>(emptySettingsForm);

  useEffect(() => {
    const data = settingsQuery.data;
    if (!data) return;
    const campus = data.campuses.find(item => item.id === data.selectedCampusId) ?? data.campuses[0];
    const session = data.currentSessions.find(item => item.campusId === campus?.id) ?? null;
    setForm({ campusId: campus ? String(campus.id) : "", organizationName: data.organization.name, organizationEmail: data.organization.email ?? "", organizationPhone: data.organization.phone ?? "", organizationAddress: data.organization.address ?? "", campusName: campus?.name ?? "", campusCode: campus?.code ?? "", campusPhone: campus?.phone ?? "", campusAddress: campus?.address ?? "", sessionName: session?.name ?? "", startsOn: formatDateInput(session?.startsOn), endsOn: formatDateInput(session?.endsOn) });
  }, [settingsQuery.data]);

  const canEdit = Boolean(user && ["super_admin", "school_owner", "school_admin"].includes(user.role));
  const selectCampus = (campusId: string) => {
    const data = settingsQuery.data;
    const campus = data?.campuses.find(item => String(item.id) === campusId);
    const session = data?.currentSessions.find(item => item.campusId === campus?.id);
    setForm(previous => ({ ...previous, campusId, campusName: campus?.name ?? "", campusCode: campus?.code ?? "", campusPhone: campus?.phone ?? "", campusAddress: campus?.address ?? "", sessionName: session?.name ?? "", startsOn: formatDateInput(session?.startsOn), endsOn: formatDateInput(session?.endsOn) }));
    if (canEdit && campusId) setCurrentCampus.mutate({ campusId: Number(campusId) });
  };
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canEdit) { toast.error("Only school administrators can update settings."); return; }
    if (!form.campusId) { toast.error("Select a campus before saving."); return; }
    updateSettings.mutate({ campusId: Number(form.campusId), organization: { name: form.organizationName, email: form.organizationEmail, phone: form.organizationPhone, address: form.organizationAddress }, campus: { name: form.campusName, code: form.campusCode, phone: form.campusPhone, address: form.campusAddress }, session: { name: form.sessionName, startsOn: form.startsOn, endsOn: form.endsOn } });
  };

  if (settingsQuery.isLoading) return <div className="fade-rise"><PageTitle section="Workspace" title="Settings" description="Set up your school identity, campus details, and academic session." /><section className="soft-card max-w-4xl rounded-2xl bg-white p-6"><div className="h-5 w-48 animate-pulse rounded bg-slate-100" /><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="h-20 animate-pulse rounded-xl bg-slate-50" /><div className="h-20 animate-pulse rounded-xl bg-slate-50" /></div></section></div>;
  if (settingsQuery.isError) return <div className="fade-rise"><PageTitle section="Workspace" title="Settings" description="Set up your school identity, campus details, and academic session." /><section className="soft-card max-w-3xl rounded-2xl bg-white p-6"><p className="text-sm font-bold">Settings could not be loaded.</p><p className="mt-2 text-xs leading-5 text-slate-500">Your saved school preferences are temporarily unavailable. Try again without losing your existing data.</p><Button onClick={() => settingsQuery.refetch()} className="mt-5 h-9 rounded-lg bg-bluebrand text-xs font-bold">Try again</Button></section></div>;

  return <div className="fade-rise"><PageTitle section="Workspace" title="Settings" description="Set up your school identity, campus details, academic session, and access policies." /><form onSubmit={submit} className="max-w-5xl space-y-5"><section className="soft-card rounded-2xl bg-white p-5 sm:p-6"><div className="flex gap-4 rounded-xl bg-[#f7f9fd] p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy text-white"><ShieldCheck className="h-5 w-5" /></span><div><p className="text-sm font-bold">Role-controlled workspace</p><p className="mt-1 text-xs leading-5 text-slate-500">School and campus preferences are shared only within your organization. {canEdit ? "Changes are available to school administrators." : "Your role has read-only access to these settings."}</p></div></div></section><section className="soft-card rounded-2xl bg-white p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold">School identity</p><p className="mt-1 text-xs text-slate-500">The details used across your school workspace and future communications.</p></div><House className="h-5 w-5 text-bluebrand" /></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="School name" value={form.organizationName} onChange={value => setForm({ ...form, organizationName: value })} disabled={!canEdit} /><Field label="School email" type="email" value={form.organizationEmail} onChange={value => setForm({ ...form, organizationEmail: value })} disabled={!canEdit} /><Field label="School phone" value={form.organizationPhone} onChange={value => setForm({ ...form, organizationPhone: value })} disabled={!canEdit} /><TextField label="School address" value={form.organizationAddress} onChange={value => setForm({ ...form, organizationAddress: value })} disabled={!canEdit} /></div></section><section className="soft-card rounded-2xl bg-white p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold">Campus details</p><p className="mt-1 text-xs text-slate-500">Choose a campus to edit its contact details and the active academic session.</p></div><Users className="h-5 w-5 text-bluebrand" /></div><div className="mt-5 space-y-4"><label className="block"><span className="mb-1.5 block text-[11px] font-bold text-slate-600">Campus to edit</span><select aria-label="Campus to edit" value={form.campusId} onChange={event => selectCampus(event.target.value)} disabled={!canEdit} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-bluebrand focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50">{settingsQuery.data?.campuses.map(campus => <option key={campus.id} value={campus.id}>{campus.name} · {campus.code}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-2"><Field label="Campus name" value={form.campusName} onChange={value => setForm({ ...form, campusName: value })} disabled={!canEdit} /><Field label="Campus code" value={form.campusCode} onChange={value => setForm({ ...form, campusCode: value })} disabled={!canEdit} /><Field label="Campus phone" value={form.campusPhone} onChange={value => setForm({ ...form, campusPhone: value })} disabled={!canEdit} /><TextField label="Campus address" value={form.campusAddress} onChange={value => setForm({ ...form, campusAddress: value })} disabled={!canEdit} /></div></div></section><section className="soft-card rounded-2xl bg-white p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold">Academic session</p><p className="mt-1 text-xs text-slate-500">Set the current session used by this campus for admissions, classes, and student records.</p></div><CalendarDays className="h-5 w-5 text-bluebrand" /></div><div className="mt-5 grid gap-4 sm:grid-cols-3"><Field label="Session name" value={form.sessionName} onChange={value => setForm({ ...form, sessionName: value })} disabled={!canEdit} /><Field label="Starts on" type="date" value={form.startsOn} onChange={value => setForm({ ...form, startsOn: value })} disabled={!canEdit} /><Field label="Ends on" type="date" value={form.endsOn} onChange={value => setForm({ ...form, endsOn: value })} disabled={!canEdit} /></div></section><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-[11px] leading-5 text-slate-500">Saved preferences apply to this school organization and selected campus.</p><Button type="submit" disabled={!canEdit || updateSettings.isPending} className="h-10 rounded-xl bg-bluebrand px-5 text-xs font-bold shadow-[0_8px_18px_rgba(52,119,235,.2)]">{updateSettings.isPending ? "Saving settings…" : "Save settings"}</Button></div></form></div>;
}

function Field({ label, value, onChange, type = "text", disabled = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; disabled?: boolean }) { return <label className="block"><span className="mb-1.5 block text-[11px] font-bold text-slate-600">{label}</span><Input type={type} value={value} onChange={event => onChange(event.target.value)} disabled={disabled} className="h-10 rounded-xl border-slate-200 text-xs disabled:bg-slate-50" /></label>; }
function TextField({ label, value, onChange, disabled = false }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) { return <label className="block sm:col-span-2"><span className="mb-1.5 block text-[11px] font-bold text-slate-600">{label}</span><textarea value={value} onChange={event => onChange(event.target.value)} disabled={disabled} rows={3} className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none transition focus:border-bluebrand focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50" /></label>; }
function Setting({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) { return <button onClick={() => toast.info(`${title} settings are ready to configure.`)} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-left hover:bg-slate-50"><span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-600"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-[12px] font-bold">{title}</span><span className="block truncate text-[10px] text-slate-500">{detail}</span></span><ChevronRight className="h-4 w-4 text-slate-400" /></button>; }
function EmptyState({ title, description, action, onClick }: { title: string; description: string; action: string; onClick: () => void }) { return <div className="p-12 text-center"><span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-400"><Search className="h-5 w-5" /></span><p className="mt-3 text-sm font-bold">{title}</p><p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500">{description}</p><button onClick={onClick} className="mt-4 text-xs font-bold text-bluebrand">{action}</button></div>; }

export function WorkspaceActionDialog({ action, onOpenChange }: { action: WorkspaceAction | null; onOpenChange: (open: boolean) => void }) {
  const [value, setValue] = useState("");
  const details: Record<WorkspaceAction, { title: string; description: string; label: string; placeholder: string; confirm: string }> = {
    enquiry: { title: "New enquiry", description: "Capture the applicant’s initial interest and start the admissions workflow.", label: "Applicant name", placeholder: "e.g. Samira Patel", confirm: "Create enquiry" },
    staff: { title: "Add staff member", description: "Create a staff record before assigning classes or campus responsibilities.", label: "Staff member name", placeholder: "e.g. Priya Shah", confirm: "Create staff record" },
    invoice: { title: "Create fee invoice", description: "Prepare a draft invoice for review before it is issued to a family.", label: "Family or student", placeholder: "e.g. Kapoor family", confirm: "Create invoice draft" },
    notice: { title: "Post a notice", description: "Prepare a school update for the selected audience.", label: "Notice title", placeholder: "e.g. Parent–teacher conferences", confirm: "Post notice" },
    timetable: { title: "Build timetable", description: "Create a new timetable block for a class, subject, or academic term.", label: "Timetable name", placeholder: "e.g. Grade 10 A · Term 2", confirm: "Create timetable" },
  };
  const detail = action ? details[action] : null;
  return <Dialog open={Boolean(action)} onOpenChange={onOpenChange}><DialogContent className="max-w-md rounded-2xl border-0 p-0 shadow-2xl"><DialogHeader className="border-b border-slate-100 p-5"><DialogTitle className="font-display text-xl font-extrabold tracking-[-.05em]">{detail?.title}</DialogTitle><DialogDescription className="mt-2 text-xs leading-5 text-slate-500">{detail?.description}</DialogDescription></DialogHeader><div className="p-5"><label className="block"><span className="mb-1.5 block text-[11px] font-bold text-slate-600">{detail?.label}</span><Input value={value} onChange={(event) => setValue(event.target.value)} placeholder={detail?.placeholder} className="h-10 rounded-xl border-slate-200 text-xs" /></label></div><DialogFooter className="border-t border-slate-100 p-4"><Button variant="outline" onClick={() => onOpenChange(false)} className="h-9 rounded-lg border-slate-200 text-xs font-bold">Cancel</Button><Button onClick={() => { if (!value.trim()) { toast.error("Enter " + (detail?.label.toLowerCase() ?? "a value") + " to continue."); return; } toast.success((detail?.title ?? "Action") + " is ready for the next step."); setValue(""); onOpenChange(false); }} className="h-9 rounded-lg bg-bluebrand text-xs font-bold">{detail?.confirm}</Button></DialogFooter></DialogContent></Dialog>;
}

function AddStudentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) { const [name, setName] = useState(""); const [placement, setPlacement] = useState("Grade 1 · A"); return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-md rounded-2xl border-0 p-0 shadow-2xl"><DialogHeader className="border-b border-slate-100 p-5"><DialogTitle className="font-display text-xl font-extrabold tracking-[-.05em]">Add a student</DialogTitle><DialogDescription className="text-xs leading-5 text-slate-500">Start a secure student record. You can complete family and document details next.</DialogDescription></DialogHeader><div className="space-y-4 p-5"><label className="block"><span className="mb-1.5 block text-[11px] font-bold text-slate-600">Student full name</span><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Jordan Patel" className="h-10 rounded-xl border-slate-200 text-xs" /></label><label className="block"><span className="mb-1.5 block text-[11px] font-bold text-slate-600">Class placement</span><Input value={placement} onChange={(event) => setPlacement(event.target.value)} className="h-10 rounded-xl border-slate-200 text-xs" /></label><div className="flex gap-2 rounded-xl bg-blue-50 p-3 text-[11px] leading-5 text-blue-800"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />This creates the enrollment record only. Guardian access and documents remain role-protected.</div></div><DialogFooter className="border-t border-slate-100 p-4"><Button variant="outline" onClick={() => onOpenChange(false)} className="h-9 rounded-lg border-slate-200 text-xs font-bold">Cancel</Button><Button onClick={() => { if (!name.trim()) { toast.error("Enter the student’s name to continue."); return; } onOpenChange(false); toast.success(`${name} was added to ${placement}.`); }} className="h-9 rounded-lg bg-bluebrand text-xs font-bold">Create record</Button></DialogFooter></DialogContent></Dialog>; }

function ConfirmActionDialog({ confirmation, onOpenChange }: { confirmation: { title: string; description: string; confirmLabel: string; onConfirm: () => void } | null; onOpenChange: (open: boolean) => void }) { return <Dialog open={Boolean(confirmation)} onOpenChange={onOpenChange}><DialogContent className="max-w-sm rounded-2xl border-0 p-0 shadow-2xl"><DialogHeader className="border-b border-slate-100 p-5"><DialogTitle className="font-display text-xl font-extrabold tracking-[-.05em]">{confirmation?.title}</DialogTitle><DialogDescription className="mt-2 text-xs leading-5 text-slate-500">{confirmation?.description}</DialogDescription></DialogHeader><DialogFooter className="border-t border-slate-100 p-4"><Button variant="outline" onClick={() => onOpenChange(false)} className="h-9 rounded-lg border-slate-200 text-xs font-bold">Cancel</Button><Button onClick={() => { confirmation?.onConfirm(); onOpenChange(false); }} className="h-9 rounded-lg bg-bluebrand text-xs font-bold">{confirmation?.confirmLabel}</Button></DialogFooter></DialogContent></Dialog>; }

function Sidebar({ view, collapsed, onCollapse, go, onSignOut }: { view: View; collapsed: boolean; onCollapse: () => void; go: (view: View) => void; onSignOut: () => Promise<void> }) {
  return <aside className={cn("flex h-full flex-col bg-white transition-[width] duration-200", collapsed ? "w-[76px]" : "w-[244px]")}><div className="flex h-[72px] items-center border-b border-slate-100 px-4">{collapsed ? <Logo compact /> : <Logo />}<button aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} onClick={onCollapse} className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-navy"><Menu className="h-4 w-4" /></button></div><nav className="flex-1 overflow-y-auto px-3 py-5">{navigation.map((group) => <div key={group.heading} className="mb-5"><p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.13em] text-slate-400">{collapsed ? "·" : group.heading}</p><div className="space-y-1">{group.items.map((item) => { const Icon = item.icon; const active = item.label === view; return <button key={item.label} title={collapsed ? item.label : undefined} onClick={() => go(item.label)} className={cn("group flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[12px] font-semibold", active ? "bg-[#edf3ff] text-bluebrand" : "text-slate-500 hover:bg-slate-50 hover:text-ink", collapsed && "justify-center px-0")}><Icon className={cn("h-4 w-4 shrink-0", active ? "text-bluebrand" : "text-slate-400")} />{!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}{!collapsed && item.badge && <span className="rounded-full bg-bluebrand px-1.5 py-0.5 text-[9px] font-bold text-white">{item.badge}</span>}</button>; })}</div></div>)}</nav><div className="border-t border-slate-100 p-3"><button onClick={() => go("Settings")} className={cn("flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[12px] font-semibold text-slate-500 hover:bg-slate-50 hover:text-ink", collapsed && "justify-center px-0")}><Settings2 className="h-4 w-4" />{!collapsed && "Settings"}</button><DropdownMenu><DropdownMenuTrigger asChild><button aria-label="Open account menu" className={cn("mt-2 flex w-full items-center gap-2.5 rounded-xl p-2 text-left hover:bg-slate-50", collapsed && "justify-center")}><AvatarMark initials="OH" />{!collapsed && <span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-bold">Olivia Harris</span><span className="block truncate text-[10px] text-slate-500">School administrator</span></span>}{!collapsed && <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}</button></DropdownMenuTrigger><DropdownMenuContent side="right" align="end" sideOffset={8} collisionPadding={12} className="z-[70] w-52 max-w-[calc(100vw-24px)] rounded-xl p-1.5"><DropdownMenuItem onClick={() => toast.info("Account preferences opened.")} className="cursor-pointer rounded-lg text-xs">Account preferences</DropdownMenuItem><DropdownMenuItem onClick={() => toast.info("Switch-campus menu opened.")} className="cursor-pointer rounded-lg text-xs">Switch campus</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={onSignOut} className="cursor-pointer rounded-lg text-xs text-red-600 focus:text-red-600">Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></aside>;
}

export default function Home() {
  const { logout } = useAuth();
  const settingsQuery = trpc.settings.get.useQuery();
  const [view, setView] = useState<View>("Dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [studentDialog, setStudentDialog] = useState(false);
  const [workspaceAction, setWorkspaceAction] = useState<WorkspaceAction | null>(null);
  const [search, setSearch] = useState("");
  const [confirmation, setConfirmation] = useState<{ title: string; description: string; confirmLabel: string; onConfirm: () => void } | null>(null);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  const go = (next: View) => { setView(next); setMobileOpen(false); };
  const selectedCampus = settingsQuery.data?.campuses.find(campus => campus.id === settingsQuery.data.selectedCampusId) ?? settingsQuery.data?.campuses[0];
  const campusLabel = selectedCampus?.name ?? "Campus";
  const sessionLabel = settingsQuery.data?.currentSession?.name ?? "No session set";
  const page = useMemo(() => ({ Dashboard: <Dashboard go={go} addStudent={() => setStudentDialog(true)} />, Students: <Students addStudent={() => setStudentDialog(true)} />, Admissions: <Admissions openAction={setWorkspaceAction} />, Attendance: <Attendance requestConfirmation={setConfirmation} />, Academics: <Academics openAction={setWorkspaceAction} />, Finance: <Finance openAction={setWorkspaceAction} />, Staff: <Staff openAction={setWorkspaceAction} />, Notices: <Notices openAction={setWorkspaceAction} />, Reports: <Reports />, Settings: <Settings /> })[view], [view]);
  const sidebar = <Sidebar view={view} collapsed={collapsed} onCollapse={() => setCollapsed((value) => !value)} go={go} onSignOut={async () => { await logout(); window.location.href = "/sign-in"; }} />;
  return <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-cloud"><div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block">{sidebar}</div>{mobileOpen && <div className="fixed inset-0 z-50 overflow-hidden bg-navy/30 lg:hidden"><div className="h-full w-[min(274px,calc(100vw-56px))] shadow-2xl">{sidebar}</div><button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="absolute inset-y-0 left-[min(274px,calc(100vw-56px))] right-0" /></div>}<div className={cn("min-h-screen min-w-0 max-w-full transition-[padding] duration-200", collapsed ? "lg:pl-[76px]" : "lg:pl-[244px]")}><header className="glass-nav sticky top-0 z-20 flex h-[72px] min-w-0 items-center gap-3 border-b border-slate-200/70 px-4 sm:px-6"><button aria-label="Open navigation" onClick={() => setMobileOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-white lg:hidden"><Menu className="h-5 w-5" /></button><div className="hidden min-w-0 items-center gap-2 text-[12px] font-semibold text-slate-500 sm:flex"><span className="max-w-[180px] truncate" title={campusLabel}>{campusLabel}</span><ChevronDown className="h-3.5 w-3.5 shrink-0" /><span className="h-4 w-px shrink-0 bg-slate-200" /><span className="max-w-[110px] truncate text-ink" title={sessionLabel}>{sessionLabel}</span></div><div className="ml-auto flex items-center gap-2"><button onClick={() => setSearchOpen(true)} className="hidden h-9 w-[245px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-left text-[11px] text-slate-400 quiet-shadow hover:border-blue-200 sm:flex"><Search className="h-3.5 w-3.5" /><span className="flex-1">Search students, records...</span><span className="rounded border border-slate-200 px-1.5 py-0.5 text-[9px] font-bold">⌘ K</span></button><button onClick={() => setSearchOpen(true)} className="grid h-9 w-9 items-center rounded-lg text-slate-500 hover:bg-white sm:hidden"><Search className="h-4 w-4" /></button><button onClick={() => go("Notices")} className="relative grid h-9 w-9 items-center rounded-lg text-slate-500 hover:bg-white"><Bell className="h-4 w-4" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white" /></button></div></header><main className="mx-auto min-w-0 max-w-[1580px] overflow-x-hidden px-4 py-6 sm:px-6 lg:px-7">{page}</main></div><AddStudentDialog open={studentDialog} onOpenChange={setStudentDialog} /><WorkspaceActionDialog action={workspaceAction} onOpenChange={(open) => { if (!open) setWorkspaceAction(null); }} /><ConfirmActionDialog confirmation={confirmation} onOpenChange={(open) => { if (!open) setConfirmation(null); }} /><Dialog open={searchOpen} onOpenChange={setSearchOpen}><DialogContent className="top-[20%] max-w-xl rounded-2xl border-0 p-0 shadow-2xl"><DialogHeader className="sr-only"><DialogTitle>Search School ERP</DialogTitle></DialogHeader><div className="flex items-center gap-3 border-b border-slate-100 px-5"><Search className="h-5 w-5 text-slate-400" /><Input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { setSearchOpen(false); toast.info(`Search results for “${search}” are ready.`); } }} placeholder="Search students, admissions, invoices..." className="h-14 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0" /></div><div className="p-3"><p className="px-2 py-2 text-[10px] font-bold uppercase tracking-[.1em] text-slate-500">Quick navigation</p>{(["Students", "Admissions", "Attendance", "Finance"] as View[]).map((item) => <button key={item} onClick={() => { go(item); setSearchOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-50"><span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-500"><Search className="h-3.5 w-3.5" /></span><span className="text-xs font-bold">{item}</span><span className="ml-auto text-[10px] text-slate-400">Open module</span></button>)}</div></DialogContent></Dialog></div>;
}
