import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { parseCsv, EXPORT_COLUMNS } from '@/lib/import-export/csv';
import { accountSchema } from '@/lib/validations/account';
import { contactSchema } from '@/lib/validations/contact';
import { dealSchema } from '@/lib/validations/deal';

const MAX_IMPORT = 2000;

type ImportType = 'accounts' | 'contacts' | 'deals';

// CSVヘッダー（日本語）。インポート時は別名も受け付ける
const CSV_HEADER_KEYS = {
  accounts: EXPORT_COLUMNS.accounts.map((c) => c.header),
  contacts: EXPORT_COLUMNS.contacts.map((c) => c.header),
  deals: EXPORT_COLUMNS.deals.map((c) => c.header),
};

// 企業アカウントインポートで受け付ける列の別名（会社名/企業名・宛名・英語含む）
const ACCOUNT_IMPORT_COLUMNS = [
  '会社名', '企業名', '企業', '会社', '組織名', '組織', '取引先', '宛名', 'Company', 'company',
  '業種', 'Webサイト', '電話番号', '電話', 'メール', 'メールアドレス', '住所', '住所２', '市区町村', '都道府県', '郵便番号', '〒', '国',
  '従業員数', '年間売上', 'ステータス', '説明', '備考', 'タグ',
  'Email', 'email', 'Phone', 'phone',
  'No.', 'カテゴリ', 'ビール数量', '発送日', '発送',
];

// 企業で「正式な項目」として使う列（これ以外は説明にまとめる）
const ACCOUNT_FIELD_KEYS = new Set([
  '会社名', '企業名', '企業', '会社', '組織名', '組織', '取引先', '宛名', 'Company', 'company',
  '業種', 'Webサイト', '電話番号', '電話', 'メール', 'メールアドレス', '住所', '住所２', '市区町村', '都道府県', '郵便番号', '〒', '国',
  '従業員数', '年間売上', 'ステータス', '説明', '備考', 'タグ', 'Email', 'email', 'Phone', 'phone',
]);

// 連絡先インポートで受け付ける列の別名（企業名・名前・住所・電話・メールなど）
const CONTACT_IMPORT_COLUMNS = [
  '企業名', '会社名', '企業', '会社', '組織名', '組織', '取引先', '宛名', 'Company', 'company',
  '名前', '氏名', '担当者名', '連絡先名', '担当者', '連絡先', 'Name', 'name', 'Contact', 'contact',
  '名', '姓', 'メール', 'メールアドレス', '電話番号', '電話', '携帯', '役職', '部署',
  '住所', '住所２', '〒', '影響力レベル', 'ステータス', 'メモ', '備考', 'タグ',
  'Email', 'email', 'Phone', 'phone',
  'No.', 'カテゴリ', 'ビール数量', '発送日', '発送',
];

