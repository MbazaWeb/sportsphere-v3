/**
 * SportSphere Database Client
 *
 * Drop-in Supabase adapter that mirrors the Prisma `db` API shape.
 * All existing route files using `db.user.findMany()` etc. work unchanged.
 *
 * Prisma → Supabase mapping:
 *   db.user.findMany(opts)         → supabase.from('user').select(cols).filter()
 *   db.user.findUnique({ where })  → supabase.from('user').select().eq(k,v).single()
 *   db.user.findFirst({ where })   → supabase.from('user').select().eq(k,v).limit(1)
 *   db.user.create({ data })       → supabase.from('user').insert(data).select().single()
 *   db.user.update({ where, data })→ supabase.from('user').update(data).eq(k,v).select()
 *   db.user.upsert({ ... })        → supabase.from('user').upsert(data)
 *   db.user.delete({ where })      → supabase.from('user').delete().eq(k,v)
 *   db.user.count({ where })       → supabase.from('user').select('*',{count:'exact'})
 */

import { supabaseAdmin } from './supabase';

type WhereClause = Record<string, any>;
type SelectClause = Record<string, boolean | object>;

function buildSelect(select?: SelectClause): string {
  if (!select) return '*';
  const cols: string[] = [];
  for (const [key, val] of Object.entries(select)) {
    if (val === true) {
      cols.push(key);
    } else if (typeof val === 'object' && val !== null && 'select' in val) {
      // Relation — Supabase uses embedded select syntax
      const subSelect = buildSelect((val as any).select);
      cols.push(`${key}(${subSelect})`);
    }
  }
  return cols.length ? cols.join(',') : '*';
}

function applyWhere(query: any, where?: WhereClause): any {
  if (!where) return query;
  for (const [key, val] of Object.entries(where)) {
    if (val === null) {
      query = query.is(key, null);
    } else if (typeof val === 'object' && val !== null) {
      // Prisma operators: { in, notIn, contains, gt, lt, gte, lte, not }
      if ('in' in val) query = query.in(key, val.in);
      else if ('notIn' in val) query = query.not(key, 'in', `(${val.notIn.join(',')})`);
      else if ('contains' in val) query = query.ilike(key, `%${val.contains}%`);
      else if ('startsWith' in val) query = query.ilike(key, `${val.startsWith}%`);
      else if ('gt' in val) query = query.gt(key, val.gt);
      else if ('gte' in val) query = query.gte(key, val.gte);
      else if ('lt' in val) query = query.lt(key, val.lt);
      else if ('lte' in val) query = query.lte(key, val.lte);
      else if ('not' in val) query = query.neq(key, val.not);
      else query = query.eq(key, val);
    } else {
      query = query.eq(key, val);
    }
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
            q = q.order(col, { ascending: dir === 'asc' });
          }
        }
      }
      if (skip) q = q.range(skip, skip + (take ?? 100) - 1);
      else if (take) q = q.limit(take);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data ?? [];
    },

    async findUnique({ where, select, include }: any) {
      let q = supabaseAdmin.from(table).select(buildSelect(select || include));
      q = applyWhere(q, where);
      const { data, error } = await q.maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },

    async findFirst({ where, select, include, orderBy }: any = {}) {
      let q = supabaseAdmin.from(table).select(buildSelect(select || include));
      q = applyWhere(q, where);
      if (orderBy) {
        const entries = Array.isArray(orderBy) ? orderBy : [orderBy];
        for (const o of entries) {
          for (const [col, dir] of Object.entries(o)) {
            q = q.order(col, { ascending: dir === 'asc' });
          }
        }
      }
      q = q.limit(1);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data?.[0] ?? null;
    },

    async create({ data, select }: any) {
      const { data: result, error } = await supabaseAdmin
        .from(table)
        .insert(data)
        .select(buildSelect(select))
        .single();
      if (error) throw new Error(error.message);
      return result;
    },

    async createMany({ data, skipDuplicates }: any) {
      const { error } = await supabaseAdmin
        .from(table)
        .insert(data, { ignoreDuplicates: skipDuplicates });
      if (error) throw new Error(error.message);
      return { count: Array.isArray(data) ? data.length : 1 };
    },

    async update({ where, data, select }: any) {
      let q = supabaseAdmin.from(table).update(data).select(buildSelect(select));
      q = applyWhere(q, where);
      const { data: result, error } = await q;
      if (error) throw new Error(error.message);
      return result?.[0] ?? result;
    },

    async updateMany({ where, data }: any) {
      let q = supabaseAdmin.from(table).update(data);
      q = applyWhere(q, where);
      const { error, count } = await q;
      if (error) throw new Error(error.message);
      return { count: count ?? 0 };
    },

    async upsert({ where, create, update, select }: any) {
      const upsertData = { ...create, ...update };
      const { data: result, error } = await supabaseAdmin
        .from(table)
        .upsert(upsertData)
        .select(buildSelect(select))
        .single();
      if (error) throw new Error(error.message);
      return result;
    },

    async delete({ where }: any) {
      let q = supabaseAdmin.from(table).delete();
      q = applyWhere(q, where);
      const { error } = await q;
      if (error) throw new Error(error.message);
      return {};
    },

    async deleteMany({ where }: any = {}) {
      let q = supabaseAdmin.from(table).delete();
      q = applyWhere(q, where);
      const { error, count } = await q;
      if (error) throw new Error(error.message);
      return { count: count ?? 0 };
    },

    async count({ where, select: _select }: any = {}) {
      let q = supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
      q = applyWhere(q, where);
      const { count, error } = await q;
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
  };
}

