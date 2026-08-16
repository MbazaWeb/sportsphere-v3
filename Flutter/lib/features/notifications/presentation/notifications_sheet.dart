import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../theme/app_colors.dart';

class NotificationsSheet extends ConsumerStatefulWidget {
  const NotificationsSheet({super.key, this.onNeedLogin});
  final VoidCallback? onNeedLogin;

  @override
  ConsumerState<NotificationsSheet> createState() => _NotificationsSheetState();
}

class _NotificationsSheetState extends ConsumerState<NotificationsSheet> {
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final auth = ref.read(authProvider);
    if (!auth.isAuthenticated) {
      setState(() {
        _loading = false;
        _error = 'Sign in to see notifications';
      });
      return;
    }
    try {
      final list = await ref.read(socialApiProvider).getNotifications();
      if (!mounted) return;
      setState(() {
        _items = list;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString().replaceFirst(RegExp(r'^ApiException\(\d+\):\s*'), '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.sizeOf(context).height * 0.7,
      decoration: const BoxDecoration(
        color: AppColors.backgroundSecondary,
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 10),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(4))),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Text('Notifications', style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18)),
                const Spacer(),
                IconButton(onPressed: _load, icon: const Icon(Icons.refresh, size: 20)),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
                : _error != null
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(_error!, textAlign: TextAlign.center, style: GoogleFonts.inter(color: AppColors.mutedForeground)),
                            if (_error!.contains('Sign in')) ...[
                              const SizedBox(height: 12),
                              ElevatedButton(
                                onPressed: () {
                                  Navigator.pop(context);
                                  widget.onNeedLogin?.call();
                                },
                                child: const Text('Sign in'),
                              ),
                            ],
                          ],
                        ),
                      )
                    : _items.isEmpty
                        ? Center(child: Text('You\'re all caught up', style: GoogleFonts.inter(color: AppColors.mutedForeground)))
                        : ListView.separated(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _items.length,
                            separatorBuilder: (_, __) => const Divider(color: AppColors.border),
                            itemBuilder: (context, i) {
                              final n = _items[i];
                              final title = n['title']?.toString() ?? n['type']?.toString() ?? 'Update';
                              final body = n['body']?.toString() ?? '';
                              final read = n['isRead'] == true;
                              return ListTile(
                                contentPadding: EdgeInsets.zero,
                                leading: Icon(
                                  Icons.notifications_outlined,
                                  color: read ? AppColors.mutedForeground : AppColors.primary,
                                ),
                                title: Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14)),
                                subtitle: body.isEmpty ? null : Text(body, style: GoogleFonts.inter(fontSize: 13, color: AppColors.mutedForeground)),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}
