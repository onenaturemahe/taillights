import { useState, useRef, useEffect } from "react";
import { Animal, MAHE_CAMPUSES } from "@/data/animals";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/react-app/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/react-app/components/ui/radio-group";
import { Camera, Upload } from "lucide-react";

interface AnimalFormProps {
  animal?: Animal;
  onSave: (animal: Partial<Animal>) => void;
  onCancel: () => void;
}

const compressImage = (dataUrl: string, maxWidth = 1024, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
  });
};

export function AnimalForm({ animal, onSave, onCancel }: AnimalFormProps) {
  const [formData, setFormData] = useState<Partial<Animal>>({
    photo_url: animal?.photo_url || '',
    animal_type: animal?.animal_type || 'Dog',
    name: animal?.name || '',
    age: animal?.age || 1,
    gender: animal?.gender || 'Male',
    is_neutered: animal?.is_neutered ?? false,
    vaccination_status: animal?.vaccination_status || 'Not Vaccinated',
    area_of_living: animal?.area_of_living || '',
    nature: animal?.nature || 'Approachable',
    college_campus: animal?.college_campus || MAHE_CAMPUSES[0],
    caregiver_name: animal?.caregiver_name || '',
    caregiver_mobile: animal?.caregiver_mobile || '',
    caregiver_email: animal?.caregiver_email || '',
  });

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setIsCameraOpen(true);
      // Wait for state update and ref to be attached
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      console.error("Error accessing camera:", err);
      // Fallback to file input if camera fails
      document.getElementById('camera-upload')?.click();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      let width = videoRef.current.videoWidth;
      let height = videoRef.current.videoHeight;
      const maxWidth = 1024;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw image to canvas, horizontally flipped to counter the video mirroring
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, width, height);
        // Convert to data URL with JPEG compression
        const photoUrl = canvas.toDataURL('image/jpeg', 0.7);
        setFormData({ ...formData, photo_url: photoUrl });
        stopCamera();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const originalDataUrl = reader.result as string;
        // Compress uploaded image
        const compressedDataUrl = await compressImage(originalDataUrl);
        setFormData({ ...formData, photo_url: compressedDataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo Upload */}
      <div className="space-y-2">
        <Label>Animal Photo</Label>
        <div className="flex flex-col items-center gap-4">
          {isCameraOpen ? (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 z-10">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={stopCamera}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-white text-black hover:bg-gray-200"
                  size="sm"
                  onClick={capturePhoto}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Capture
                </Button>
              </div>
            </div>
          ) : formData.photo_url ? (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
              <img
                src={formData.photo_url}
                alt="Animal preview"
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => setFormData({ ...formData, photo_url: '' })}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 bg-muted/50">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Upload a photo or use Camera</p>
            </div>
          )}
          <div className="flex gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => document.getElementById('photo-upload')?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={startCamera}
            >
              <Camera className="w-4 h-4 mr-2" />
              Camera
            </Button>
          </div>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <input
            id="camera-upload"
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>
      </div>

      {/* Animal Type */}
      <div className="space-y-2">
        <Label>Animal Type *</Label>
        <Select
          value={formData.animal_type}
          onValueChange={(value) => setFormData({ ...formData, animal_type: value as Animal['animal_type'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Dog">Dog</SelectItem>
            <SelectItem value="Cat">Cat</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label>Name *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter animal name"
          required
        />
      </div>

      {/* Age */}
      <div className="space-y-2">
        <Label>Age (years) *</Label>
        <Input
          type="number"
          min="0"
          value={formData.age}
          onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
          required
        />
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <Label>Gender *</Label>
        <RadioGroup
          value={formData.gender}
          onValueChange={(value) => setFormData({ ...formData, gender: value as Animal['gender'] })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Male" id="male" />
            <Label htmlFor="male" className="font-normal cursor-pointer">Male</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Female" id="female" />
            <Label htmlFor="female" className="font-normal cursor-pointer">Female</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Neutered Status */}
      <div className="space-y-2">
        <Label>Neutered Status *</Label>
        <RadioGroup
          value={formData.is_neutered ? 'yes' : 'no'}
          onValueChange={(value) => setFormData({ ...formData, is_neutered: value === 'yes' })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="neutered-yes" />
            <Label htmlFor="neutered-yes" className="font-normal cursor-pointer">Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="neutered-no" />
            <Label htmlFor="neutered-no" className="font-normal cursor-pointer">No</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Vaccination Status */}
      <div className="space-y-2">
        <Label>Vaccination Status *</Label>
        <Select
          value={formData.vaccination_status}
          onValueChange={(value) => setFormData({ ...formData, vaccination_status: value as Animal['vaccination_status'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Fully Vaccinated">Fully Vaccinated</SelectItem>
            <SelectItem value="Partially Vaccinated">Partially Vaccinated</SelectItem>
            <SelectItem value="Not Vaccinated">Not Vaccinated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Area of Living */}
      <div className="space-y-2">
        <Label>Area of Living *</Label>
        <Input
          value={formData.area_of_living}
          onChange={(e) => setFormData({ ...formData, area_of_living: e.target.value })}
          placeholder="e.g., Block A, NIH, Hostel area"
          required
        />
      </div>

      {/* Nature/Behavior */}
      <div className="space-y-2">
        <Label>Nature / Behavior *</Label>
        <Select
          value={formData.nature}
          onValueChange={(value) => setFormData({ ...formData, nature: value as Animal['nature'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Approachable">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                Approachable
              </div>
            </SelectItem>
            <SelectItem value="Approach with Caution">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                Approach with Caution
              </div>
            </SelectItem>
            <SelectItem value="Aggressive">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                Aggressive
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* College Campus */}
      <div className="space-y-2">
        <Label>College Campus *</Label>
        <Select
          value={formData.college_campus}
          onValueChange={(value) => setFormData({ ...formData, college_campus: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MAHE_CAMPUSES.map(campus => (
              <SelectItem key={campus} value={campus}>{campus}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Caregiver Name */}
      <div className="space-y-2">
        <Label>Caregiver Name</Label>
        <Input
          value={formData.caregiver_name}
          onChange={(e) => setFormData({ ...formData, caregiver_name: e.target.value })}
          placeholder="Enter caregiver name"
        />
      </div>

      <div className="space-y-2">
        <Label>Caregiver Mobile No.</Label>
        <Input
          type="tel"
          value={formData.caregiver_mobile}
          onChange={(e) => setFormData({ ...formData, caregiver_mobile: e.target.value })}
          placeholder="Enter caregiver mobile no."
        />
      </div>

      {/* Caregiver Email */}
      <div className="space-y-2">
        <Label>Caregiver Email ID</Label>
        <Input
          type="email"
          value={formData.caregiver_email}
          onChange={(e) => setFormData({ ...formData, caregiver_email: e.target.value })}
          placeholder="Enter caregiver email"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
          {animal ? 'Save Changes' : 'Add Animal'}
        </Button>
      </div>
    </form>
  );
}
