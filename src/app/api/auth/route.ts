import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.passwordHash) {
      return NextResponse.json({ error: 'Account not set up for password login' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Return user profile (no JWT for now — client stores auth state)
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      handle: user.handle,
      avatar: user.avatarInitials || user.name.slice(0, 2).toUpperCase(),
      role: user.role,
      verificationStatus: user.verificationStatus,
      bio: user.bio || '',
      location: user.location || '',
      followerCount: user.followerCount,
      followingCount: user.followingCount,
      postCount: user.postCount,
      isVerified: user.isVerified,
      coverGradient: user.coverGradient,
      sportsFollowing: JSON.parse(user.sportsFollowing),
      roleData: JSON.parse(user.roleData),
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
