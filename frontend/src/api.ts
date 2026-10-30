import type { BenefitRow, EligibilityParseResult, ReviewItem, SchemeDocument, ConceptsMetadata } from './types';

const API_BASE = 'http://127.0.0.1:5000/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async getConcepts(): Promise<ConceptsMetadata> {
    const res = await fetch(`${API_BASE}/concepts`);
    return res.json();
  },

  async getSchemes(): Promise<SchemeDocument[]> {
    const res = await fetch(`${API_BASE}/schemes`);
    return res.json();
  },

  async parseBenefit(text: string, schemeName?: string): Promise<BenefitRow> {
    const res = await fetch(`${API_BASE}/parse/benefit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, schemeName })
    });
    return res.json();
  },

  async parseEligibility(text: string, schemeName?: string): Promise<EligibilityParseResult> {
    const res = await fetch(`${API_BASE}/parse/eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, schemeName })
    });
    return res.json();
  },

  async parseScheme(data: {
    schemeName: string;
    code?: string;
    ministry?: string;
    state?: string;
    benefitText: string;
    eligibilityText: string;
  }): Promise<SchemeDocument> {
    const res = await fetch(`${API_BASE}/parse/scheme`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getReviewQueue(status?: string, targetType?: string): Promise<ReviewItem[]> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (targetType) params.set('targetType', targetType);
    const res = await fetch(`${API_BASE}/review-queue?${params.toString()}`);
    return res.json();
  },

  async resolveReviewItem(id: string, resolvedData: any): Promise<ReviewItem> {
    const res = await fetch(`${API_BASE}/review-queue/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolvedData })
    });
    return res.json();
  },

  async dismissReviewItem(id: string): Promise<ReviewItem> {
    const res = await fetch(`${API_BASE}/review-queue/${id}/dismiss`, {
      method: 'POST'
    });
    return res.json();
  }
};
