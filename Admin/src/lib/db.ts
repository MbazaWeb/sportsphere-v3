/**
 * SportSphere Database Client — Prisma-shaped Supabase adapter.
 *
 * Maps camelCase Prisma field names <-> snake_case ss_* tables.
 * All existing route files using db.user.findMany() keep working.
 */

import { supabaseAdmin } from './supabase';

type WhereClause = Record<string, any>;
type SelectClause = Record<string, boolean | object>;

function toSnake(key: string): string {
  if (key === 'OR' || key === 'AND' || key === 'NOT') return key;
  return key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
}

function toCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function keysToSnake(obj: any): any {
  if (obj == null || typeof obj !== 'object' || obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(keysToSnake);
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'OR' || k === 'AND' || k === 'NOT') {
      out[k] = Array.isArray(v) ? v.map(keysToSnake) : keysToSnake(v);
    } else {
      out[toSnake(k)] = keysToSnake(v);
    }
  }
  return out;
}

function keysToCamel(obj: any): any {
  if (obj == null || typeof obj !== 'object' || obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(keysToCamel);
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[toCamel(k)] = keysToCamel(v);
  }
  return out;
}

function buildSelect(select?: SelectClause): string {
  if (!select) return '*';
  const cols: string[] = [];
  for (const [key, val] of Object.entries(select)) {
    const col = toSnake(key);
    if (val === true) {
      cols.push(col);
    } else if (typeof val === 'object' && val !== null && 'select' in val) {
      const subSelect = buildSelect((val as any).select);
      cols.push(`${col}(${subSelect})`);
    }
  }
  return cols.length ? cols.join(',') : '*';
}

function scalarFilter(val: any): { op: string; value: any; insensitive: boolean } | null {
  if (val == null || typeof val !== 'object' || Array.isArray(val)) {
    return { op: 'eq', value: val, insensitive: false };
  }
  const insensitive = val.mode === 'insensitive';
  if ('equals' in val) return { op: 'eq', value: val.equals, insensitive };
  if ('contains' in val) return { op: 'contains', value: val.contains, insensitive: true };
  if ('startsWith' in val) return { op: 'startsWith', value: val.startsWith, insensitive: true };
  if ('in' in val) return { op: 'in', value: val.in, insensitive };
  if ('notIn' in val) return { op: 'notIn', value: val.notIn, insensitive };
  if ('gt' in val) return { op: 'gt', value: val.gt, insensitive };
  if ('gte' in val) return { op: 'gte', value: val.gte, insensitive };
  if ('lt' in val) return { op: 'lt', value: val.lt, insensitive };
  if ('lte' in val) return { op: 'lte', value: val.lte, insensitive };
  if ('not' in val) return { op: 'neq', value: val.not, insensitive };
  if ('mode' in val) return null;
  return { op: 'eq', value: val, insensitive };
}

