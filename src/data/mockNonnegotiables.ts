
import { Nonnegotiable } from "@/components/dashboard/Nonnegotiables";
import { v4 as uuidv4 } from "uuid";

export const mockNonnegotiables: Nonnegotiable[] = [
  {
    id: uuidv4(),
    label: "Move for 30 minutes",
    streak: 3,
  },
  {
    id: uuidv4(),
    label: "Review schedule for tomorrow",
  },
  {
    id: uuidv4(),
    label: "Write in journal",
    streak: 7,
  },
  {
    id: uuidv4(),
    label: "Drink 2L of water",
    streak: 5,
  },
];
