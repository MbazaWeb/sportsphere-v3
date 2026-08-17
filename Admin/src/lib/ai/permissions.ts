/**
 * SportSphere AI Workforce — Permission System
 *
 * PermissionChecker evaluates dot-notation permission strings
 * with wildcard support (e.g. `sports.*` grants all sports.* perms).
 */

export class PermissionChecker {
  private agentPermissions: string[];
  private permissionSet: Set<string>;
  private wildcardPatterns: { prefix: string; depth: number }[];

  constructor(agentPermissions: string[]) {
    this.agentPermissions = agentPermissions;
    this.permissionSet = new Set(agentPermissions);
    this.wildcardPatterns = [];

    for (const perm of agentPermissions) {
      if (perm.includes('*')) {
        const parts = perm.split('.');
        // e.g. `sports.*` → prefix="sports.", depth=2
        this.wildcardPatterns.push({
          prefix: parts.slice(0, -1).join('.') + '.',
          depth: parts.length,
        });
      }
    }
  }

  /**
   * Check if a specific permission is granted.
   *
   * Matching rules:
   * 1. Exact match: `sports.player.read` === `sports.player.read`
   * 2. Wildcard: `sports.*` matches `sports.player.read`, `sports.team.read`, etc.
   * 3. Deep wildcard: `*` matches everything
   * 4. Super-wildcard: `sports.**` or `**` matches anything at any depth (not in schema but supported)
   */
  checkPermission(requiredPermission: string): boolean {
    // 1. Exact match
    if (this.permissionSet.has(requiredPermission)) return true;

    // 2. Universal wildcard `*`
    if (this.permissionSet.has('*')) return true;

    const reqParts = requiredPermission.split('.');
    const reqDepth = reqParts.length;

    // 3. Check wildcard patterns
    for (const wp of this.wildcardPatterns) {
      // Depth must match (e.g. `sports.*` only matches 2-segment permissions)
      if (wp.depth !== reqDepth) continue;

      // Build the prefix to check against
      const reqPrefix = reqParts.slice(0, -1).join('.') + '.';
      if (reqPrefix === wp.prefix) return true;
    }

    // 4. Super-wildcard check: `dept.**` matches any depth >= prefix depth
    for (const perm of this.agentPermissions) {
      if (!perm.endsWith('.**')) continue;
      const base = perm.slice(0, -3); // remove `**`
      if (requiredPermission === base || requiredPermission.startsWith(base + '.')) return true;
    }

    // 5. Single `*` at any segment position
    for (const perm of this.agentPermissions) {
      if (!perm.includes('*')) continue;
      const permParts = perm.split('.');
      if (permParts.length !== reqDepth) continue;

      let matches = true;
      for (let i = 0; i < reqDepth; i++) {
        if (permParts[i] !== '*' && permParts[i] !== reqParts[i]) {
          matches = false;
          break;
        }
      }
      if (matches) return true;
    }

    return false;
  }

  /**
   * Check if ALL required permissions are granted.
   */
  checkAll(requiredPermissions: string[]): boolean {
    return requiredPermissions.every(p => this.checkPermission(p));
  }

  /**
   * Check if ANY of the required permissions are granted.
   */
  checkAny(requiredPermissions: string[]): boolean {
    return requiredPermissions.some(p => this.checkPermission(p));
  }

  /**
   * Return the list of permissions the agent has.
   */
  getPermissions(): string[] {
    return [...this.agentPermissions];
  }

  /**
   * Filter a list of required permissions to only those that are granted.
   */
  filterGranted(requiredPermissions: string[]): string[] {
    return requiredPermissions.filter(p => this.checkPermission(p));
  }

  /**
   * Filter a list of required permissions to only those that are DENIED.
   */
  filterDenied(requiredPermissions: string[]): string[] {
    return requiredPermissions.filter(p => !this.checkPermission(p));
  }
}
