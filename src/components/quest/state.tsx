"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { useReducedMotion } from "framer-motion";
import { quiz, type DomainId, type Excited, type Hours, type TeamRole } from "@/content";
import { readJSON, removeKey, writeJSON } from "@/lib/storage";

export const STORAGE_KEY = "gdg-quest:v1";
export const LAST_LEVEL = 7;

export type Draft = {
  fullName: string;
  email: string;
  rollNo: string;
  phone: string;
  semester: number | null;
  department: string;
  domain: DomainId | null;
  skillTags: string[];
  experience: string;
  whyJoin: string;
  portfolioUrl: string;
  teamRole: TeamRole | null;
  hoursPerWeek: Hours | null;
  excitedAbout: Excited[];
  funFact: string;
};

export type QuestState = {
  level: number;
  /** Furthest level reached, so "Back" never loses progress */
  maxLevel: number;
  draft: Draft;
  flipped: string[];
  quizAnswers: (number | null)[];
  startedAt: number | null;
  speedMode: boolean;
  /** Set when the user jumps from Review to edit a level */
  editingFromReview: boolean;
  /** Honeypot, never persisted */
  website: string;
  hydrated: boolean;
};

export const emptyDraft: Draft = {
  fullName: "",
  email: "",
  rollNo: "",
  phone: "",
  semester: null,
  department: "",
  domain: null,
  skillTags: [],
  experience: "",
  whyJoin: "",
  portfolioUrl: "",
  teamRole: null,
  hoursPerWeek: null,
  excitedAbout: [],
  funFact: "",
};

const initialState: QuestState = {
  level: 0,
  maxLevel: 0,
  draft: emptyDraft,
  flipped: [],
  quizAnswers: quiz.map(() => null),
  startedAt: null,
  speedMode: false,
  editingFromReview: false,
  website: "",
  hydrated: false,
};

type Saved = Pick<
  QuestState,
  "level" | "maxLevel" | "draft" | "flipped" | "quizAnswers" | "startedAt" | "speedMode"
>;

type Action =
  | { type: "hydrate"; saved: Partial<Saved> | null }
  | { type: "start" }
  | { type: "restart" }
  | { type: "go"; level: number }
  | { type: "next" }
  | { type: "back" }
  | { type: "editFromReview"; level: number }
  | { type: "returnToReview" }
  | { type: "set"; patch: Partial<Draft> }
  | { type: "flip"; id: string }
  | { type: "answer"; index: number; option: number }
  | { type: "speed"; on: boolean }
  | { type: "honeypot"; value: string }
  | { type: "reset" };

function clampLevel(n: number) {
  return Math.max(0, Math.min(LAST_LEVEL, Math.round(n)));
}

