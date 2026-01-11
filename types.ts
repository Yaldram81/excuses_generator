
export type Category = 'health' | 'family' | 'work' | 'tech' | 'personal' | 'honesty';

export enum Outcome {
  ACCEPTED = 'accepted',
  QUESTIONED = 'questioned',
  REJECTED = 'rejected'
}

export interface CustomTemplate {
  id: string;
  category: Category;
  text: string;
}

export interface Excuse {
  id: string;
  category: Category;
  text: string;
  specificityLevel: number;
  emotionalWeight: number;
  plausibilityBase: number;
}

export interface UsageRecord {
  id: string;
  excuseId: string;
  category: Category;
  context: string;
  timestamp: string;
  confidenceWhenUsed: number;
  outcome?: Outcome;
  selfRatingAfter?: number;
  wasTrue: boolean;
  reflectionNotes?: string;
  credibilityImpact: number;
}

export interface UserProfile {
  overallCredibility: number;
  overusedCategories: Category[];
  riskScore: number;
  honestyDebt: number;
}

export interface GeneratedExcuseResponse {
  excuse: string;
  basePlausibility: number;
  category: Category;
  reasoning: string;
}
