import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/providers/app_providers.dart';
import '../../../theme/app_colors.dart';
import '../../../core/constants/api_config.dart';

/// 1:1 chat thread — loads history + sends via POST /api/messages.
/// Enhanced with timestamps, delivery status, better layout.

String _resolveUrl(String url) => ApiConfig.resolveUrl(url);

class ChatThreadSheet extends ConsumerStatefulWidget {
  const ChatThreadSheet({
    super.key,
    required this.partnerId,
    required this.partnerName,
    this.partnerHandle,
    this.seedMessage,
  });

  final String partnerId;
  final String partnerName;
  final String? partnerHandle;
  final String? seedMessage;

  @override
  ConsumerState<ChatThreadSheet> createState() => _ChatThreadSheetState();
}

class _ChatBubble {
  _ChatBubble({required this.text, required this.mine, required this.at, this.senderName = '', this.mediaUrl});
  final String text;
  final bool mine;
  final DateTime at;
  final String senderName;
  final String? mediaUrl;
}

class _ChatThreadSheetState extends ConsumerState<ChatThreadSheet> {
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  final List<_ChatBubble> _bubbles = [];
  bool _sending = false;
  bool _loadingHistory = true;
  String? _currentUserId;
  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    final auth = ref.read(authProvider);
    _currentUserId = auth.user?.id;
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    try {
      final messages = await ref.read(messagesApiProvider).getThread(widget.partnerId);
      if (!mounted) return;
      final auth = ref.read(authProvider);
      _currentUserId = auth.user?.id;
      setState(() {
        _bubbles.clear();
        for (final m in messages) {
          final senderId = m['senderId']?.toString() ?? '';
          final isMine = m['mine'] == true || senderId == _currentUserId;
          final text = m['content']?.toString() ?? '';
          final mediaUrl = m['mediaUrl']?.toString();
          final senderName = isMine
              ? (auth.user?.name ?? 'You')
              : widget.partnerName;
          final createdAt = m['createdAt'];
          DateTime at;
          if (createdAt is DateTime) {
            at = createdAt;
          } else if (createdAt is String && createdAt.isNotEmpty) {
            try { at = DateTime.parse(createdAt).toLocal(); } catch (_) { at = DateTime.now(); }
          } else {
            at = DateTime.now();
          }
          if (text.isNotEmpty || (mediaUrl != null && mediaUrl.isNotEmpty)) {
            _bubbles.add(_ChatBubble(text: text, mine: isMine, at: at, senderName: senderName, mediaUrl: mediaUrl));
          }
        }
        _loadingHistory = false;
      });
      _scrollToEnd();
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadingHistory = false);
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _send({String? mediaUrl}) async {
    final text = _ctrl.text.trim();
    if (text.isEmpty && mediaUrl == null) return;
    if (_sending) return;

    setState(() {
      _sending = true;
      _bubbles.add(_ChatBubble(text: text, mine: true, at: DateTime.now(), senderName: 'You', mediaUrl: mediaUrl));
      _ctrl.clear();
    });
    _scrollToEnd();
    try {
      await ref.read(messagesApiProvider).send(
            recipientId: widget.partnerId,
            content: text,
            mediaUrl: mediaUrl,
          );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst(RegExp(r'^ApiException\(\d+\):\s*'), ''))),
      );
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _pickImage() async {
    try {
      final file = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
      if (file == null) return;

      setState(() => _sending = true);
      final bytes = await file.readAsBytes();
      final url = await ref.read(uploadApiProvider).uploadBytes(
        bytes: bytes,
        filename: file.name,
        contentType: 'image/jpeg',
      );

      await _send(mediaUrl: url);
    } catch (e) {
      if (mounted) {
        setState(() => _sending = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Upload failed: $e')));
      }
    }
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent + 120,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  String _formatTime(DateTime at) {
    final now = DateTime.now();
    final isToday = now.year == at.year && now.month == at.month && now.day == at.day;
    final h = at.hour > 12 ? at.hour - 12 : (at.hour == 0 ? 12 : at.hour);
    final m = at.minute.toString().padLeft(2, '0');
    final ampm = at.hour >= 12 ? 'PM' : 'AM';
    final time = '$h:$m $ampm';
    if (isToday) return time;
    return '${at.day}/${at.month} $time';
  }

  bool _showDateSeparator(int index) {
    if (index == 0) return true;
    final prev = _bubbles[index - 1].at;
    final curr = _bubbles[index].at;
    return prev.year != curr.year || prev.month != curr.month || prev.day != curr.day;
  }

  String _dateLabel(DateTime at) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final msgDay = DateTime(at.year, at.month, at.day);
    final diff = today.difference(msgDay).inDays;
    if (diff == 0) return 'Today';
    if (diff == 1) return 'Yesterday';
    return '${at.day}/${at.month}/${at.year}';
  }

  Future<void> _sendMedia() async {
    try {
      final picked = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
      if (picked == null || !mounted) return;
      setState(() => _sending = true);
      final bytes = await picked.readAsBytes();
      final api = ref.read(apiClientProvider);
      // Upload then send as message with mediaUrl
      final uploadRes = await api.postMultipart('/uploads',
        bytes: bytes, filename: picked.name, field: 'file');
      final mediaUrl = uploadRes['url']?.toString() ?? '';
      if (mediaUrl.isEmpty) return;
      final myId = _currentUserId ?? '';
      await api.postJson('/messages', body: {
        'receiverId': widget.partnerId,
        'content': '',
        'mediaUrl': mediaUrl,
      });
      if (!mounted) return;
      setState(() {
        _bubbles.add(_ChatBubble(text: '', mine: true, at: DateTime.now(), mediaUrl: mediaUrl));
        _sending = false;
      });
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scroll.hasClients) _scroll.animateTo(_scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
      });
    } catch (e) {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.viewInsetsOf(context).bottom;
    final handle = widget.partnerHandle ?? '';
    final auth = ref.watch(authProvider);
    final avatarUrl = auth.user?.avatarUrl;
    final myName = auth.user?.name ?? '';
    final myInitial = myName.isNotEmpty ? myName[0].toUpperCase() : '?';

    return Padding(
      padding: EdgeInsets.only(bottom: bottom),
      child: Container(
        height: MediaQuery.sizeOf(context).height * 0.88,
        decoration: const BoxDecoration(
          color: AppColors.backgroundSecondary,
          borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 10),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(4))),
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
              child: Row(
                children: [
                  IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.chevron_left_rounded)),
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: AppColors.surfaceElevated,
                    child: Text(
                      widget.partnerName.isNotEmpty ? widget.partnerName[0].toUpperCase() : '?',
                      style: GoogleFonts.inter(fontWeight: FontWeight.w700),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(widget.partnerName, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 15)),
                        if (handle.isNotEmpty)
                          Text(
                            handle.startsWith('@') ? handle : '@$handle',
                            style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppColors.border),
            Expanded(
              child: _loadingHistory
                  ? const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
                  : _bubbles.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.chat_bubble_outline_rounded, size: 48, color: AppColors.mutedForeground.withValues(alpha: 0.3)),
                              const SizedBox(height: 12),
                              Text('No messages yet. Say hi!', style: GoogleFonts.inter(color: AppColors.mutedForeground)),
                            ],
                          ),
                        )
                      : ListView.builder(
                          controller: _scroll,
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                          itemCount: _bubbles.length * 2, // items + potential separators
                          itemBuilder: (context, rawIndex) {
                            final i = rawIndex ~/ 2;
                            if (i >= _bubbles.length) return const SizedBox.shrink();
                            final isSeparator = rawIndex.isOdd;
                            if (isSeparator) return const SizedBox(height: 4);

                            // Date separator
                            if (_showDateSeparator(i)) {
                              return Column(
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                    child: Center(
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: AppColors.surface,
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Text(
                                          _dateLabel(_bubbles[i].at),
                                          style: GoogleFonts.inter(fontSize: 11, color: AppColors.mutedForeground, fontWeight: FontWeight.w600),
                                        ),
                                      ),
                                    ),
                                  ),
                                  _buildBubble(i),
                                ],
                              );
                            }

                            return _buildBubble(i);
                          },
                        ),
            ),
            // Message input
            Container(
              padding: const EdgeInsets.fromLTRB(8, 8, 8, 16),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  IconButton(
                    onPressed: _sending ? null : _pickImage,
                    icon: const Icon(Icons.add_photo_alternate_outlined, color: AppColors.primary),
                  ),
                  Expanded(
                    child: TextField(
                      controller: _ctrl,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _send(),
                      maxLines: 4,
                      minLines: 1,
                      decoration: InputDecoration(
                        hintText: 'Message\u2026',
                        isDense: true,
                        filled: true,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(22)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      onPressed: _sending ? null : () => _send(),
                      icon: _sending
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryForeground))
                          : const Icon(Icons.send_rounded, color: AppColors.primaryForeground, size: 18),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBubble(int i) {
    final b = _bubbles[i];
    final time = _formatTime(b.at);
    return Align(
      alignment: b.mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 6),
        constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.72),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: b.mine ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(b.mine ? 16 : 4),
            bottomRight: Radius.circular(b.mine ? 4 : 16),
          ),
        ),
        child: Column(
          crossAxisAlignment: b.mine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            if (b.mediaUrl != null && b.mediaUrl!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.network(
                    _resolveUrl(b.mediaUrl!),
                    fit: BoxFit.cover,
                    loadingBuilder: (_, child, progress) => progress == null ? child : const Center(child: CircularProgressIndicator()),
                  ),
                ),
              ),
            if (b.text.isNotEmpty)
              Text(
                b.text,
                style: GoogleFonts.inter(
                  fontSize: 14.5,
                  height: 1.35,
                  color: b.mine ? AppColors.primaryForeground : AppColors.foreground,
                ),
              ),
            const SizedBox(height: 4),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  time,
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    color: b.mine
                        ? AppColors.primaryForeground.withValues(alpha: 0.7)
                        : AppColors.mutedForeground.withValues(alpha: 0.7),
                  ),
                ),
                if (b.mine) ...[
                  const SizedBox(width: 4),
                  Icon(Icons.check, size: 12, color: AppColors.primaryForeground.withValues(alpha: 0.7)),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
