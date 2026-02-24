import { NextResponse } from 'next/server';
import { validateWebhookKey, getAllHabits, createHabit } from '@/lib/db';

export async function GET(request: Request) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');

  if (!apiKey || !validateWebhookKey(apiKey)) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const habits = getAllHabits();
  return NextResponse.json(habits);
}

export async function POST(request: Request) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');

  if (!apiKey || !validateWebhookKey(apiKey)) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const data = await request.json();
  if (!data.name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const habit = createHabit(data);
  return NextResponse.json(habit, { status: 201 });
}
