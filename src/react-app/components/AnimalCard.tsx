import { Card } from "@/react-app/components/ui/card";
import { Animal } from "@/data/animals";
import { Dog, Cat, PawPrint, Heart, Shield, AlertTriangle, MapPin } from "lucide-react";

interface AnimalCardProps {
  animal: Animal;
  onClick: () => void;
}

const getNatureConfig = (nature: Animal['nature']) => {
  switch (nature) {
    case 'Approachable':
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950/30',
        borderColor: 'border-green-200 dark:border-green-800',
        icon: Heart,
        iconBg: 'bg-green-100 dark:bg-green-900',
        label: 'Approachable'
      };
    case 'Approach with Caution':
      return {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        icon: Shield,
        iconBg: 'bg-yellow-100 dark:bg-yellow-900',
        label: 'Caution'
      };
    case 'Aggressive':
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-950/30',
        borderColor: 'border-red-200 dark:border-red-800',
        icon: AlertTriangle,
        iconBg: 'bg-red-100 dark:bg-red-900',
        label: 'Aggressive'
      };
  }
};

const getAnimalIcon = (type: Animal['animal_type']) => {
  switch (type) {
    case 'Dog':
      return <Dog className="w-4 h-4" />;
    case 'Cat':
      return <Cat className="w-4 h-4" />;
    case 'Other':
      return <PawPrint className="w-4 h-4" />;
  }
};

export function AnimalCard({ animal, onClick }: AnimalCardProps) {
  const natureConfig = getNatureConfig(animal.nature);
  const NatureIcon = natureConfig.icon;

  return (
    <Card
      className={`overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md border-l-[3px] ${natureConfig.borderColor} ${natureConfig.bgColor}`}
      onClick={onClick}
    >
      <div className="flex flex-row gap-2.5 p-2.5">
        {/* Image */}
        <div className="w-[72px] h-[72px] sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-950 dark:to-blue-950">
          {animal.photo_url ? (
            <img
              src={animal.photo_url}
              alt={animal.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              {getAnimalIcon(animal.animal_type)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
          <h3 className="text-sm sm:text-[15px] font-bold truncate leading-tight">{animal.name}</h3>
          <div className="flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground">
            <span className="opacity-70">{getAnimalIcon(animal.animal_type)}</span>
            <span className="font-medium">{animal.animal_type}</span>
            <span className="text-[9px]">•</span>
            <span>{animal.age}{animal.age === 1 ? 'yr' : 'yrs'}</span>
            <span className="text-[9px]">•</span>
            <span>{animal.gender}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="w-2.5 h-2.5" />
            <span className="truncate">{animal.area_of_living}</span>
          </div>
          <div className="mt-0.5">
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${natureConfig.iconBg}`}>
              <NatureIcon className={`w-3 h-3 ${natureConfig.color}`} />
              <span className={`text-[11px] font-semibold ${natureConfig.color}`}>
                {natureConfig.label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
