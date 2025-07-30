import { PipelineCompany } from '@/types/pipeline';
import { PipelineCard } from './PipelineCard';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PipelineGridViewProps {
  companies: PipelineCompany[];
  onCardClick: (company: PipelineCompany) => void;
}

export function PipelineGridView({ companies, onCardClick }: PipelineGridViewProps) {
  return (
    <div className="p-6">
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {companies.length === 0 ? (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <p className="text-lg">No companies found</p>
              <p className="text-sm mt-2">Try adjusting your filters or add a new company</p>
            </div>
          ) : (
            companies.map((company) => (
              <PipelineCard
                key={company.id}
                company={company}
                onClick={() => onCardClick(company)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}