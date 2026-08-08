import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ─── PATCH — edit your own prediction ──────────────────────────
// Body: { homeTeam?, awayTeam?, predictedHome?, predictedAway?, confidence? }
//
// Rules:
//   • Must be authenticated
//   • Prediction must belong to the caller (userId === prediction.userId)
//   • Cannot edit once the result has been recorded (isCorrect !== null)
//
// Returns the updated prediction + the new content string for the post.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId =
      request.headers.get('x-user-id') ?? (await getUserIdFromRequest(request));
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const prediction = await db.prediction.findUnique({
      where: { id },
      select: {
        id: true, userId: true, postId: true,
        homeTeam: true, awayTeam: true,
        predictedHome: true, predictedAway: true,
        confidence: true, isCorrect: true,
      },
    });

    if (!prediction) {
      return NextResponse.json(
        { error: 'Prediction not found.' },
        { status: 404 }
      );
    }

    if (prediction.userId !== userId) {
      return NextResponse.json(
        { error: 'You can only edit your own predictions.' },
        { status: 403 }
      );
    }

    // Once the result is recorded, the prediction is locked.
    if (prediction.isCorrect !== null && prediction.isCorrect !== undefined) {
      return NextResponse.json(
        { error: 'This prediction has been resolved and can no longer be edited.' },
        { status: 410 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const homeTeam = typeof body.homeTeam === 'string' ? body.homeTeam.trim() : null;
    const awayTeam = typeof body.awayTeam === 'string' ? body.awayTeam.trim() : null;
    const predictedHome = typeof body.predictedHome === 'number' ? body.predictedHome : null;
    const predictedAway = typeof body.predictedAway === 'number' ? body.predictedAway : null;
    const confidence =
      typeof body.confidence === 'string' && ['low', 'medium', 'high'].includes(body.confidence)
        ? body.confidence
        : null;

    if (!homeTeam || !awayTeam || predictedHome === null || predictedAway === null) {
      return NextResponse.json(
        { error: 'homeTeam, awayTeam, predictedHome and predictedAway are required.' },
        { status: 400 }
      );
    }

    // Update prediction row
    const updated = await db.prediction.update({
      where: { id },
      data: {
        homeTeam,
        awayTeam,
        predictedHome,
        predictedAway,
        confidence: confidence ?? prediction.confidence,
      },
    });

    // Sync the parent post content so the feed shows the new scoreline.
    if (prediction.postId) {
      const newContent = `${homeTeam} ${predictedHome} - ${predictedAway} ${awayTeam}`;
      await db.post.update({
        where: { id: prediction.postId },
        data: { content: newContent },
      });
    }

    return NextResponse.json({
      ok: true,
      prediction: updated,
      content: `${homeTeam} ${predictedHome} - ${predictedAway} ${awayTeam}`,
    });
  } catch (error) {
    console.error('Edit prediction error:', error);
    return NextResponse.json({ error: 'Failed to edit prediction' }, { status: 500 });
  }
}

// ─── DELETE — remove your own prediction ───────────────────────
// Also deletes the parent post (cascade-style, since the prediction
// only exists to accompany the post).
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId =
      request.headers.get('x-user-id') ?? (await getUserIdFromRequest(request));
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const prediction = await db.prediction.findUnique({
      where: { id },
      select: { id: true, userId: true, postId: true },
    });

    if (!prediction) {
      return NextResponse.json(
        { error: 'Prediction not found.' },
        { status: 404 }
      );
    }

    if (prediction.userId !== userId) {
      return NextResponse.json(
        { error: 'You can only delete your own predictions.' },
        { status: 403 }
      );
    }

    // Delete the prediction row first, then the parent post.
    // (Post → Prediction uses onDelete: SetNull, so deleting the post
    // alone would orphan the prediction. Deleting both explicitly is safe.)
    await db.prediction.delete({ where: { id: prediction.id } }).catch(() => {
      // already gone — fine
    });

    if (prediction.postId) {
      await db.post.delete({ where: { id: prediction.postId } }).catch(() => {
        // post may already be gone — fine
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete prediction error:', error);
    return NextResponse.json({ error: 'Failed to delete prediction' }, { status: 500 });
  }
}
