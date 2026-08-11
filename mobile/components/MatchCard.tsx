/**
 * MatchCard — live match card for the Scores tab
 * ------------------------------------------------
 * Shows: league badge, home vs away with scores, match time/minute, status indicator.
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Clock, MapPin, Zap } from 'lucide-react-native';
import { colors, radii, spacing } from '@sportsphere/design-system/tokens';
import { FONT_BODY_BOLD, FONT_BODY, FONT_BODY_REG } from '../../lib/fonts';
import type { Match } from './matches-types';

interface MatchCardProps {
  match: Match;
  onPress?: (match: Match) => void;
}

export default function MatchCard({ match, onPress }: MatchCardProps) {
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  const isUpcoming = match.status === 'upcoming';

  const kickoffTime = formatKickoff(match.kickoffAt);

  return (
    <Pressable onPress={() => onPress?.(match)} style={styles.card}>
      {/* League header */}
      <View style={styles.leagueRow}>
        <View style={[styles.dot, isLive && styles.dotLive]} />
        <Text style={styles.leagueText}>{match.league}</Text>
        {match.country ? (
          <Text style={styles.countryText}>{match.country}</Text>
        ) : null}
        <View style={{ flex: 1 }} />
        {isLive && (
          <View style={styles.livePill}>
            <Zap size={10} color={colors.destructive} />
            <Text style={styles.livePillText}>
              {match.minute ?? 0}&apos;{match.minute === 1 ? '' : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Teams + Score */}
      <View style={styles.teamsRow}>
        {/* Home */}
        <View style={styles.teamBlock}>
          {match.homeLogo ? (
            <Text style={styles.teamIcon}>{getTeamEmoji(match.homeTeam)}</Text>
          ) : null}
          <Text
            style={[styles.teamName, styles.teamNameHome]}
            numberOfLines={2}
          >
            {match.homeTeam}
          </Text>
        </View>

        {/* Score / Time */}
        <View style={styles.scoreBlock}>
          {isLive || isFinished ? (
            <View style={styles.scoreWrap}>
              <Text style={[styles.scoreNum, isLive && styles.scoreLive]}>
                {match.homeScore ?? 0}
              </Text>
              <Text style={styles.scoreSep}>:</Text>
              <Text style={[styles.scoreNum, isLive && styles.scoreLive]}>
                {match.awayScore ?? 0}
              </Text>
            </View>
          ) : (
            <View style={styles.timeWrap}>
              <Clock size={14} color={colors.mutedForeground} />
              <Text style={styles.timeText}>{kickoffTime}</Text>
            </View>
          )}
          {isFinished && <Text style={styles.ftLabel}>FT</Text>}
        </View>

        {/* Away */}
        <View style={[styles.teamBlock, styles.teamBlockAway]}>
          {match.awayLogo ? (
            <Text style={styles.teamIcon}>{getTeamEmoji(match.awayTeam)}</Text>
          ) : null}
          <Text
            style={[styles.teamName, styles.teamNameAway]}
            numberOfLines={2}
          >
            {match.awayTeam}
          </Text>
        </View>
      </View>

      {/* Venue */}
      {match.venue ? (
        <View style={styles.venueRow}>
          <MapPin size={11} color={colors.mutedForeground} />
          <Text style={styles.venueText} numberOfLines={1}>{match.venue}</Text>
        </View>
      ) : null}

      {/* Goal scorers for live/finished */}
      {isLive && match.events && match.events.length > 0 ? (
        <View style={styles.eventsRow}>
          {match.events.filter(e => e.type === 'goal').slice(0, 3).map((ev, i) => (
            <View key={i} style={styles.eventChip}>
              <Text style={styles.eventText}>
                {ev.playerName ?? ev.player ?? ''} {ev.minute ?? ''}&apos;
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function formatKickoff(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getTeamEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('arsenal')) return '🔴';
  if (n.includes('chelsea')) return '🔵';
  if (n.includes('liverpool')) return '🔴';
  if (n.includes('man city') || n.includes('manchester city')) return '🩵';
  if (n.includes('man united') || n.includes('manchester united')) return '🔴';
  if (n.includes('tottenham') || n.includes('spurs')) return '⚪';
  if (n.includes('barcelona') || n.includes('barca')) return '🔵🔴';
  if (n.includes('real madrid')) return '⚪';
  if (n.includes('atletico')) return '🔴⚪';
  if (n.includes('bayern')) return '🔴';
  if (n.includes('dortmund')) return '🟡';
  if (n.includes('psg') || n.includes('paris')) return '🔵🔴';
  if (n.includes('juventus') || n.includes('juve')) return '⚪⚫';
  if (n.includes('inter')) return '🔵⚫';
  if (n.includes('milan')) return '🔴⚫';
  if (n.includes('napoli')) return '🔵';
  return '⚽';
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radii.lg,
    padding: 14,
    gap: 10,
  },
  leagueRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.mutedForeground,
  },
  dotLive: {
    backgroundColor: colors.destructive,
  },
  leagueText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 11, fontWeight: '700',
    color: colors.mutedForeground, letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  countryText: {
    fontFamily: FONT_BODY_REG, fontSize: 10,
    color: 'rgba(255,255,255,0.30)',
  },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999,
  },
  livePillText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 10, fontWeight: '700',
    color: colors.destructive,
  },
  teamsRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 4,
  },
  teamBlock: {
    flex: 1, gap: 4,
  },
  teamBlockAway: {
    alignItems: 'flex-end',
  },
  teamIcon: {
    fontSize: 18, marginBottom: 2,
  },
  teamName: {
    fontFamily: FONT_BODY_BOLD, fontSize: 14, fontWeight: '700',
    color: colors.foreground, lineHeight: 18,
  },
  teamNameHome: { textAlign: 'left' },
  teamNameAway: { textAlign: 'right' },
  scoreBlock: {
    width: 80, alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  scoreWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: radii.md,
  },
  scoreNum: {
    fontFamily: FONT_BODY_BOLD, fontSize: 20, fontWeight: '800',
    color: colors.foreground, minWidth: 20, textAlign: 'center',
  },
  scoreLive: {
    color: colors.primary,
  },
  scoreSep: {
    fontFamily: FONT_BODY, fontSize: 16,
    color: colors.mutedForeground,
  },
  timeWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: radii.md,
  },
  timeText: {
    fontFamily: FONT_BODY_BOLD, fontSize: 13, fontWeight: '700',
    color: colors.mutedForeground,
  },
  ftLabel: {
    fontFamily: FONT_BODY_REG, fontSize: 9,
    color: colors.mutedForeground, letterSpacing: 0.5,
  },
  venueRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingTop: 2,
  },
  venueText: {
    fontFamily: FONT_BODY_REG, fontSize: 11,
    color: 'rgba(255,255,255,0.30)', flex: 1,
  },
  eventsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 4,
  },
  eventChip: {
    backgroundColor: 'rgba(245, 197, 24, 0.08)',
    borderWidth: 1, borderColor: 'rgba(245, 197, 24, 0.15)',
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  eventText: {
    fontFamily: FONT_BODY_REG, fontSize: 10,
    color: colors.primary,
  },
});
