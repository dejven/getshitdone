import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { createWebhookKey, getAllWebhookKeys } from '@/lib/db';

export async function GET() {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const keys = getAllWebhookKeys();
  return NextResponse.json(keys);
}

export async function POST(request: Request) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await request.json();
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const result = createWebhookKey(name);
  return NextResponse.json(result, { status: 201 });
}
