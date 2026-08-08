import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { safeJsonParse } from '@/lib/json';
import { USER_SELECT_FULL } from '@/lib/db-selects';

export const dynamic = 'force-dynamic';


// GET /api/profile?handle=@xxx — get full profile (public fields only for other users)
// GET /api/profile (no handle) — get own full profile (all fields)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const handle = searchParams.get('handle');
    const currentUserId = (request.headers.get('x-user-id') ?? await getUserIdFromRequest(request));

    // Common select with role/type/sport joins
    const selectWithRelations = {
      ...USER_SELECT_FULL,
      favorites: true,
      userRole: { select: { id: true, name: true, slug: true, icon: true, category: true, description: true } },
      userRoleType: { select: { id: true, name: true, slug: true, description: true } },
      userSports: { select: { sport: { select: { id: true, name: true, slug: true, icon: true, category: true, sportType: true, format: true } } } },
    };

    if (handle) {
      // Viewing someone else's profile — return public fields only
      const user = await db.user.findUnique({
        where: { handle },
        select: selectWithRelations,
      });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Check privacy settings for sensitive fields
      const privacy = safeJsonParse(user.privacySettings || '{}', {});
      const isOwnProfile = currentUserId === user.id;

      const publicUser: Record<string, unknown> = {
        ...user,
        roleName: user.userRole?.name || 'Fan',
        roleSlug: user.userRole?.slug || 'fan',
        roleIcon: user.userRole?.icon || '⭐',
        roleCategory: user.userRole?.category || 'individual',
        roleDescription: user.userRole?.description || '',
        typeName: user.userRoleType?.name || 'Casual Fan',
        typeSlug: user.userRoleType?.slug || 'casual',
        typeDescription: user.userRoleType?.description || null,
        sports: user.userSports.map(us => us.sport),
        sportsFollowing: safeJsonParse(user.sportsFollowing, []),
        roleData: safeJsonParse(user.roleData, {}),
        roleProfile: safeJsonParse(user.roleProfile, {}),
        interests: safeJsonParse(user.interests, []),
        privacySettings: safeJsonParse(user.privacySettings, {}),
        notifPrefs: safeJsonParse(user.notifPrefs, {}),
        dateOfBirth: user.dateOfBirth?.toISOString() || null,
        favorites: user.favorites.map(f => ({
          id: f.id, targetType: f.targetType, targetName: f.targetName, targetHandle: f.targetHandle,
        })),
      };

      // Remove raw relation objects (already extracted above)
      delete publicUser.userRole;
      delete publicUser.userRoleType;
      delete publicUser.userSports;

      // Apply privacy — hide phone/email unless own profile or allowed
      if (!isOwnProfile) {
        if (!(privacy as Record<string, unknown>).showPhone) publicUser.phone = null;
        if (!(privacy as Record<string, unknown>).showEmail) publicUser.email = null;
        // Don't expose notifPrefs or privacySettings to other users
        delete publicUser.notifPrefs;
        delete publicUser.privacySettings;
      }

      return NextResponse.json(publicUser);
    }

    // No handle — return own profile
    if (!currentUserId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: currentUserId },
      select: selectWithRelations,
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...user,
      roleName: user.userRole?.name || 'Fan',
      roleSlug: user.userRole?.slug || 'fan',
      roleIcon: user.userRole?.icon || '⭐',
      roleCategory: user.userRole?.category || 'individual',
      roleDescription: user.userRole?.description || '',
      typeName: user.userRoleType?.name || 'Casual Fan',
      typeSlug: user.userRoleType?.slug || 'casual',
      typeDescription: user.userRoleType?.description || null,
      sports: user.userSports.map(us => us.sport),
      sportsFollowing: safeJsonParse(user.sportsFollowing, []),
      roleData: safeJsonParse(user.roleData, {}),
      roleProfile: safeJsonParse(user.roleProfile, {}),
      interests: safeJsonParse(user.interests, []),
      privacySettings: safeJsonParse(user.privacySettings, {}),
      notifPrefs: safeJsonParse(user.notifPrefs, {}),
      dateOfBirth: user.dateOfBirth?.toISOString() || null,
      favorites: user.favorites.map(f => ({
        id: f.id, targetType: f.targetType, targetName: f.targetName, targetHandle: f.targetHandle,
      })),
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PUT /api/profile — update own profile (requires auth)
export async function PUT(request: NextRequest) {
  try {
    const userId = (request.headers.get('x-user-id') ?? await getUserIdFromRequest(request));
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json();

    // Build update object from allowed fields
    const update: Record<string, unknown> = {};

    // Identity
    if (body.name !== undefined) update.name = String(body.name).trim();
    if (body.handle !== undefined) {
      const h = String(body.handle).trim();
      if (!h.startsWith('@')) update.handle = '@' + h;
      else update.handle = h;
    }
    if (body.bio !== undefined) update.bio = String(body.bio).trim() || null;
    if (body.aboutMe !== undefined) update.aboutMe = String(body.aboutMe).trim() || null;
    if (body.pronouns !== undefined) update.pronouns = String(body.pronouns).trim() || null;
    if (body.location !== undefined) update.location = String(body.location).trim() || null;
    if (body.coverGradient !== undefined) update.coverGradient = String(body.coverGradient);

    // Personal
    if (body.dateOfBirth !== undefined) {
      update.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
    }
    if (body.gender !== undefined) update.gender = String(body.gender) || null;
    if (body.nationality !== undefined) update.nationality = String(body.nationality) || null;
    if (body.countryOfOrigin !== undefined) update.countryOfOrigin = String(body.countryOfOrigin) || null;
    if (body.currentCountry !== undefined) update.currentCountry = String(body.currentCountry) || null;
    if (body.region !== undefined) update.region = String(body.region) || null;
    if (body.city !== undefined) update.city = String(body.city) || null;
    if (body.preferredLanguage !== undefined) update.preferredLanguage = String(body.preferredLanguage) || null;
    if (body.timezone !== undefined) update.timezone = String(body.timezone) || null;

    // Contact
    if (body.phone !== undefined) update.phone = String(body.phone) || null;
    if (body.website !== undefined) update.website = String(body.website) || null;
    if (body.whatsapp !== undefined) update.whatsapp = String(body.whatsapp) || null;
    if (body.socialInstagram !== undefined) update.socialInstagram = String(body.socialInstagram) || null;
    if (body.socialX !== undefined) update.socialX = String(body.socialX) || null;
    if (body.socialTikTok !== undefined) update.socialTikTok = String(body.socialTikTok) || null;
    if (body.socialFacebook !== undefined) update.socialFacebook = String(body.socialFacebook) || null;
    if (body.socialLinkedIn !== undefined) update.socialLinkedIn = String(body.socialLinkedIn) || null;
    if (body.socialYouTube !== undefined) update.socialYouTube = String(body.socialYouTube) || null;
    if (body.socialThreads !== undefined) update.socialThreads = String(body.socialThreads) || null;

    // Appearance
    if (body.theme !== undefined) update.theme = String(body.theme);
    if (body.fontSize !== undefined) update.fontSize = String(body.fontSize);
    if (body.reducedMotion !== undefined) update.reducedMotion = Boolean(body.reducedMotion);
    if (body.highContrast !== undefined) update.highContrast = Boolean(body.highContrast);

    // Settings (JSON)
    if (body.privacySettings !== undefined) update.privacySettings = JSON.stringify(body.privacySettings);
    if (body.notifPrefs !== undefined) update.notifPrefs = JSON.stringify(body.notifPrefs);
    if (body.interests !== undefined) update.interests = JSON.stringify(body.interests);
    if (body.sportsFollowing !== undefined) update.sportsFollowing = JSON.stringify(body.sportsFollowing);
    if (body.roleProfile !== undefined) update.roleProfile = JSON.stringify(body.roleProfile);

    // ─── Sync UserSport junction table when sportsFollowing changes ──
    // E-1: This was a critical bug — only the JSON field was updated, not
    // the normalized UserSport records. Now both are kept in sync.
    if (body.sportsFollowing !== undefined) {
      const newSports: string[] = Array.isArray(body.sportsFollowing) ? body.sportsFollowing : [];
      // Resolve sport names/slugs to DB IDs
      const sportRecords = await db.sport.findMany({
        where: {
          isActive: true,
          OR: [
            { slug: { in: newSports.map((s: string) => s.toLowerCase().replace(/\s+/g, '-')) } },
            { name: { in: newSports } },
          ],
        },
        select: { id: true },
      });
      const newSportIds = sportRecords.map(s => s.id);

      // Get current UserSport records
      const currentUserSports = await db.userSport.findMany({
        where: { userId },
        select: { sportId: true },
      });
      const currentSportIds = new Set(currentUserSports.map(us => us.sportId));

      // Determine adds and removes
      const toAdd = newSportIds.filter(id => !currentSportIds.has(id));
      const toRemove = [...currentSportIds].filter(id => !newSportIds.includes(id));

      // Delete removed sports
      if (toRemove.length > 0) {
        await db.userSport.deleteMany({
          where: { userId, sportId: { in: toRemove } },
        });
      }

      // Create added sports
      if (toAdd.length > 0) {
        await db.userSport.createMany({
          data: toAdd.map(sportId => ({ userId, sportId })),
          skipDuplicates: true,
        });
      }
    }

    // Handle uniqueness check if handle is changing
    if (update.handle) {
      const existing = await db.user.findFirst({
        where: { handle: update.handle as string, NOT: { id: userId } },
      });
      if (existing) {
        return NextResponse.json({ error: 'This handle is already taken.' }, { status: 409 });
      }
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: update,
      select: USER_SELECT_FULL,
    });

    return NextResponse.json({
      ...updated,
      sportsFollowing: safeJsonParse(updated.sportsFollowing, []),
      roleData: safeJsonParse(updated.roleData, {}),
      roleProfile: safeJsonParse(updated.roleProfile, {}),
      interests: safeJsonParse(updated.interests, []),
      privacySettings: safeJsonParse(updated.privacySettings, {}),
      notifPrefs: safeJsonParse(updated.notifPrefs, {}),
      dateOfBirth: updated.dateOfBirth?.toISOString() || null,
    });
  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
