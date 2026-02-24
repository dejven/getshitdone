import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getAllHabits, createHabit } from '@/lib/db';

export async function GET() {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const habits = getAllHabits();
  return NextResponse.json(habits);
}

export async function POST(request: Request) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.json();
  if (!data.name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const habit = createHabit(data);
  return NextResponse.json(habit, { status: 201 });
}
