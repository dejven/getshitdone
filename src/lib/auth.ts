import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getJwtSecret, getPassword, setPassword, isSetup } from './db';

const TOKEN_NAME = 'gsd_token';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(): string {
  const secret = getJwtSecret();
  return jwt.sign({ authenticated: true }, secret, { expiresIn: '30d' });
}

export async function isAuthenticated(): Promise<boolean> {
  if (!isSetup()) return false;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_NAME)?.value;
    if (!token) return false;

    const secret = getJwtSecret();
    jwt.verify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function login(password: string): Promise<string | null> {
  const hash = getPassword();
  if (!hash) return null;

  const valid = await verifyPassword(password, hash);
  if (!valid) return null;

  return createToken();
}

export async function setup(password: string): Promise<string> {
  const hash = await hashPassword(password);
  setPassword(hash);
  return createToken();
}

export { isSetup, TOKEN_NAME };
