import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_editor_plus/image_editor_plus.dart';
import '../../../theme/app_colors.dart';

class PhotoEditorSheet extends StatelessWidget {
  const PhotoEditorSheet({super.key, required this.imageBytes, required this.onSave});
  final Uint8List imageBytes;
  final ValueChanged<Uint8List> onSave;

  static Future<Uint8List?> open(BuildContext context, Uint8List bytes) async {
    final edited = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ImageEditor(
          image: bytes,
        ),
      ),
    );

    if (edited != null && edited is Uint8List) {
      return edited;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    // This widget class is now just a placeholder for the static open() call
    // as image_editor_plus provides its own full-screen UI.
    return const SizedBox.shrink();
  }
}
