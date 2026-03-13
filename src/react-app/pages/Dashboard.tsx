import { useAnimals } from "@/react-app/hooks/useAnimals";
import { useAnalytics } from "@/react-app/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PawPrint, Dog, Cat, Scissors, Syringe, Heart, MapPin, Loader2, ArrowLeft, User } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/react-app/components/ui/button";

const RADIAN = Math.PI / 180;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function Dashboard() {
  const { animals, loading } = useAnimals();
  const analytics = useAnalytics(animals);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-purple-950 dark:via-background dark:to-blue-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-purple-950 dark:via-background dark:to-blue-950">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-card/80 backdrop-blur-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="One Nature MAHE Logo" className="w-10 h-10 object-contain" />
              <div className="text-center sm:text-left">
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Analytics Dashboard
                </h1>
                <p className="text-xs text-muted-foreground">Campus Animal Statistics</p>
              </div>
            </div>
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Key Metrics — single row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          <StatCard icon={<PawPrint className="w-4 h-4" />} label="Total" value={analytics.totalAnimals} color="text-purple-600" bgColor="bg-purple-50 dark:bg-purple-950/40" />
          <StatCard icon={<Dog className="w-4 h-4" />} label="Dogs" value={analytics.dogCount} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-950/40" />
          <StatCard icon={<Cat className="w-4 h-4" />} label="Cats" value={analytics.catCount} color="text-orange-600" bgColor="bg-orange-50 dark:bg-orange-950/40" />
          <StatCard icon={<Scissors className="w-4 h-4" />} label="Neutered" value={analytics.neuteredCount} color="text-sky-600" bgColor="bg-sky-50 dark:bg-sky-950/40" sub={`${analytics.neuteredPercentage}%`} />
          <StatCard icon={<Syringe className="w-4 h-4" />} label="Vaccinated" value={analytics.fullyVaccinatedCount} color="text-green-600" bgColor="bg-green-50 dark:bg-green-950/40" sub={`${analytics.vaccinatedPercentage}%`} />
          <StatCard icon={<Heart className="w-4 h-4" />} label="Friendly" value={analytics.approachableCount} color="text-pink-600" bgColor="bg-pink-50 dark:bg-pink-950/40" />

          <Card className="shadow-sm border-0 bg-teal-50 dark:bg-teal-950/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-teal-600"><User className="w-4 h-4" /></span>
                <span className="text-xs font-medium text-muted-foreground">Caregiver Status</span>
              </div>
              <div className="flex items-end gap-4 mt-0.5">
                <div>
                  <div className="text-2xl font-bold text-teal-600">{analytics.withCaregiversCount}</div>
                  <div className="text-[10px] font-semibold text-teal-600/70 uppercase tracking-wider">With</div>
                </div>
                <div className="h-8 w-px bg-teal-200 dark:bg-teal-800"></div>
                <div>
                  <div className="text-2xl font-bold text-slate-500 dark:text-slate-400">{analytics.totalAnimals - analytics.withCaregiversCount}</div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Without</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts — 2-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Animal Type */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <PawPrint className="w-4 h-4 text-purple-600" />
                Animal Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={analytics.typeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={90}
                    innerRadius={45}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                  >
                    {analytics.typeDistribution.map((entry, index) => (
                      <Cell key={`type-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {analytics.typeDistribution.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                    {entry.name}: {entry.value}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Nature & Behavior */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Heart className="w-4 h-4 text-green-600" />
                Nature & Behavior
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={analytics.natureDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={90}
                    innerRadius={45}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                  >
                    {analytics.natureDistribution.map((entry, index) => (
                      <Cell key={`nature-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {analytics.natureDistribution.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                    {entry.name}: {entry.value}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vaccination Status */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Syringe className="w-4 h-4 text-green-600" />
                Vaccination Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={analytics.vaccinationDistribution} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '13px' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {analytics.vaccinationDistribution.map((entry, index) => (
                      <Cell key={`vax-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gender Distribution */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <PawPrint className="w-4 h-4 text-indigo-600" />
                Gender Split
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={analytics.genderDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={90}
                    innerRadius={45}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                  >
                    {analytics.genderDistribution.map((entry, index) => (
                      <Cell key={`gender-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {analytics.genderDistribution.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                    {entry.name}: {entry.value}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campus Distribution — full width */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-600" />
              Campus-wise Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={analytics.campusDistribution} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="campus" tick={{ fontSize: 12, fill: "var(--foreground)" }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={50} tickFormatter={(val) => val.includes('(') ? val.split('(')[1].split(')')[0] : val.split(',')[0]} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '13px' }} />
                <Bar dataKey="count" name="Animals" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

/* Compact stat card component */
function StatCard({ icon, label, value, color, bgColor, sub }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
  sub?: string;
}) {
  return (
    <Card className={`shadow-sm border-0 ${bgColor}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={color}>{icon}</span>
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}
