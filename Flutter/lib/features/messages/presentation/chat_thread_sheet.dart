import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../theme/app_colors.dart';

/// 1:1 chat thread — POST /api/messages (API has no thread GET; local + send).
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
  _ChatBubble({required this.text, required this.mine, required this.at});
  final String text;
  final bool mine;
  final DateTime at;
}

class _ChatThreadSheetState extends ConsumerState<ChatThreadSheet> {
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  final List<_ChatBubble> _bubbles = [];
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    if (widget.seedMessage != null && widget.seedMessage!.trim().isNotEmpty) {
      _bubbles.add(_ChatBubble(
        text: widget.seedMessage!,
        mine: false,
        at: DateTime.now(),
      ));
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() {
      _sending = true;
      _bubbles.add(_ChatBubble(text: text, mine: true, at: DateTime.now()));
      _ctrl.clear();
    });
    _scrollToEnd();
    try {
      await ref.read(messagesApiProvider).send(
            recipientId: widget.partnerId,
            content: text,
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

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent + 80,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.viewInsetsOf(context).bottom;
    final handle = widget.partnerHandle ?? '';

    return Padding(
      padding: EdgeInsets.only(bottom: bottom),
      child: Container(
        height: MediaQuery.sizeOf(context).height * 0.85,
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
              child: ListView.builder(
                controller: _scroll,
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                itemCount: _bubbles.length,
                itemBuilder: (context, i) {
                  final b = _bubbles[i];
                  return Align(
                    alignment: b.mine ? Alignment.centerRight : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.75),
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
                      child: Text(
                        b.text,
                        style: GoogleFonts.inter(
                          fontSize: 14.5,
                          height: 1.35,
                          color: b.mine ? AppColors.primaryForeground : AppColors.foreground,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 16),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _ctrl,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _send(),
                      decoration: InputDecoration(
                        hintText: 'Message…',
                        isDense: true,
                        filled: true,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(22)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: _sending ? null : _send,
                    icon: Icon(Icons.send_rounded, color: _sending ? AppColors.mutedForeground : AppColors.primary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
