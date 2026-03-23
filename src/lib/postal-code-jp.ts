/**
 * 日本の郵便番号から住所を取得（zipcloud 公開API）
 * @see https://zipcloud.ibsnet.co.jp/doc/api
 */

export type JapaneseAddressFromZip = {
  state: string;
  city: string;
  town: string;
};

/**
 * 郵便番号（ハイフンあり可）から住所を取得。7桁でない・該当なしは null。
 */
export async function fetchAddressFromPostalCode(
  postalCode: string
): Promise<JapaneseAddressFromZip | null> {
  const digits = postalCode.replace(/\D/g, '');
  if (digits.length !== 7) return null;

  try {
    const res = await fetch(
      `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${encodeURIComponent(digits)}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status: number;
      message: string | null;
      results: Array<{
        address1: string;
        address2: string;
        address3: string;
      }> | null;
    };

    if (data.status !== 200 || !data.results?.length) return null;

    const r = data.results[0];
    return {
      state: r.address1 ?? '',
      city: r.address2 ?? '',
      town: r.address3 ?? '',
    };
  } catch {
    return null;
  }
}
