
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProjectHeaderProps {
  projectName: string;
  projectColor: string;
  openCommandModal: () => void;
}

export function ProjectHeader({ projectName, projectColor, openCommandModal }: ProjectHeaderProps) {
  const navigate = useNavigate();
  
  return (
    <>
      <div className="sticky top-0 z-30 w-full -mx-8 px-6 py-3 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-sm border-b border-black/10 dark:border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => navigate("/projects")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <div 
                className="h-4 w-4 rounded-md" 
                style={{ backgroundColor: projectColor }}
              />
              {projectName}
            </h1>
          </div>
          <Button 
            variant="outline"
            className="glassmorphic"
            onClick={openCommandModal}
          >
            <span className="sr-only">Command</span>
            <kbd className="text-xs bg-muted px-2 py-0.5 rounded">⌘K</kbd>
          </Button>
        </div>
      </div>
      <div className="h-0.5 w-full -mx-8 mb-6" style={{ backgroundColor: projectColor }}></div>
    </>
  );
}
