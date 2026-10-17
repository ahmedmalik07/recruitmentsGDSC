import type { DomainId } from "@/content";
import type { PortfolioLink } from "@/lib/links";
import type { Status } from "@/lib/schema";

export type Claims = { role: "core" | "lead"; domain?: DomainId };

/** Times are epoch milliseconds (the server converts Firestore Timestamps) */
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
  achievements?: string;
  whyJoin: string;
  links?: PortfolioLink[];
  /** Applications from before multiple links have this instead */
  portfolioUrl?: string;
  teamRole: string;
  hoursPerWeek: string;
  excitedAbout: string[];
  funFact: string;
  quizScore: number;
  timeTakenSec: number;
  status: Status;
  statusBy?: string;
  /** Reviewer uid → their rating (mirrored from the reviews subcollection) */
  ratings?: Record<
    string,
    { rating: number; notes: string; reviewerName: string; reviewerEmail: string; updatedAt: number | null }
  >;
  createdAt: number | null;
  updatedAt: number | null;
};

export type ReviewDoc = {
  reviewerUid: string;
  rollNo: string;
  domain: DomainId;
  rating: number;
  notes: string;
  reviewerName: string;
  reviewerEmail: string;
  createdAt: number | null;
  updatedAt: number | null;
};

export type Row = ApplicationDoc & { avgRating: number | null; reviews: ReviewDoc[] };
