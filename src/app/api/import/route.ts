import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { parseCsv, EXPORT_COLUMNS } from '@/lib/import-export/csv';
import { accountSchema } from '@/lib/validations/account';
import { contactSchema } from '@/lib/validations/contact';
import { dealSchema } from '@/lib/validations/deal';

const MAX_IMPORT = 2000;

type ImportType = 'accounts' | 'contacts' | 'deals';

// CSVヘッダー（日本語）→ フィールド名
const CSV_HEADER_KEYS = {
  accounts: EXPORT_COLUMNS.accounts.map((c) => c.header),
  contacts: EXPORT_COLUMNS.contacts.map((c) => c.header),
  deals: EXPORT_COLUMNS.deals.map((c) => c.header),
};

function toStr(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}
function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

/**
 * POST /api/import
 * FormData: file (File), type (accounts|contacts|deals)
 * ファイルは CSV または JSON
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as ImportType | null;

    if (!file || !type) {
      return NextResponse.json(
        { error: 'file と type を指定してください' },
        { status: 400 }
      );
    }
    if (!['accounts', 'contacts', 'deals'].includes(type)) {
      return NextResponse.json(
        { error: 'type は accounts, contacts, deals のいずれかを指定してください' },
        { status: 400 }
      );
    }

    const raw = await file.text();
    const isCsv = file.name.toLowerCase().endsWith('.csv');
    let rows: Record<string, string>[];

    if (isCsv) {
      // CSV: ヘッダーは日本語（エクスポートと同じ）
      const columns = CSV_HEADER_KEYS[type];
      rows = parseCsv(raw, columns);
    } else {
      // JSON: { data: [...] } または [...]
      try {
        const parsed = JSON.parse(raw) as { data?: unknown[] } | unknown[];
        rows = Array.isArray(parsed) ? (parsed as Record<string, string>[]) : (parsed.data || []) as Record<string, string>[];
      } catch {
        return NextResponse.json(
          { error: 'JSONの形式が不正です' },
          { status: 400 }
        );
      }
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'インポートするデータがありません' },
        { status: 400 }
      );
    }
    if (rows.length > MAX_IMPORT) {
      return NextResponse.json(
        { error: `一度にインポートできる件数は${MAX_IMPORT}件までです` },
        { status: 400 }
      );
    }

    const results = { created: 0, skipped: 0, errors: [] as { row: number; message: string }[] };

    if (type === 'accounts') {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const name = toStr(row.name ?? row['会社名']);
        if (!name) {
          results.errors.push({ row: i + 1, message: '会社名がありません' });
          results.skipped++;
          continue;
        }
        try {
          const data = {
            name,
            industry: toStr(row.industry ?? row['業種']) || undefined,
            website: toStr(row.website ?? row['Webサイト']) || undefined,
            phone: toStr(row.phone ?? row['電話番号']) || undefined,
            email: toStr(row.email ?? row['メール']) || undefined,
            address: toStr(row.address ?? row['住所']) || undefined,
            city: toStr(row.city ?? row['市区町村']) || undefined,
            state: toStr(row.state ?? row['都道府県']) || undefined,
            postalCode: toStr(row.postalCode ?? row['郵便番号']) || undefined,
            country: toStr(row.country ?? row['国']) || '日本',
            employeeCount: toNum(row.employeeCount ?? row['従業員数']),
            annualRevenue: toNum(row.annualRevenue ?? row['年間売上']),
            status: (toStr(row.status ?? row['ステータス']) || 'prospect') as 'prospect' | 'active' | 'inactive' | 'churned',
            description: toStr(row.description ?? row['説明']) || undefined,
            tags: toStr(row.tags ?? row['タグ']).split(/[;,]/).map((s) => s.trim()).filter(Boolean),
          };
          accountSchema.parse(data);
          await prisma.account.create({
            data: {
              ...data,
              annualRevenue: data.annualRevenue != null ? BigInt(data.annualRevenue) : null,
            },
          });
          results.created++;
        } catch (err: any) {
          results.errors.push({ row: i + 1, message: err.message || 'バリデーションエラー' });
          results.skipped++;
        }
      }
    }

    if (type === 'contacts') {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const accountName = toStr(row.accountName ?? row['企業名']);
        const name = toStr(row.name ?? row['名前']);
        if (!accountName || !name) {
          results.errors.push({ row: i + 1, message: '企業名と名前は必須です' });
          results.skipped++;
          continue;
        }
        const account = await prisma.account.findFirst({
          where: { name: { equals: accountName, mode: 'insensitive' } },
        });
        if (!account) {
          results.errors.push({ row: i + 1, message: `企業「${accountName}」が見つかりません` });
          results.skipped++;
          continue;
        }
        try {
          const influenceLevel = (toStr(row.influenceLevel ?? row['影響力レベル']) || 'other').toLowerCase().replace(' ', '_') as any;
          const status = (toStr(row.status ?? row['ステータス']) || 'active').toLowerCase() as 'active' | 'inactive' | 'bounced';
          const data = {
            accountId: account.id,
            name,
            firstName: toStr(row.firstName ?? row['名']) || undefined,
            lastName: toStr(row.lastName ?? row['姓']) || undefined,
            email: toStr(row.email ?? row['メール']) || undefined,
            phone: toStr(row.phone ?? row['電話番号']) || undefined,
            mobile: toStr(row.mobile ?? row['携帯']) || undefined,
            role: toStr(row.role ?? row['役職']) || undefined,
            department: toStr(row.department ?? row['部署']) || undefined,
            influenceLevel: ['decision_maker', 'influencer', 'user', 'gatekeeper', 'other'].includes(influenceLevel) ? influenceLevel : 'other',
            status: ['active', 'inactive', 'bounced'].includes(status) ? status : 'active',
            notes: toStr(row.notes ?? row['メモ']) || undefined,
            tags: toStr(row.tags ?? row['タグ']).split(/[;,]/).map((s) => s.trim()).filter(Boolean),
          };
          contactSchema.parse(data);
          await prisma.contact.create({
            data: {
              ...data,
              influenceLevel: data.influenceLevel.toUpperCase() as any,
              status: data.status.toUpperCase() as any,
            },
          });
          results.created++;
        } catch (err: any) {
          results.errors.push({ row: i + 1, message: err.message || 'バリデーションエラー' });
          results.skipped++;
        }
      }
    }

    if (type === 'deals') {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const accountName = toStr(row.accountName ?? row['企業名']);
        const name = toStr(row.name ?? row['案件名']);
        if (!accountName || !name) {
          results.errors.push({ row: i + 1, message: '企業名と案件名は必須です' });
          results.skipped++;
          continue;
        }
        const account = await prisma.account.findFirst({
          where: { name: { equals: accountName, mode: 'insensitive' } },
        });
        if (!account) {
          results.errors.push({ row: i + 1, message: `企業「${accountName}」が見つかりません` });
          results.skipped++;
          continue;
        }
        let contactId: string | null = null;
        const contactName = toStr(row.contactName ?? row['連絡先名']);
        if (contactName) {
          const contact = await prisma.contact.findFirst({
            where: {
              accountId: account.id,
              name: { equals: contactName, mode: 'insensitive' },
            },
          });
          if (contact) contactId = contact.id;
        }
        try {
          const stage = (toStr(row.stage ?? row['ステージ']) || 'lead').toLowerCase().replace(' ', '_') as any;
          const data = {
            accountId: account.id,
            contactId,
            name,
            value: toNum(row.value ?? row['金額']) ?? 0,
            currency: toStr(row.currency ?? row['通貨']) || 'JPY',
            stage: ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'].includes(stage) ? stage : 'lead',
            probability: Math.min(100, Math.max(0, toNum(row.probability ?? row['成約確率']) ?? 0)),
            expectedCloseDate: toStr(row.expectedCloseDate ?? row['予定クローズ日']) || undefined,
            description: toStr(row.description ?? row['説明']) || undefined,
            tags: toStr(row.tags ?? row['タグ']).split(/[;,]/).map((s) => s.trim()).filter(Boolean),
          };
          dealSchema.parse(data);
          await prisma.deal.create({
            data: {
              ...data,
              stage: data.stage.toUpperCase() as any,
              value: BigInt(data.value),
              expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
            },
          });
          results.created++;
        } catch (err: any) {
          results.errors.push({ row: i + 1, message: err.message || 'バリデーションエラー' });
          results.skipped++;
        }
      }
    }

    return NextResponse.json({
      message: 'インポートが完了しました',
      created: results.created,
      skipped: results.skipped,
      total: rows.length,
      errors: results.errors.slice(0, 50), // 最大50件まで返す
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'インポートに失敗しました' },
      { status: 500 }
    );
  }
}
