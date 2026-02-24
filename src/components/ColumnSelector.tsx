import { Button } from '@/components/ui/button';
import { Square, LayoutGrid, Grid2x2, Grid3x3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColumnSelectorProps {
  columns: number;
  onColumnsChange: (columns: number) => void;
}

export function ColumnSelector({ columns, onColumnsChange }: ColumnSelectorProps) {
  const options = [
    { value: 1, icon: Square, label: 'Single' },
    { value: 2, icon: Grid2x2, label: 'Two' },
    { value: 3, icon: Grid3x3, label: 'Three' },
    { value: 4, icon: LayoutGrid, label: 'Four' },
  ];

  return (
    <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = columns === option.value;

        return (
          <Button
            key={option.value}
            variant="ghost"
            size="sm"
            onClick={() => onColumnsChange(option.value)}
            className={cn(
              'h-8 px-3 transition-all',
              isActive
                ? 'bg-background text-primary shadow-sm hover:bg-background'
                : 'hover:bg-background/50'
            )}
          >
            <Icon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{option.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
