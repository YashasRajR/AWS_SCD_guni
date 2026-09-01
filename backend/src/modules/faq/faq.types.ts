import type { ContentStatus, Faq } from '@scd/types';

export interface FaqRow {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  display_order: number;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export function toFaq(row: FaqRow): Faq {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    category: row.category,
    displayOrder: row.display_order,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
