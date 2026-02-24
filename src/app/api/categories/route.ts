import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getAllCategories } from '@/lib/db';

export async function GET() {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const categories = getAllCategories();
  return NextResponse.json(categories);
}
