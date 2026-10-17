import type { Timestamp } from "firebase/firestore";
import type { DomainId } from "@/content";
import type { Status } from "@/lib/schema";

export type Claims = { role: "core" | "lead"; domain?: DomainId };

export type ApplicationDoc = {
  id: string;
  fullName: string;
  email: string;
  rollNo: string;
  phone: string;
  semester: number;
  department: string;
  domain: DomainId;
  /** Position applied for (id within the team) */
  position?: string;
  /** Position given on selection; can differ from what they applied for */
  assignedPosition?: string | null;
  skillTags: string[];
  experience: string;
  whyJoin: string;
  portfolioUrl: string;
  teamRole: string;
  hoursPerWeek: string;
  excitedAbout: string[];
  funFact: string;
  quizScore: number;
  timeTakenSec: number;
  status: Status;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export type ReviewDoc = {
  reviewerUid: string;
  rollNo: string;
  domain: DomainId;
  /** Position applied for (id within the team) */
  position?: string;
  /** Position given on selection; can differ from what they applied for */
  assignedPosition?: string | null;
  rating: number;
  notes: string;
  reviewerName: string;
  reviewerEmail: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export type Row = ApplicationDoc & { avgRating: number | null; reviews: ReviewDoc[] };
