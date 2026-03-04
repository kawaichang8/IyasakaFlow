import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { stringifyCsv, EXPORT_COLUMNS } from '@/lib/import-export/csv';

export const dynamic = 'force-dynamic';

const MAX_EXPORT = 10000;

export type ExportType = 'accounts' | 'contacts' | 'deals';
export type ExportFormat = 'json' | 'csv';

/**
 * GET /api/export?type=accounts|contacts|deals&format=json|csv
 * データをエクスポート
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'accounts') as ExportType;
    const format = (searchParams.get('format') || 'json') as ExportFormat;
    const includeNotesParam = searchParams.get('includeNotes');
    const includeNotes = includeNotesParam === null ? true : !(includeNotesParam === '0' || includeNotesParam === 'false');

    if (!['accounts', 'contacts', 'deals'].includes(type)) {
      return NextResponse.json(
        { error: 'type は accounts, contacts, deals のいずれかを指定してください' },
        { status: 400 }
      );
    }
    if (!['json', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: 'format は json または csv を指定してください' },
        { status: 400 }
      );
    }

    if (type === 'accounts') {
      const accounts = await prisma.account.findMany({
        take: MAX_EXPORT,
        orderBy: { name: 'asc' },
        include: {
          owner: { select: { id: true, name: true } },
        },
      });
      const rows = accounts.map((a) => ({
        id: a.id,
        name: a.name,
        industry: a.industry ?? '',
        website: a.website ?? '',
        phone: a.phone ?? '',
        email: a.email ?? '',
        address: a.address ?? '',
        city: a.city ?? '',
        state: a.state ?? '',
        postalCode: a.postalCode ?? '',
        country: a.country ?? '',
        employeeCount: a.employeeCount ?? '',
        annualRevenue: a.annualRevenue !== null && a.annualRevenue !== undefined ? String(a.annualRevenue) : '',
        status: a.status.toLowerCase(),
        description: a.description ?? '',
        tags: Array.isArray(a.tags) ? a.tags.join(';') : '',
        ownerName: a.owner?.name ?? '',
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      }));

      if (format === 'csv') {
        const baseColumns = EXPORT_COLUMNS.accounts;
        const filteredColumns = includeNotes
          ? baseColumns
          : baseColumns.filter((c) => c.key !== 'description');
        const columns = filteredColumns.map((c) => ({
          key: c.key as keyof (typeof rows)[0],
          header: c.header,
        }));
        const csv = stringifyCsv(rows, columns);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=UTF-8',
            'Content-Disposition': `attachment; filename="accounts_${dateSuffix()}.csv"`,
          },
        });
      }
      return NextResponse.json({ data: rows });
    }

    if (type === 'contacts') {
      const contacts = await prisma.contact.findMany({
        take: MAX_EXPORT,
        orderBy: { name: 'asc' },
        include: {
          account: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true } },
        },
      });
      const rows = contacts.map((c) => ({
        id: c.id,
        accountId: c.accountId,
        accountName: c.account.name,
        name: c.name,
        firstName: c.firstName ?? '',
        lastName: c.lastName ?? '',
        email: c.email ?? '',
        phone: c.phone ?? '',
        mobile: c.mobile ?? '',
        role: c.role ?? '',
        department: c.department ?? '',
        influenceLevel: c.influenceLevel.toLowerCase(),
        status: c.status.toLowerCase(),
        notes: c.notes ?? '',
        tags: Array.isArray(c.tags) ? c.tags.join(';') : '',
        lastContactDate: c.lastContactDate?.toISOString() ?? '',
        ownerName: c.owner?.name ?? '',
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }));

      if (format === 'csv') {
        const baseColumns = EXPORT_COLUMNS.contacts;
        const filteredColumns = includeNotes
          ? baseColumns
          : baseColumns.filter((c) => c.key !== 'notes');
        const columns = filteredColumns.map((c) => ({
          key: c.key as keyof (typeof rows)[0],
          header: c.header,
        }));
        const csv = stringifyCsv(rows, columns);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=UTF-8',
            'Content-Disposition': `attachment; filename="contacts_${dateSuffix()}.csv"`,
          },
        });
      }
      return NextResponse.json({ data: rows });
    }

    if (type === 'deals') {
      const deals = await prisma.deal.findMany({
        take: MAX_EXPORT,
        orderBy: { updatedAt: 'desc' },
        include: {
          account: { select: { id: true, name: true } },
          contact: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true } },
        },
      });
      const rows = deals.map((d) => ({
        id: d.id,
        accountId: d.accountId,
        accountName: d.account.name,
        contactId: d.contactId ?? '',
        contactName: d.contact?.name ?? '',
        name: d.name,
        value: Number(d.value),
        currency: d.currency,
        stage: d.stage.toLowerCase(),
        probability: d.probability,
        expectedCloseDate: d.expectedCloseDate?.toISOString().split('T')[0] ?? '',
        actualCloseDate: d.actualCloseDate?.toISOString().split('T')[0] ?? '',
        description: d.description ?? '',
        tags: Array.isArray(d.tags) ? d.tags.join(';') : '',
        ownerName: d.owner?.name ?? '',
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      }));

      if (format === 'csv') {
        const baseColumns = EXPORT_COLUMNS.deals;
        const filteredColumns = includeNotes
          ? baseColumns
          : baseColumns.filter((c) => c.key !== 'description');
        const columns = filteredColumns.map((c) => ({
          key: c.key as keyof (typeof rows)[0],
          header: c.header,
        }));
        const csv = stringifyCsv(rows, columns);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=UTF-8',
            'Content-Disposition': `attachment; filename="deals_${dateSuffix()}.csv"`,
          },
        });
      }
      return NextResponse.json({ data: rows });
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'エクスポートに失敗しました' },
      { status: 500 }
    );
  }
}

function dateSuffix(): string {
  return new Date().toISOString().slice(0, 10);
}
