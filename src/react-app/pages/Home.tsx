import { useState } from "react";
import { useAuth } from "@/react-app/context/AuthContext";
import { AnimalCard } from "@/react-app/components/AnimalCard";
import { AnimalForm } from "@/react-app/components/AnimalForm";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/react-app/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/react-app/components/ui/dialog";
import { Badge } from "@/react-app/components/ui/badge";
import { Animal, MAHE_CAMPUSES } from "@/data/animals";
import { useAnimals } from "@/react-app/hooks/useAnimals";
import { useAnalytics } from "@/react-app/hooks/useAnalytics";
import { Search, PlusCircle, Dog, Cat, PawPrint, MapPin, User, Syringe, Scissors, Loader2, BarChart3, Trash2, FileDown } from "lucide-react";
import { Link } from "react-router";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

export default function HomePage() {
  const { animals, loading, createAnimal, updateAnimal, deleteAnimal } = useAnimals();
  const analytics = useAnalytics(animals);
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [campusFilter, setCampusFilter] = useState<string>("all");
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [isAddingAnimal, setIsAddingAnimal] = useState(false);

  const filteredAnimals = animals.filter((animal: Animal) => {
    const matchesSearch = animal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      animal.area_of_living.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || animal.animal_type === typeFilter;
    const matchesCampus = campusFilter === "all" || animal.college_campus === campusFilter;
    return matchesSearch && matchesType && matchesCampus;
  });

  const getNatureBadgeColor = (nature: Animal['nature']) => {
    switch (nature) {
      case 'Approachable':
        return 'bg-green-500';
      case 'Approach with Caution':
        return 'bg-yellow-500';
      case 'Aggressive':
        return 'bg-red-500';
    }
  };

  const getAnimalIcon = (type: Animal['animal_type']) => {
    switch (type) {
      case 'Dog':
        return <Dog className="w-5 h-5" />;
      case 'Cat':
        return <Cat className="w-5 h-5" />;
      case 'Other':
        return <PawPrint className="w-5 h-5" />;
    }
  };


  const exportToExcel = () => {
    // 1. Animals Data
    const animalData = filteredAnimals.map(animal => ({
      'Name': animal.name,
      'Animal Type': animal.animal_type,
      'Age': animal.age,
      'Gender': animal.gender,
      'Neutered': animal.is_neutered ? 'Yes' : 'No',
      'Vaccination Status': animal.vaccination_status,
      'Area of Living': animal.area_of_living,
      'Nature': animal.nature,
      'College Campus': animal.college_campus,
      'Caregiver Name': animal.caregiver_name || '',
      'Caregiver Mobile No': animal.caregiver_mobile || '',
      'Caregiver Email': animal.caregiver_email || ''
    }));

    // 2. Dashboard Summary Data
    const summaryData = [
      { 'Metric': 'Total Animals', 'Value': analytics.totalAnimals },
      { 'Metric': 'Dogs', 'Value': analytics.dogCount },
      { 'Metric': 'Cats', 'Value': analytics.catCount },
      { 'Metric': 'Others', 'Value': analytics.otherCount },
      { 'Metric': 'Neutered Count', 'Value': analytics.neuteredCount },
      { 'Metric': 'Neutered Percentage', 'Value': `${analytics.neuteredPercentage}%` },
      { 'Metric': 'Fully Vaccinated', 'Value': analytics.fullyVaccinatedCount },
      { 'Metric': 'Vaccinated Percentage', 'Value': `${analytics.vaccinatedPercentage}%` },
      { 'Metric': 'Approachable Nature', 'Value': analytics.approachableCount },
      { 'Metric': 'Average Age', 'Value': analytics.averageAge },
      { 'Metric': 'Animals with Caregivers', 'Value': analytics.withCaregiversCount },
      { 'Metric': 'Animals without Caregivers', 'Value': analytics.totalAnimals - analytics.withCaregiversCount },
    ];

    // 3. Campus Distribution Data
    const campusData = analytics.campusDistribution.map(item => ({
      'Campus': item.campus,
      'Animal Count': item.count
    }));

    const workbook = XLSX.utils.book_new();

    // Add Animal Data Sheet
    const animalsSheet = XLSX.utils.json_to_sheet(animalData);
    XLSX.utils.book_append_sheet(workbook, animalsSheet, "Animals List");

    // Add Dashboard Summary Sheet
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Dashboard Summary");

    // Add Campus Distribution Sheet
    const campusSheet = XLSX.utils.json_to_sheet(campusData);
    XLSX.utils.book_append_sheet(workbook, campusSheet, "Campus Stats");

    const fileName = `One_Nature_Full_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const exportToPDF = async () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pw = 210;
    const ph = 297;
    const mx = 12;
    const my = 12;
    const gap = 6;
    const cardW = (pw - mx * 2 - gap) / 2;
    const cardH = (ph - my * 2 - gap - 20) / 2; // 20 for header/footer
    const totalPages = Math.ceil(filteredAnimals.length / 4);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();

      // ── Header ──
      doc.setDrawColor(139, 92, 246);
      doc.setLineWidth(0.6);
      doc.line(mx, my, pw - mx, my);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text('One Nature MAHE — Animal Welfare Club', mx, my + 4);
      doc.text(`Page ${page + 1} of ${totalPages}`, pw - mx, my + 4, { align: 'right' });

      const startY = my + 8;

      // 4 cards per page (2×2 grid)
      for (let slot = 0; slot < 4; slot++) {
        const idx = page * 4 + slot;
        if (idx >= filteredAnimals.length) break;
        const animal = filteredAnimals[idx];

        const col = slot % 2;
        const row = Math.floor(slot / 2);
        const cx = mx + col * (cardW + gap);
        const cy = startY + row * (cardH + gap);

        // Card border
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.roundedRect(cx, cy, cardW, cardH, 3, 3, 'S');

        let y = cy + 5;
        const px = cx + 4; // padding x
        const innerW = cardW - 8;

        // ── Name ──
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(30, 30, 30);
        doc.text(animal.name, px, y);
        y += 5;

        // ── Photo ──
        if (animal.photo_url) {
          try {
            const resp = await fetch(animal.photo_url);
            const blob = await resp.blob();
            const dataUrl = await new Promise<string>((res) => {
              const reader = new FileReader();
              reader.onloadend = () => res(reader.result as string);
              reader.readAsDataURL(blob);
            });
            const imgH = 38;
            doc.addImage(dataUrl, 'JPEG', px, y, innerW, imgH);
            y += imgH + 3;
          } catch {
            y += 2;
          }
        }

        // ── Nature badge ──
        const badgeColors: Record<string, [number, number, number]> = {
          'Approachable': [34, 197, 94],
          'Approach with Caution': [234, 179, 8],
          'Aggressive': [239, 68, 68],
        };
        const [br, bg, bb] = badgeColors[animal.nature] || [139, 92, 246];
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        const badgeW = doc.getTextWidth(animal.nature) + 8;
        const badgeX = px + (innerW - badgeW) / 2;
        doc.setFillColor(br, bg, bb);
        doc.roundedRect(badgeX, y - 3, badgeW, 6, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(animal.nature, px + innerW / 2, y + 1, { align: 'center' });
        y += 6;

        // ── Compact details ──
        const halfW = innerW / 2 - 1;
        const drawSmallField = (label: string, val: string, fx: number, fy: number, fw: number) => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(5.5);
          doc.setTextColor(140, 140, 140);
          doc.text(label, fx, fy);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(40, 40, 40);
          const lines = doc.splitTextToSize(val, fw);
          doc.text(lines[0], fx, fy + 3.5);
          return fy + 8;
        };

        // Row: Type | Age
        const r1 = drawSmallField('Type', animal.animal_type, px, y, halfW);
        drawSmallField('Age', `${animal.age}y`, px + halfW + 2, y, halfW);
        y = r1;

        // Row: Gender | Neutered
        const r2 = drawSmallField('Gender', animal.gender, px, y, halfW);
        drawSmallField('Neutered', animal.is_neutered ? 'Yes' : 'No', px + halfW + 2, y, halfW);
        y = r2;

        // Row: Vaccination | Campus
        const r3 = drawSmallField('Vaccination', animal.vaccination_status, px, y, halfW);
        drawSmallField('Campus', animal.college_campus.includes('(') ? animal.college_campus.split('(')[1].split(')')[0] : animal.college_campus.split(',')[0], px + halfW + 2, y, halfW);
        y = r3;

        // Row: Area (full width)
        y = drawSmallField('Area', animal.area_of_living, px, y, innerW);

        // ── Caregiver ──
        if (animal.caregiver_name || animal.caregiver_email) {
          doc.setDrawColor(230, 230, 230);
          doc.setLineWidth(0.2);
          doc.line(px, y - 1, px + innerW, y - 1);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(5.5);
          doc.setTextColor(140, 140, 140);
          doc.text('Caregiver', px, y + 2);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(40, 40, 40);
          if (animal.caregiver_name) {
            doc.text(animal.caregiver_name, px, y + 5.5);
          }
          if (animal.caregiver_email) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(5.5);
            doc.setTextColor(100, 100, 100);
            doc.text(animal.caregiver_email, px, y + 9);
          }
        }
      }

      // ── Footer ──
      doc.setDrawColor(139, 92, 246);
      doc.setLineWidth(0.4);
      doc.line(mx, ph - 10, pw - mx, ph - 10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(160, 160, 160);
      doc.text(`Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, mx, ph - 6);
      doc.text('One Nature MAHE — Confidential', pw - mx, ph - 6, { align: 'right' });
    }

    doc.save(`One_Nature_Animal_Profiles_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-purple-950 dark:via-background dark:to-blue-950">
      {/* Header + Filters — frozen */}
      <header className="border-b bg-white/80 dark:bg-card/80 backdrop-blur-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 py-2">
          {/* Top row: branding + actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
            <div className="flex items-center justify-center gap-2 shrink-0">
              <img
                src="/logo.png"
                alt="One Nature MAHE Logo"
                className="w-8 h-8 object-contain"
              />
              <div className="text-center md:text-left">
                <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight">
                  One Nature MAHE
                </h1>
                <p className="text-[11px] text-muted-foreground">Animal Welfare Club</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs whitespace-nowrap">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Dashboard
                </Button>
              </Link>
              {user && user.role === "admin" && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="h-8 text-xs whitespace-nowrap">Admin Panel</Button>
                </Link>
              )}
              {user && (user.role === "admin" || user.role === "moderator") && (
                <>
                  <Button variant="outline" size="sm" onClick={exportToExcel} className="gap-1.5 h-8 text-xs whitespace-nowrap">
                    <BarChart3 className="w-3.5 h-3.5" />
                    Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToPDF} className="gap-1.5 h-8 text-xs whitespace-nowrap">
                    <FileDown className="w-3.5 h-3.5" />
                    PDF
                  </Button>
                </>
              )}
              {user ? (
                <>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 gap-1.5 h-8 text-xs whitespace-nowrap"
                    onClick={() => setIsAddingAnimal(true)}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Add Animal
                  </Button>
                  <Button variant="outline" size="sm" onClick={logout} className="h-8 text-xs whitespace-nowrap">
                    Logout
                  </Button>
                </>
              ) : (
                <Link to="/login">
                  <Button variant="outline" size="sm" className="h-8 text-xs whitespace-nowrap">Login</Button>
                </Link>
              )}
            </div>
          </div>

          {/* Filter row */}
          <div className="flex items-center gap-2 mt-2 pb-1">
            <div className="flex-1 min-w-0 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name or area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-24 sm:w-28 md:w-36 h-8 text-xs shrink-0">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Dog">Dogs</SelectItem>
                <SelectItem value="Cat">Cats</SelectItem>
                <SelectItem value="Other">Others</SelectItem>
              </SelectContent>
            </Select>
            <Select value={campusFilter} onValueChange={setCampusFilter}>
              <SelectTrigger className="w-28 sm:w-32 md:w-44 h-8 text-xs shrink-0">
                <SelectValue placeholder="Campus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campuses</SelectItem>
                {MAHE_CAMPUSES.map(campus => (
                  <SelectItem key={campus} value={campus}>{campus}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap hidden md:inline">
              {filteredAnimals.length} {filteredAnimals.length === 1 ? 'animal' : 'animals'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Animal Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAnimals.map((animal: Animal) => (
              <AnimalCard
                key={animal.id}
                animal={animal}
                onClick={() => setSelectedAnimal(animal)}
              />
            ))}
          </div>
        )}

        {filteredAnimals.length === 0 && (
          <div className="text-center py-16">
            <PawPrint className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No animals found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search query</p>
          </div>
        )}
      </main>

      {/* Animal Detail Dialog */}
      <Dialog open={!!selectedAnimal} onOpenChange={(open) => !open && setSelectedAnimal(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {selectedAnimal && (
            <>
              <DialogHeader>
                <DialogTitle className="text-3xl font-bold">{selectedAnimal.name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Photo */}
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  {selectedAnimal.photo_url ? (
                    <img
                      src={selectedAnimal.photo_url}
                      alt={selectedAnimal.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {getAnimalIcon(selectedAnimal.animal_type)}
                    </div>
                  )}
                </div>

                {/* Nature Badge */}
                <div className="flex justify-center">
                  <Badge className={`${getNatureBadgeColor(selectedAnimal.nature)} text-white px-6 py-2 text-lg`}>
                    {selectedAnimal.nature}
                  </Badge>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      {getAnimalIcon(selectedAnimal.animal_type)}
                      Animal Type
                    </p>
                    <p className="font-medium text-lg">{selectedAnimal.animal_type}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="font-medium text-lg">{selectedAnimal.age} {selectedAnimal.age === 1 ? 'year' : 'years'} old</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium text-lg">{selectedAnimal.gender}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Scissors className="w-4 h-4" />
                      Neutered
                    </p>
                    <p className="font-medium text-lg">{selectedAnimal.is_neutered ? 'Yes' : 'No'}</p>
                  </div>

                  <div className="space-y-1 col-span-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Syringe className="w-4 h-4" />
                      Vaccination Status
                    </p>
                    <p className="font-medium text-lg">{selectedAnimal.vaccination_status}</p>
                  </div>

                  <div className="space-y-1 col-span-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Area of Living
                    </p>
                    <p className="font-medium text-lg">{selectedAnimal.area_of_living}</p>
                  </div>

                  <div className="space-y-1 col-span-2">
                    <p className="text-sm text-muted-foreground">College Campus</p>
                    <p className="font-medium text-lg">{selectedAnimal.college_campus}</p>
                  </div>
                </div>

                {/* Caregivers */}
                {(selectedAnimal.caregiver_name || selectedAnimal.caregiver_email) && (
                  <div className="pt-4 border-t space-y-3">
                    <p className="text-sm text-muted-foreground flex items-center gap-2 font-semibold">
                      <User className="w-4 h-4" />
                      Caregiver Info
                    </p>
                    <div className="space-y-1.5">
                      {selectedAnimal.caregiver_name && (
                        <p className="font-medium">{selectedAnimal.caregiver_name}</p>
                      )}
                      {selectedAnimal.caregiver_email && (
                        <p className="text-sm text-muted-foreground">{selectedAnimal.caregiver_email}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  {user && (user.role === "admin" || user.role === "moderator") && (
                    <>
                      <Button
                        className="flex-1"
                        variant="outline"
                        onClick={() => {
                          setEditingAnimal(selectedAnimal);
                          setSelectedAnimal(null);
                        }}
                      >
                        Edit Profile
                      </Button>
                      <Button
                        className="flex-1"
                        variant="destructive"
                        onClick={async () => {
                          if (window.confirm(`Are you sure you want to delete ${selectedAnimal.name}?`)) {
                            await deleteAnimal(selectedAnimal.id);
                            setSelectedAnimal(null);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </>
                  )}
                  <Button
                    className={`${user && (user.role === 'admin' || user.role === 'moderator') ? 'flex-1' : 'w-full'} bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700`}
                    onClick={() => setSelectedAnimal(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Animal Dialog */}
      <Dialog open={!!editingAnimal} onOpenChange={(open) => !open && setEditingAnimal(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {editingAnimal && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Edit Animal Profile</DialogTitle>
              </DialogHeader>
              <AnimalForm
                animal={editingAnimal}
                onSave={async (updatedData) => {
                  await updateAnimal(editingAnimal.id, updatedData);
                  setEditingAnimal(null);
                }}
                onCancel={() => setEditingAnimal(null)}
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Animal Dialog */}
      <Dialog open={isAddingAnimal} onOpenChange={setIsAddingAnimal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Add New Animal</DialogTitle>
          </DialogHeader>
          <AnimalForm
            onSave={async (newAnimal) => {
              await createAnimal(newAnimal);
              setIsAddingAnimal(false);
            }}
            onCancel={() => setIsAddingAnimal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
