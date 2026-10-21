import type { SeedPrior } from "@/lib/types";
import { legacyConcepts } from "./concepts/legacy";
import { generalConcepts } from "./concepts/d1-general";
import { threatConcepts } from "./concepts/d2-threats";
import { aiConcepts } from "./concepts/ai";
import { architectureConcepts } from "./concepts/d3-architecture";
import { operationsConcepts } from "./concepts/d4-operations";
import { governanceConcepts } from "./concepts/d5-governance";
import { webAttackQuestions } from "./questions/web-attacks";
import { threatQuestions } from "./questions/threats";
import { generalQuestions } from "./questions/foundations-ops-governance";
import { generalQuestions2 } from "./questions/q-general";
import { threatQuestions2 } from "./questions/q-threats2";
import { aiQuestions } from "./questions/q-ai";
import { architectureQuestions } from "./questions/q-architecture";
import { operationsQuestions } from "./questions/q-operations";
import { governanceQuestions } from "./questions/q-governance";
import { pbqQuestions } from "./questions/q-pbq";

// Register new concept and question files here.
export const allConceptList = [
  ...legacyConcepts,
  ...generalConcepts,
  ...threatConcepts,
  ...aiConcepts,
  ...architectureConcepts,
  ...operationsConcepts,
  ...governanceConcepts,
];
export const allQuestionList = [
  ...webAttackQuestions,
  ...threatQuestions,
  ...generalQuestions,
  ...generalQuestions2,
  ...threatQuestions2,
  ...aiQuestions,
  ...architectureQuestions,
  ...operationsQuestions,
  ...governanceQuestions,
  ...pbqQuestions,
];

/**
 * Imported study history from before the app existed. These are starting
 * priorities only — the mastery engine replaces them as real answers arrive.
 */
export const initialSeedPriors: Record<string, SeedPrior> = {
  // High-priority web security concepts
  xss: "weak",
  sqli: "weak",
  csrf: "weak",
  ssrf: "weak",
  "session-hijacking": "weak",
  "broken-authentication": "weak",
  "directory-traversal": "weak",
  rce: "weak",
  "race-condition": "weak",
  "on-path": "weak",
  // Other review topics
  "credential-stuffing": "weak",
  fuzzing: "weak",
  keylogger: "weak",
  rootkit: "weak",
  "supply-chain": "weak",
  pharming: "weak",
  spoofing: "weak",
  nac: "weak",
  siem: "weak",
  "chain-of-custody": "weak",
  "data-ownership": "weak",
  // Known stronger concepts (still appear in mixed practice)
  ransomware: "strong",
  trojan: "strong",
  adware: "strong",
  "watering-hole": "strong",
  "password-spraying": "strong",
  smishing: "strong",
  vishing: "strong",
  "threat-hunting": "strong",
  "air-gap": "strong",
  "risk-register": "strong",
  "jit-permissions": "strong",
  worm: "strong",
  "logic-bomb": "strong",
  "command-injection": "strong",
  idor: "strong",
};
