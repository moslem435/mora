export interface QuickAddLinkDraft {
  url: string;
  title?: string;
  description?: string;
  source?: string;
  createdAt: number;
}

export const QUICK_ADD_DRAFT_KEY = 'mora_pending_link_draft';

const QUICK_ADD_MAX_AGE = 10 * 60 * 1000;
const COMMON_SUBDOMAINS = new Set(['www', 'www2', 'm', 'mobile', 'app', 'docs']);

export function normalizeUrlCandidate(raw: string): string | null {
  const candidate = raw
    .trim()
    .split(/\r?\n/)
    .map(part => part.trim())
    .find(Boolean) || '';

  if (!candidate || /\s/.test(candidate)) return null;

  const withProtocol = /^https?:\/\//i.test(candidate)
    ? candidate
    : /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(candidate)
      ? `https://${candidate}`
      : '';

  if (!withProtocol) return null;

  try {
    const url = new URL(withProtocol);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch (e) {
    return null;
  }
}

export function saveQuickAddDraft(draft: Omit<QuickAddLinkDraft, 'createdAt'> & Partial<Pick<QuickAddLinkDraft, 'createdAt'>>) {
  if (typeof window === 'undefined') return;

  const normalizedUrl = normalizeUrlCandidate(draft.url);
  if (!normalizedUrl) return;

  try {
    const payload: QuickAddLinkDraft = {
      ...draft,
      url: normalizedUrl,
      createdAt: draft.createdAt ?? Date.now()
    };
    sessionStorage.setItem(QUICK_ADD_DRAFT_KEY, JSON.stringify(payload));
  } catch (e) {
    console.error('Failed to persist quick-add link draft:', e);
  }
}

export function readQuickAddDraft(): QuickAddLinkDraft | null {
  if (typeof window === 'undefined') return null;

  const rawDraft = sessionStorage.getItem(QUICK_ADD_DRAFT_KEY);
  if (!rawDraft) return null;

  try {
    const parsed = JSON.parse(rawDraft) as Partial<QuickAddLinkDraft>;
    const normalizedUrl = normalizeUrlCandidate(parsed.url || '');
    const createdAt = Number(parsed.createdAt);

    if (!normalizedUrl || !Number.isFinite(createdAt) || Date.now() - createdAt > QUICK_ADD_MAX_AGE) {
      clearQuickAddDraft();
      return null;
    }

    return {
      url: normalizedUrl,
      title: parsed.title?.trim() || undefined,
      description: parsed.description?.trim() || undefined,
      source: parsed.source,
      createdAt
    };
  } catch (e) {
    clearQuickAddDraft();
    return null;
  }
}

export function clearQuickAddDraft() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(QUICK_ADD_DRAFT_KEY);
}

export function getQuickAddHostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch (e) {
    return '该网址';
  }
}

export function getSuggestedLinkTitle(url: string): string {
  try {
    const hostParts = new URL(url)
      .hostname
      .toLowerCase()
      .split('.')
      .filter(Boolean)
      .filter(part => !COMMON_SUBDOMAINS.has(part));

    if (hostParts.length === 0) return '';

    const baseName = hostParts.length >= 2 ? hostParts[hostParts.length - 2] : hostParts[0];

    return baseName
      .split(/[-_]/)
      .filter(Boolean)
      .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  } catch (e) {
    return '';
  }
}
