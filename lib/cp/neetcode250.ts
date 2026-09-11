import data from './data/neetcode250.json';

export interface Neetcode250Problem {
  name: string;
  difficulty: string;
  category: string;
  leetcode_url: string;
  slug: string;
}

export const NEETCODE_250: Neetcode250Problem[] = data.problems;
export const NEETCODE_250_CATEGORIES: string[] = data.categories;

export function categorySlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
