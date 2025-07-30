import { PipelineCompany } from '@/types/pipeline';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { formatTaskDate } from '@/utils/dateUtils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PipelineListViewProps {
  companies: PipelineCompany[];
  onCardClick: (company: PipelineCompany) => void;
}

const statusColors = {
  new: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  passed: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300',
  to_share: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  interesting: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300',
  pearls: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

const roundColors = {
  'Seed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'Series A': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Series B': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'Series C': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  'Series D': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  'Series E': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  'Series F+': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
};

export function PipelineListView({ companies, onCardClick }: PipelineListViewProps) {
  return (
    <div className="p-6">
      <div className="bg-white/10 dark:bg-slate-800/30 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <Table>
            <TableHeader>
              <TableRow className="border-white/20">
                <TableHead>Company</TableHead>
                <TableHead>Round</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Raise Amount</TableHead>
                <TableHead>Close Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No companies found
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => (
                  <TableRow 
                    key={company.id} 
                    className="cursor-pointer hover:bg-white/5 border-white/10"
                    onClick={() => onCardClick(company)}
                  >
                    <TableCell className="font-medium">{company.company_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={roundColors[company.current_round]}>
                        {company.current_round}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[company.status as keyof typeof statusColors]}>
                        {company.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {company.sector && (
                        <Badge variant="outline">{company.sector}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.raise_amount_usd && (
                        <span>${company.raise_amount_usd.toLocaleString()}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.close_date && (
                        <span>{formatTaskDate(company.close_date) || company.close_date}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.website && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(company.website, '_blank');
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}