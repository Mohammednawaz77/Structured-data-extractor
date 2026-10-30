import { ReviewItem } from './types.js';

class ReviewQueueStore {
  private items: Map<string, ReviewItem> = new Map();

  constructor() {
    // Seed some initial review queue items for immediate operational visibility
    this.enqueue({
      id: 'rev_initial_01',
      schemeName: 'Adversarial Discretionary Welfare Fund',
      rawText: 'Discretionary financial aid distributed occasionally as decided by local taluk committee',
      targetType: 'BENEFIT',
      confidence: 0.20,
      reasons: [
        "SUBJECTIVE_AMOUNT: Statement contains non-deterministic amount criteria ('as decided by').",
        "AMBIGUOUS_FREQUENCY: Non-deterministic frequency term 'occasionally' detected.",
        "MISSING_AMOUNT: Unable to extract a deterministic numeric benefit amount."
      ],
      status: 'PENDING',
      createdAt: new Date(Date.now() - 3600000).toISOString()
    });

    this.enqueue({
      id: 'rev_initial_02',
      schemeName: 'Civic Character Grant',
      rawText: 'Deserving citizens of good moral character with approximate income around 2 lakhs',
      targetType: 'ELIGIBILITY',
      confidence: 0.25,
      reasons: [
        "SUBJECTIVE_CRITERIA: 'Moral character/repute' cannot be evaluated deterministically.",
        "SUBJECTIVE_CRITERIA: 'Deserving/needy' is subjective; requires explicit income/wealth limits.",
        "AMBIGUOUS_OPERATOR: Fuzzy qualifiers ('approx', 'around') prevent strict eligibility boundary checks."
      ],
      status: 'PENDING',
      createdAt: new Date(Date.now() - 1800000).toISOString()
    });
  }

  enqueue(item: ReviewItem): ReviewItem {
    this.items.set(item.id, item);
    return item;
  }

  getAll(filters?: { status?: string; targetType?: string }): ReviewItem[] {
    let list = Array.from(this.items.values());
    if (filters?.status) {
      list = list.filter(item => item.status === filters.status);
    }
    if (filters?.targetType) {
      list = list.filter(item => item.targetType === filters.targetType);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getById(id: string): ReviewItem | undefined {
    return this.items.get(id);
  }

  resolve(id: string, resolvedData: any): ReviewItem | null {
    const item = this.items.get(id);
    if (!item) return null;
    item.status = 'RESOLVED';
    item.resolvedData = resolvedData;
    this.items.set(id, item);
    return item;
  }

  dismiss(id: string): ReviewItem | null {
    const item = this.items.get(id);
    if (!item) return null;
    item.status = 'DISMISSED';
    this.items.set(id, item);
    return item;
  }

  clear() {
    this.items.clear();
  }
}

export const reviewQueue = new ReviewQueueStore();
