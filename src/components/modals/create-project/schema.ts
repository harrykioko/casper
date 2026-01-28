import { z } from "zod";

export const colorSwatches = [
  { name: "Pink", value: "#FF1464" },
  { name: "Blue", value: "#2B2DFF" },
  { name: "Cyan", value: "#00CFDD" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Green", value: "#10B981" },
  { name: "Orange", value: "#F59E0B" },
];

export const createProjectFormSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  color: z.string().default("#FF1464"),
  type: z.enum(['research', 'thought_piece', 'market_map', 'coding', 'other']).default('other'),
  status: z.enum(['active', 'paused', 'completed', 'archived']).default('active'),
  dueDate: z.date().optional(),
  resources: z.array(
    z.object({
      title: z.string(),
      url: z.string().refine((val) => {
        if (!val || val.trim() === "") return true;
        return val.startsWith("https://");
      }, "URL must start with https://"),
    })
  ).default([]).superRefine((resources, ctx) => {
    resources.forEach((resource, index) => {
      if (resource.url && resource.url.trim() !== "" && (!resource.title || resource.title.trim() === "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Resource title is required when URL is provided",
          path: [index, "title"],
        });
      }
    });
  }),
});

export type CreateProjectFormData = z.infer<typeof createProjectFormSchema>;