function applyWhere(query: any, where?: WhereClause): any {
  if (!where) return query;
  const w = keysToSnake(where);

  if (Array.isArray(w.OR)) {
    const parts: string[] = [];
    for (const clause of w.OR) {
      for (const [key, val] of Object.entries(clause)) {
        const f = scalarFilter(val);
        if (!f) continue;
        const q = String(f.value ?? '').replace(/"/g, '');
        if (f.op === 'contains') parts.push(`${key}.ilike."%${q}%"`);
        else if (f.op === 'startsWith') parts.push(`${key}.ilike."${q}%"`);
        else if (f.op === 'in') parts.push(`${key}.in.(${(f.value || []).join(',')})`);
        else if (f.insensitive && f.op === 'eq') parts.push(`${key}.ilike."${q}"`);
        else parts.push(`${key}.eq."${q}"`);
      }
    }
    if (parts.length) query = query.or(parts.join(','));
  }

  for (const [key, val] of Object.entries(w)) {
    if (key === 'OR' || key === 'AND' || key === 'NOT') continue;
    if (val === null) {
      query = query.is(key, null);
      continue;
    }
    const f = scalarFilter(val);
    if (!f) continue;
    if (f.op === 'in') query = query.in(key, f.value);
    else if (f.op === 'notIn') query = query.not(key, 'in', `(${f.value.join(',')})`);
    else if (f.op === 'contains') query = query.ilike(key, `%${f.value}%`);
    else if (f.op === 'startsWith') query = query.ilike(key, `${f.value}%`);
    else if (f.op === 'gt') query = query.gt(key, f.value);
    else if (f.op === 'gte') query = query.gte(key, f.value);
    else if (f.op === 'lt') query = query.lt(key, f.value);
    else if (f.op === 'lte') query = query.lte(key, f.value);
    else if (f.op === 'neq') query = query.neq(key, f.value);
    else if (f.insensitive) query = query.ilike(key, f.value);
    else query = query.eq(key, f.value);
  }
  return query;
}


function makeModel(table: string) {
  return {
    async findMany({ where, select, orderBy, take, skip, include }: any = {}) {
      let q = supabaseAdmin.from(table).select(buildSelect(select || include));
      q = applyWhere(q, where);
      if (orderBy) {
        const entries = Array.isArray(orderBy) ? orderBy : [orderBy];
        for (const o of entries) {
          for (const [col, dir] of Object.entries(o)) {
            q = q.order(toSnake(col), { ascending: dir === 'asc' });
          }
        }
      }
      if (skip) q = q.range(skip, skip + (take ?? 100) - 1);
      else if (take) q = q.limit(take);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return transformResult(data ?? []);
    },

    async findUnique({ where, select, include }: any) {
      let q = supabaseAdmin.from(table).select(buildSelect(select || include));
      q = applyWhere(q, where);
      const { data, error } = await q.maybeSingle();
      if (error) throw new Error(error.message);
      return transformResult(data);
    },

    async findFirst({ where, select, include, orderBy }: any = {}) {
      let q = supabaseAdmin.from(table).select(buildSelect(select || include));
      q = applyWhere(q, where);
      if (orderBy) {
        const entries = Array.isArray(orderBy) ? orderBy : [orderBy];
        for (const o of entries) {
          for (const [col, dir] of Object.entries(o)) {
            q = q.order(toSnake(col), { ascending: dir === 'asc' });
          }
        }
      }
      q = q.limit(1);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return transformResult(data?.[0] ?? null);
    },

    async create({ data, select }: any) {
      const { data: result, error } = await supabaseAdmin
        .from(table)
        .insert(keysToSnake(data))
        .select(buildSelect(select))
        .single();
      if (error) throw new Error(error.message);
      return transformResult(result);
    },

    async createMany({ data, skipDuplicates }: any) {
      const rows = Array.isArray(data) ? data.map(keysToSnake) : [keysToSnake(data)];
      const { error } = await supabaseAdmin
        .from(table)
        .insert(rows, { ignoreDuplicates: skipDuplicates });
      if (error) throw new Error(`[${table}.createMany] ${error.message}`);
      return { count: rows.length };
    },

    async update({ where, data, select }: any) {
      let q = supabaseAdmin.from(table).update(keysToSnake(data)).select(buildSelect(select));
      q = applyWhere(q, where);
      const { data: result, error } = await q;
      if (error) throw new Error(error.message);
      return transformResult(result?.[0] ?? result);
    },

    async updateMany({ where, data }: any) {
      let q = supabaseAdmin.from(table).update(keysToSnake(data));
      q = applyWhere(q, where);
      const { error, count } = await q;
      if (error) throw new Error(`[${table}.updateMany] ${error.message}`);
      return { count: count ?? 0 };
    },

    async upsert({ where, create, update, select }: any) {
      const upsertData = keysToSnake({ ...create, ...update, ...where });
      const { data: result, error } = await supabaseAdmin
        .from(table)
        .upsert(upsertData)
        .select(buildSelect(select))
        .single();
      if (error) throw new Error(error.message);
      return transformResult(result);
    },

    async delete({ where }: any) {
      let q = supabaseAdmin.from(table).delete();
      q = applyWhere(q, where);
      const { error } = await q;
      if (error) throw new Error(`[${table}.delete] ${error.message}`);
      return {};
    },

    async deleteMany({ where }: any = {}) {
      let q = supabaseAdmin.from(table).delete();
      q = applyWhere(q, where);
      const { error, count } = await q;
      if (error) throw new Error(`[${table}.deleteMany] ${error.message}`);
      return { count: count ?? 0 };
    },

    async count({ where }: any = {}) {
      let q = supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
      q = applyWhere(q, where);
      const { count, error } = await q;
      if (error) throw new Error(`[${table}.count] ${error.message}`);
      return count ?? 0;
    },
  };
}

export const db = {
  user: makeModel('ss_user'),
  follow: makeModel('ss_follow'),
  post: makeModel('ss_post'),
  postLike: makeModel('ss_post_like'),
  comment: makeModel('ss_comment'),
  commentLike: makeModel('ss_comment_like'),
  poll: makeModel('ss_poll'),
  pollVote: makeModel('ss_poll_vote'),
  prediction: makeModel('ss_prediction'),
  notification: makeModel('ss_notification'),
  message: makeModel('ss_message'),
  userFavorite: makeModel('ss_user_favorite'),
  pushToken: makeModel('ss_push_token'),
  community: makeModel('ss_community'),
  communityMember: makeModel('ss_community_member'),
  match: makeModel('ss_match'),
  team: makeModel('ss_team'),
  league: makeModel('ss_league'),
  player: makeModel('ss_player'),
  newsItem: makeModel('ss_news_item'),
  location: makeModel('ss_location'),
  role: makeModel('ss_role'),
  roleType: makeModel('ss_role_type'),
  sport: makeModel('ss_sport'),
  userSport: makeModel('ss_user_sport'),
  playerProfile: makeModel('ss_player_profile'),
  coachProfile: makeModel('ss_coach_profile'),
  teamProfile: makeModel('ss_team_profile'),
  organizationProfile: makeModel('ss_team_profile'),
  journalistProfile: makeModel('ss_player_profile'),
  creatorProfile: makeModel('ss_player_profile'),
  analystProfile: makeModel('ss_player_profile'),
  scoutProfile: makeModel('ss_player_profile'),
  businessProfile: makeModel('ss_business'),
  communityProfile: makeModel('ss_community'),
  leaderboardEntry: makeModel('ss_leaderboard_entry'),
  performanceProfile: makeModel('ss_performance_profile'),
  performanceEvent: makeModel('ss_performance_event'),
  verificationRequest: makeModel('ss_verification_request'),
  business: makeModel('ss_business'),
  commercialPartner: makeModel('ss_commercial_partner'),
  coach: makeModel('ss_coach'),

  $queryRaw: async (strings?: TemplateStringsArray | string, ..._args: any[]) => {
    // Health check / simple connectivity — service role select
    const { error } = await supabaseAdmin.from('ss_sport').select('id').limit(1);
    if (error) throw new Error(error.message);
    return transformResult(data);
  },

  $transaction: async (fns: any[]) => {
    const results = [];
    for (const fn of fns) {
      results.push(await (typeof fn === 'function' ? fn() : fn));
    }
    return results;
  },
};

export default db;