// ─── db object — mirrors Prisma Client ───────────────────────────────────────
// Add a model for every table in schema.sql
export const db = {
  // Core social
  user:                    makeModel('user'),
  follow:                  makeModel('follow'),
  post:                    makeModel('post'),
  postLike:                makeModel('post_like'),
  comment:                 makeModel('comment'),
  commentLike:             makeModel('comment_like'),
  poll:                    makeModel('poll'),
  pollVote:                makeModel('poll_vote'),
  prediction:              makeModel('prediction'),
  notification:            makeModel('notification'),
  message:                 makeModel('message'),
  userFavorite:            makeModel('user_favorite'),
  pushToken:               makeModel('push_token'),

  // Communities
  community:               makeModel('community'),
  communityMember:         makeModel('community_member'),

  // Sports data
  match:                   makeModel('match'),
  team:                    makeModel('team'),
  league:                  makeModel('league'),
  player:                  makeModel('player'),
  newsItem:                makeModel('news_item'),
  location:                makeModel('location'),

  // Roles & sports
  role:                    makeModel('role'),
  roleType:                makeModel('role_type'),
  sport:                   makeModel('sport'),
  userSport:               makeModel('user_sport'),

  // Profiles
  playerProfile:           makeModel('player_profile'),
  coachProfile:            makeModel('coach_profile'),
  teamProfile:             makeModel('team_profile'),
  organizationProfile:     makeModel('organization_profile'),
  journalistProfile:       makeModel('journalist_profile'),
  creatorProfile:          makeModel('creator_profile'),
  analystProfile:          makeModel('analyst_profile'),
  scoutProfile:            makeModel('scout_profile'),
  businessProfile:         makeModel('business_profile'),
  communityProfile:        makeModel('community_profile'),

  // Performance
  leaderboardEntry:        makeModel('leaderboard_entry'),
  performanceProfile:      makeModel('performance_profile'),
  performanceEvent:        makeModel('performance_event'),
  verificationRequest:     makeModel('verification_request'),

  // Business
  business:                makeModel('business'),
  commercialPartner:       makeModel('commercial_partner'),

  // Raw Supabase access for advanced queries
  $queryRaw: async (query: string, ...args: any[]) => {
    const { data, error } = await supabaseAdmin.rpc('execute_sql', { query });
    if (error) throw new Error(error.message);
    return data;
  },

  $transaction: async (fns: any[]) => {
    // Supabase doesn't support client-side transactions like Prisma
    // Run sequentially — for atomic operations use Supabase RPC/functions
    const results = [];
    for (const fn of fns) {
      results.push(await (typeof fn === 'function' ? fn() : fn));
    }
    return results;
  },
};

export default db;
