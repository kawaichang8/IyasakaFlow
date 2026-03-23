/**
 * 連絡先の姓・名から表示用フルネームを生成（半角・全角スペースを1つに）
 */
export function buildContactFullName(lastName: string, firstName: string): string {
  const l = lastName.trim();
  const f = firstName.trim();
  if (!l && !f) return '';
  if (!f) return l;
  if (!l) return f;
  return `${l} ${f}`.replace(/\s+/g, ' ');
}

/**
 * DB・旧データの氏名からフォーム用の姓・名を推定
 * - lastName / firstName がどちらか入っていればそれを優先
 * - なければ name を半角/全角スペースで分割（先頭を姓）
 * - スペースがなければ全体を姓にし、名は空（ユーザーが分ける）
 */
export function contactNamePartsFromLegacy(
  name: string | null | undefined,
  lastName?: string | null,
  firstName?: string | null
): { lastName: string; firstName: string } {
  const l = lastName?.trim() ?? '';
  const f = firstName?.trim() ?? '';
  if (l || f) {
    return { lastName: l, firstName: f };
  }
  const n = (name ?? '').trim();
  if (!n) return { lastName: '', firstName: '' };
  const spaceIdx = (() => {
    const half = n.indexOf(' ');
    const full = n.indexOf('　');
    if (half < 0) return full;
    if (full < 0) return half;
    return Math.min(half, full);
  })();
  if (spaceIdx < 0) {
    return { lastName: n, firstName: '' };
  }
  return {
    lastName: n.slice(0, spaceIdx).trim(),
    firstName: n.slice(spaceIdx + 1).trim(),
  };
}

/**
 * メール挨拶など用の「姓」（未分離なら氏名の先頭トークン）
 */
export function getContactSalutationLastName(contact: {
  lastName?: string | null;
  name: string;
}): string {
  const l = contact.lastName?.trim();
  if (l) return l;
  const n = contact.name.trim();
  if (!n) return '';
  const spaceIdx = (() => {
    const half = n.indexOf(' ');
    const full = n.indexOf('　');
    if (half < 0) return full;
    if (full < 0) return half;
    return Math.min(half, full);
  })();
  if (spaceIdx < 0) return n;
  return n.slice(0, spaceIdx).trim() || n;
}
