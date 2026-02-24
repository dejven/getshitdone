import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { deleteWebhookKey } from '@/lib/db';

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  deleteWebhookKey(id);
  return NextResponse.json({ success: true });
}