// 連絡先で「正式な項目」として使う列（これ以外は備考にまとめる）
const CONTACT_FIELD_KEYS = new Set([
  '企業名', '会社名', '企業', '会社', '組織名', '組織', '取引先', '宛名', 'Company', 'company',
  '名前', '氏名', '担当者名', '連絡先名', '担当者', '連絡先', 'Name', 'name', 'Contact', 'contact',
  '名', '姓', 'メール', 'メールアドレス', '電話番号', '電話', '携帯', '役職', '部署',
  '住所', '住所２', '〒', '影響力レベル', 'ステータス', 'メモ', '備考', 'タグ',
  'Email', 'email', 'Phone', 'phone',
]);

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

    let contactHeaderRow: string[] = [];
    let accountHeaderRow: string[] = [];
    if (isCsv) {
      // CSV: 企業は「企業名」、連絡先は「会社名」「氏名」など別名も受け付ける
      const columns =
        type === 'accounts' ? ACCOUNT_IMPORT_COLUMNS :
        type === 'contacts' ? CONTACT_IMPORT_COLUMNS :
        CSV_HEADER_KEYS[type];
      if (type === 'contacts') {
        const parsed = parseCsv(raw, columns, { returnHeaders: true });
        rows = parsed.rows;
        contactHeaderRow = parsed.headerRow;
      } else if (type === 'accounts') {
        const parsed = parseCsv(raw, columns, { returnHeaders: true });
        rows = parsed.rows;
        accountHeaderRow = parsed.headerRow;
      } else {
        rows = parseCsv(raw, columns);
      }
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

    const accountStatusMap: Record<string, 'PROSPECT' | 'ACTIVE' | 'INACTIVE' | 'CHURNED'> = {
      prospect: 'PROSPECT',
      active: 'ACTIVE',
      inactive: 'INACTIVE',
      churned: 'CHURNED',
    };

    if (type === 'accounts') {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;
        const name = toStr(
          row['会社名'] ?? row['企業名'] ?? row['企業'] ?? row['会社'] ?? row['組織名'] ?? row['組織'] ?? row['取引先'] ?? row['宛名'] ?? row['Company'] ?? row['company']
        );
        if (!name) {
          const baseMsg = '会社名（または企業名）がありません。CSVの1行目に「会社名」または「企業名」の列があるか確認してください。';
          const isFirstError = !results.errors.some((e) => e.message.includes('会社名（または企業名）がありません'));
          const hint = isFirstError && accountHeaderRow.length > 0
            ? ` 検出した1行目の列: [${accountHeaderRow.join(', ')}]`
            : '';
          results.errors.push({
            row: i + 1,
            message: baseMsg + hint,
          });
          results.skipped++;
          continue;
        }
        try {
          const baseDesc = toStr(row['説明'] ?? row['備考']);
          const accountExtra: string[] = [];
          Object.entries(row).forEach(([key, val]) => {
            const v = toStr(val);
            if (v && !ACCOUNT_FIELD_KEYS.has(key)) accountExtra.push(`${key}: ${v}`);
          });
          const description = accountExtra.length ? (baseDesc ? `${baseDesc}\n${accountExtra.join('\n')}` : accountExtra.join('\n')) : baseDesc || undefined;
          const data = {
            name,
            industry: toStr(row['業種']) || undefined,
            website: toStr(row['Webサイト']) || undefined,
            phone: toStr(row['電話番号'] ?? row['電話'] ?? row['Phone'] ?? row['phone']) || undefined,
            email: toStr(row['メール'] ?? row['メールアドレス'] ?? row['Email'] ?? row['email']) || undefined,
            address: toStr(row['住所'] ?? row['住所２']) || undefined,
            city: toStr(row['市区町村']) || undefined,
            state: toStr(row['都道府県']) || undefined,
            postalCode: toStr(row['郵便番号'] ?? row['〒']) || undefined,
            country: toStr(row['国']) || '日本',
            employeeCount: toNum(row['従業員数']),
            annualRevenue: toNum(row['年間売上']),
            status: (toStr(row['ステータス']) || 'prospect') as 'prospect' | 'active' | 'inactive' | 'churned',
            description: description || undefined,
            tags: toStr(row['タグ']).split(/[;,]/).map((s) => s.trim()).filter(Boolean),
          };
          accountSchema.parse(data);
          await prisma.account.create({
            data: {
              name: data.name,
              industry: data.industry,
              website: data.website,
              phone: data.phone,
              email: data.email,
              address: data.address,
              city: data.city,
              state: data.state,
              postalCode: data.postalCode,
              country: data.country,
              employeeCount: data.employeeCount,
              annualRevenue: data.annualRevenue !== null && data.annualRevenue !== undefined ? BigInt(data.annualRevenue) : null,
              status: accountStatusMap[data.status] ?? 'PROSPECT',
              description: data.description,
              tags: data.tags,
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
        if (!row) continue;
        const accountName = toStr(
          row['企業名'] ?? row['会社名'] ?? row['企業'] ?? row['会社'] ?? row['組織名'] ?? row['組織'] ?? row['取引先'] ?? row['Company'] ?? row['company']
        );
        const name = toStr(
          row['名前'] ?? row['氏名'] ?? row['担当者名'] ?? row['連絡先名'] ?? row['担当者'] ?? row['連絡先'] ?? row['宛名'] ?? row['Name'] ?? row['name'] ?? row['Contact'] ?? row['contact']
        );
        if (!accountName || !name) {
          const baseMsg = '企業名（または会社名）と名前（または氏名・担当者名・宛名）は必須です。CSVの1行目に「企業名」「名前」または「会社名」「氏名」「宛名」などの列があるか確認してください。';
          const isFirstRequiredError = !results.errors.some((e) => e.message.includes('必須です'));
          const hint = isFirstRequiredError && contactHeaderRow.length > 0
            ? ` 検出した1行目の列: [${contactHeaderRow.join(', ')}]`
            : '';
          results.errors.push({
            row: i + 1,
            message: baseMsg + hint,
          });
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
          const influenceLevel = (toStr(row['影響力レベル']) || 'other').toLowerCase().replace(/ /g, '_') as any;
          const status = (toStr(row['ステータス']) || 'active').toLowerCase() as 'active' | 'inactive' | 'bounced';
          const baseNotes = toStr(row['メモ'] ?? row['備考']);
          const extraParts: string[] = [];
          Object.entries(row).forEach(([key, val]) => {
            const v = toStr(val);
            if (v && !CONTACT_FIELD_KEYS.has(key)) extraParts.push(`${key}: ${v}`);
          });
          const notes = extraParts.length ? (baseNotes ? `${baseNotes}\n${extraParts.join('\n')}` : extraParts.join('\n')) : baseNotes || undefined;
          const data = {
            accountId: account.id,
            name,
            firstName: toStr(row['名']) || undefined,
            lastName: toStr(row['姓']) || undefined,
            email: toStr(row['メール'] ?? row['メールアドレス'] ?? row['Email'] ?? row['email']) || undefined,
            phone: toStr(row['電話番号'] ?? row['電話'] ?? row['Phone'] ?? row['phone']) || undefined,
            mobile: toStr(row['携帯']) || undefined,
            role: toStr(row['役職']) || undefined,
            department: toStr(row['部署']) || undefined,
            influenceLevel: ['decision_maker', 'influencer', 'user', 'gatekeeper', 'other'].includes(influenceLevel) ? influenceLevel : 'other',
            status: ['active', 'inactive', 'bounced'].includes(status) ? status : 'active',
            notes: notes || undefined,
            tags: toStr(row['タグ']).split(/[;,]/).map((s) => s.trim()).filter(Boolean),
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
        if (!row) continue;
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
      errors: results.errors.slice(0, 100), // 最大100件まで返す（スキップ理由の確認用）
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'インポートに失敗しました' },
      { status: 500 }
    );
  }
}
