import { CheckCircle, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export type ActionType =
  | "create_task"
  | "add_note"
  | "link_company"
  | "create_pipeline"
  | "save_attachments"
  | "create_commitment";

interface ActionResult {
  id: string;
  name: string;
  link?: string;
}

interface ActionSuccessStateProps {
  actionType: ActionType;
  result: ActionResult;
  onDismiss: () => void;
  onDoAnother: () => void;
}

const ACTION_LABELS: Record<ActionType, string> = {
  create_task: "Task created",
  add_note: "Note added",
  link_company: "Company linked",
  create_pipeline: "Added to pipeline",
  save_attachments: "Attachments saved",
  create_commitment: "Obligation tracked",
};

export function ActionSuccessState({
  actionType,
  result,
  onDismiss,
  onDoAnother,
}: ActionSuccessStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 rounded-lg border border-primary/20 bg-primary/5"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-primary">
            {ACTION_LABELS[actionType]}
          </p>
          <p className="text-xs text-foreground mt-1 truncate">
            "{result.name}"
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4">
        {result.link && (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-7 text-xs flex-1"
          >
            <Link to={result.link}>
              View
              <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={onDoAnother}
          className="h-7 text-xs flex-1"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Do Another
        </Button>
      </div>
    </motion.div>
  );
}
