import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getHabitById, updateHabit, deleteHabit } from '@/lib/db';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const habit = getHabitById(id);
  if (!habit) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(habit);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const data = await request.json();
  const habit = updateHabit(id, data);
  return NextResponse.json(habit);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  deleteHabit(id);
  return NextResponse.json({ success: true });
}
