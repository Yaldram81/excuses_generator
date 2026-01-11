
import { Category } from './types';

export const CATEGORIES: Category[] = ['health', 'family', 'work', 'tech', 'personal'];

export const CATEGORY_LABELS: Record<Category, string> = {
  health: 'Health',
  family: 'Family',
  work: 'Professional',
  tech: 'Technical',
  personal: 'Personal',
  honesty: 'Honesty (Truth)'
};

export const INITIAL_PROFILE = {
  overallCredibility: 1.0,
  overusedCategories: [],
  riskScore: 0.0,
  honestyDebt: 0
};
