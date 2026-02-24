import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { uncompleteHabit } from '@/lib/db';

export async function DELETE(request: Request, { params }: { params: Promise<{ habitId: string }> }) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { habitId } = await params;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const result = uncompleteHabit(habitId, date);
  if (!result) {
    return NextResponse.json({ error: 'No completion found' }, { status: 404 });
  }
  return NextResponse.json(result);
}
