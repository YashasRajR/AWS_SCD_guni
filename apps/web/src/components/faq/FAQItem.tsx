import type { Faq } from '@scd/types';
import { AccordionItem } from '../ui/Accordion.js';

interface FAQItemProps {
  faq: Faq;
  isOpen: boolean;
  onToggle: () => void;
}

export function FAQItem({ faq, isOpen, onToggle }: FAQItemProps) {
  return (
    <AccordionItem title={faq.question} isOpen={isOpen} onToggle={onToggle}>
      <p style={{ margin: 0 }}>{faq.answer}</p>
    </AccordionItem>
  );
}
