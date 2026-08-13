/**
 * Lightweight Prometheus-style metrics for SportSphere Admin.
 * Scrape: GET /api/metrics (text/plain; version=0.0.4)
 */

type Labels = Record<string, string>;

function labelsKey(labels: Labels): string {
  const keys = Object.keys(labels).sort();
  return keys.map((k) => `${k}=${labels[k]}`).join(",");
}

function escapeLabel(v: string): string {
  return String(v).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"');
}

function formatLabels(labels: Labels): string {
  const entries = Object.entries(labels);
  if (!entries.length) return "";
  return `{${entries.map(([k, v]) => `${k}="${escapeLabel(v)}"`).join(",")}}`;
}

class Counter {
  private values = new Map<string, { labels: Labels; value: number }>();
  constructor(public name: string, public help: string) {}
  inc(labels: Labels = {}, by = 1) {
    const key = labelsKey(labels);
    const cur = this.values.get(key);
    if (cur) cur.value += by;
    else this.values.set(key, { labels, value: by });
  }
  render(): string {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} counter`];
    for (const { labels, value } of this.values.values()) {
      lines.push(`${this.name}${formatLabels(labels)} ${value}`);
    }
    if (this.values.size === 0) lines.push(`${this.name} 0`);
    return lines.join("\n");
  }
}

class Gauge {
  private values = new Map<string, { labels: Labels; value: number }>();
  constructor(public name: string, public help: string) {}
  set(labels: Labels, value: number) {
    this.values.set(labelsKey(labels), { labels, value });
  }
  inc(labels: Labels = {}, by = 1) {
    const key = labelsKey(labels);
    const cur = this.values.get(key);
    if (cur) cur.value += by;
    else this.values.set(key, { labels, value: by });
  }
  dec(labels: Labels = {}, by = 1) {
    this.inc(labels, -by);
  }
  render(): string {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} gauge`];
    for (const { labels, value } of this.values.values()) {
      lines.push(`${this.name}${formatLabels(labels)} ${value}`);
    }
    if (this.values.size === 0) lines.push(`${this.name} 0`);
    return lines.join("\n");
  }
}

const SYNC_BUCKETS = [0.5, 1, 2, 5, 10, 20, 30, 60, 90, 120, 180];

class Histogram {
  private series = new Map<
    string,
    { labels: Labels; buckets: number[]; sum: number; count: number }
  >();
  constructor(
    public name: string,
    public help: string,
    public buckets: number[] = SYNC_BUCKETS
  ) {}
  observe(labels: Labels, seconds: number) {
    const key = labelsKey(labels);
    let s = this.series.get(key);
    if (!s) {
      s = { labels, buckets: this.buckets.map(() => 0), sum: 0, count: 0 };
      this.series.set(key, s);
    }
    s.sum += seconds;
    s.count += 1;
    for (let i = 0; i < this.buckets.length; i++) {
      if (seconds <= this.buckets[i]) s.buckets[i] += 1;
    }
  }
  render(): string {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} histogram`];
    if (this.series.size === 0) {
      for (const le of this.buckets) lines.push(`${this.name}_bucket{le="${le}"} 0`);
      lines.push(`${this.name}_bucket{le="+Inf"} 0`);
      lines.push(`${this.name}_sum 0`);
      lines.push(`${this.name}_count 0`);
      return lines.join("\n");
    }
    for (const { labels, buckets, sum, count } of this.series.values()) {
      for (let i = 0; i < this.buckets.length; i++) {
        const lab = { ...labels, le: String(this.buckets[i]) };
        lines.push(`${this.name}_bucket${formatLabels(lab)} ${buckets[i]}`);
      }
      lines.push(`${this.name}_bucket${formatLabels({ ...labels, le: "+Inf" })} ${count}`);
      lines.push(`${this.name}_sum${formatLabels(labels)} ${sum}`);
      lines.push(`${this.name}_count${formatLabels(labels)} ${count}`);
    }
    return lines.join("\n");
  }
}

export const syncDuration = new Histogram(
  "sportsphere_sync_duration_seconds",
  "Sports data sync duration in seconds"
);

export const syncTotal = new Counter(
  "sportsphere_sync_runs_total",
  "Total sports sync runs by outcome status"
);

export const syncErrors = new Counter(
  "sportsphere_sync_errors_total",
  "Errors recorded during sports sync by provider and sport"
);

export const syncLastDuration = new Gauge(
  "sportsphere_sync_last_duration_seconds",
  "Duration of the most recent sports sync run"
);

export const syncInProgress = new Gauge(
  "sportsphere_sync_in_progress",
  "1 if a sports sync is currently running"
);

export const syncEntitiesWritten = new Counter(
  "sportsphere_sync_entities_written_total",
  "Entities created or updated during sports sync"
);

export function observeProviderSync(opts: {
  provider: string;
  sport: string;
  durationSeconds: number;
  errorCount: number;
  status: "success" | "partial" | "failed" | "skipped";
  writes: number;
}) {
  const labels = {
    provider: opts.provider,
    sport: opts.sport,
    status: opts.status,
  };
  syncDuration.observe(labels, opts.durationSeconds);
  syncTotal.inc({ scope: "provider_sport", status: opts.status });
  if (opts.errorCount > 0) {
    syncErrors.inc(
      { provider: opts.provider, sport: opts.sport },
      opts.errorCount
    );
  }
  if (opts.writes > 0) {
    syncEntitiesWritten.inc(
      { provider: opts.provider, sport: opts.sport },
      opts.writes
    );
  }
}

export function observeOverallSync(opts: {
  durationSeconds: number;
  status: string;
}) {
  syncDuration.observe(
    { provider: "all", sport: "all", status: opts.status },
    opts.durationSeconds
  );
  syncTotal.inc({ scope: "overall", status: opts.status });
  syncLastDuration.set({}, opts.durationSeconds);
}

export function renderPrometheusMetrics(): string {
  return [
    syncDuration.render(),
    syncTotal.render(),
    syncErrors.render(),
    syncLastDuration.render(),
    syncInProgress.render(),
    syncEntitiesWritten.render(),
    "# EOF",
  ].join("\n\n") + "\n";
}