function reducer(state: QuestState, action: Action): QuestState {
  switch (action.type) {
    case "hydrate": {
      const s = action.saved;
      if (!s) return { ...state, hydrated: true };
      return {
        ...state,
        hydrated: true,
        // Always land on the title screen so Sumaiya appears first; it offers "Continue"
        level: 0,
        maxLevel: clampLevel(s.maxLevel ?? s.level ?? 0),
        draft: { ...emptyDraft, ...(s.draft ?? {}) },
        flipped: Array.isArray(s.flipped) ? s.flipped : [],
        quizAnswers:
          Array.isArray(s.quizAnswers) && s.quizAnswers.length === quiz.length
            ? s.quizAnswers
            : initialState.quizAnswers,
        startedAt: typeof s.startedAt === "number" ? s.startedAt : null,
        speedMode: Boolean(s.speedMode),
      };
    }
    case "start":
      return { ...state, level: 1, maxLevel: Math.max(state.maxLevel, 1), startedAt: state.startedAt ?? Date.now() };
    case "restart":
      return {
        ...initialState,
        hydrated: true,
        speedMode: state.speedMode,
        level: 1,
        maxLevel: 1,
        startedAt: Date.now(),
      };
    case "go": {
      const level = clampLevel(action.level);
      return { ...state, level, maxLevel: Math.max(state.maxLevel, level), startedAt: state.startedAt ?? Date.now() };
    }
    case "next": {
      const level = clampLevel(state.editingFromReview ? LAST_LEVEL : state.level + 1);
      return { ...state, level, editingFromReview: false, maxLevel: Math.max(state.maxLevel, level) };
    }
    case "back":
      return { ...state, level: clampLevel(state.level - 1), editingFromReview: false };
    case "editFromReview":
      return { ...state, level: clampLevel(action.level), editingFromReview: true };
    case "returnToReview":
      return { ...state, level: LAST_LEVEL, editingFromReview: false };
    case "set": {
      const draft = { ...state.draft, ...action.patch };
      // Switching house clears skills from the old house
      if (action.patch.domain && action.patch.domain !== state.draft.domain && !action.patch.skillTags) {
        draft.skillTags = [];
      }
      return { ...state, draft };
    }
    case "flip":
      return state.flipped.includes(action.id) ? state : { ...state, flipped: [...state.flipped, action.id] };
    case "answer": {
      if (state.quizAnswers[action.index] !== null) return state;
      const quizAnswers = [...state.quizAnswers];
      quizAnswers[action.index] = action.option;
      return { ...state, quizAnswers };
    }
    case "speed":
      return { ...state, speedMode: action.on };
    case "honeypot":
      return { ...state, website: action.value };
    case "reset":
      return { ...initialState, hydrated: true, speedMode: state.speedMode };
  }
}

type QuestApi = {
  state: QuestState;
  dispatch: React.Dispatch<Action>;
  set: (patch: Partial<Draft>) => void;
  next: () => void;
  back: () => void;
  quizScore: number;
  /** Clears saved progress (after submit) */
  clearSaved: () => void;
};

const QuestContext = createContext<QuestApi | null>(null);

export function QuestProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const skipSave = useRef(false);

  useEffect(() => {
    dispatch({ type: "hydrate", saved: readJSON<Partial<Saved>>(STORAGE_KEY) });
  }, []);

  // Debounced save. Only after hydration so we never overwrite saved progress with defaults.
  useEffect(() => {
    if (!state.hydrated) return;
    if (skipSave.current) return;
    if (state.maxLevel === 0 && !state.speedMode) return;
    const id = window.setTimeout(() => {
      const saved: Saved = {
        level: state.level,
        maxLevel: state.maxLevel,
        draft: state.draft,
        flipped: state.flipped,
        quizAnswers: state.quizAnswers,
        startedAt: state.startedAt,
        speedMode: state.speedMode,
      };
      writeJSON(STORAGE_KEY, saved);
    }, 300);
    return () => window.clearTimeout(id);
  }, [state]);

  const set = useCallback((patch: Partial<Draft>) => dispatch({ type: "set", patch }), []);
  const next = useCallback(() => dispatch({ type: "next" }), []);
  const back = useCallback(() => dispatch({ type: "back" }), []);
  const clearSaved = useCallback(() => {
    skipSave.current = true;
    removeKey(STORAGE_KEY);
  }, []);

  const quizScore = useMemo(
    () => state.quizAnswers.reduce<number>((acc, a, i) => acc + (a === quiz[i].answer ? 1 : 0), 0),
    [state.quizAnswers],
  );

  // Scroll to top on level change
  useEffect(() => {
    if (state.hydrated) window.scrollTo({ top: 0 });
  }, [state.level, state.hydrated]);

  const api = useMemo(
    () => ({ state, dispatch, set, next, back, quizScore, clearSaved }),
    [state, set, next, back, quizScore, clearSaved],
  );

  return <QuestContext.Provider value={api}>{children}</QuestContext.Provider>;
}

export function useQuest(): QuestApi {
  const ctx = useContext(QuestContext);
  if (!ctx) throw new Error("useQuest must be used inside QuestProvider");
  return ctx;
}

/** True when animations should be skipped (speed mode or OS reduced motion). */
export function useInstant(): boolean {
  const { state } = useQuest();
  const reduced = useReducedMotion();
  return state.speedMode || Boolean(reduced);
}
