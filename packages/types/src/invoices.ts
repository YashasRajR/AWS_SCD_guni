export interface Invoice {
  id: string;
  paymentId: string;
  registrationId: string;
  invoiceNumber: string;
  /** Decimal string -- see EventConfig.registrationFee for why. */
  amount: string;
  discountAmount: string;
  taxAmount: string;
  currency: string;
  generatedAt: string | null;
  pdfAvailable: boolean;
  /** Bumped by an admin regenerate (spec #62) -- see document_versions. */
  version: number;
  createdAt: string;
  updatedAt: string;
}
