import 'dart:typed_data';
<<<<<<< HEAD
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
=======
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/app_colors.dart';

class PhotoEditorSheet extends StatefulWidget {
  const PhotoEditorSheet({super.key, required this.imageBytes, required this.onSave, this.onCancel});
  final Uint8List imageBytes;
  final ValueChanged<Uint8List> onSave;
  final VoidCallback? onCancel;

  static Future<Uint8List?> open(BuildContext context, Uint8List bytes) async {
    Uint8List? result;
    await showModalBottomSheet(
      context: context, isScrollControlled: true, backgroundColor: Colors.transparent,
      builder: (_) => PhotoEditorSheet(imageBytes: bytes,
        onSave: (b) { result = b; Navigator.pop(context); },
        onCancel: () => Navigator.pop(context)),
    );
    return result;
  }

  @override
  State<PhotoEditorSheet> createState() => _PhotoEditorSheetState();
}

class _PhotoEditorSheetState extends State<PhotoEditorSheet> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  final _key = GlobalKey();
  double _brightness = 1.0, _contrast = 1.0, _saturation = 1.0;
  String _filter = 'none', _cropRatio = 'free';

  static const _filters = {
    'none':   {'label': 'Original', 'grey': false, 's': 1.0, 'b': 1.0, 'c': 1.0},
    'vivid':  {'label': 'Vivid',    'grey': false, 's': 1.8, 'b': 1.05,'c': 1.1},
    'muted':  {'label': 'Muted',    'grey': false, 's': 0.6, 'b': 1.05,'c': 1.0},
    'warm':   {'label': 'Warm',     'grey': false, 's': 1.4, 'b': 1.1, 'c': 1.0},
    'cool':   {'label': 'Cool',     'grey': false, 's': 1.2, 'b': 1.0, 'c': 1.0},
    'noir':   {'label': 'Noir',     'grey': true,  's': 0.0, 'b': 1.0, 'c': 1.3},
    'fade':   {'label': 'Fade',     'grey': false, 's': 0.8, 'b': 1.1, 'c': 0.85},
    'golden': {'label': 'Golden',   'grey': false, 's': 1.6, 'b': 1.1, 'c': 1.0},
  };

  @override
  void initState() { super.initState(); _tabs = TabController(length: 3, vsync: this); }
  @override
  void dispose() { _tabs.dispose(); super.dispose(); }

  ColorFilter _cf() {
    final f = _filters[_filter]!;
    if (f['grey'] == true) return const ColorFilter.matrix([0.33,0.59,0.11,0,0, 0.33,0.59,0.11,0,0, 0.33,0.59,0.11,0,0, 0,0,0,1,0]);
    final s = (f['s'] as double) * _saturation;
    final b = (f['b'] as double) * _brightness;
    final c = (f['c'] as double) * _contrast;
    return ColorFilter.matrix([c*b,0,0,0,0, 0,c*s*b,0,0,0, 0,0,c*b,0,0, 0,0,0,1,0]);
  }

  Future<void> _save() async {
    try {
      final rb = _key.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (rb == null) { widget.onSave(widget.imageBytes); return; }
      final img = await rb.toImage(pixelRatio: 2);
      final bd = await img.toByteData(format: ui.ImageByteFormat.png);
      widget.onSave(bd?.buffer.asUint8List() ?? widget.imageBytes);
    } catch (_) { widget.onSave(widget.imageBytes); }
  }

  double _ar() { switch (_cropRatio) { case '1:1': return 1; case '4:3': return 4/3; case '16:9': return 16/9; default: return 4/3; } }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.92,
      decoration: BoxDecoration(color: const Color(0xFF080F1A), borderRadius: const BorderRadius.vertical(top: Radius.circular(24)), border: Border.all(color: Colors.white12)),
      child: Column(children: [
        Padding(padding: const EdgeInsets.fromLTRB(16,12,16,0), child: Column(children: [
          Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(4)))),
          const SizedBox(height: 12),
          Row(children: [
            GestureDetector(onTap: widget.onCancel, child: Text('Cancel', style: GoogleFonts.inter(fontSize: 14, color: AppColors.mutedForeground))),
            const Spacer(),
            Text('Edit Photo', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w800)),
            const Spacer(),
            GestureDetector(onTap: _save, child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
              decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(20)),
              child: Text('Save', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w800, color: Colors.black)),
            )),
          ]),
        ])),
        const SizedBox(height: 12),
        Expanded(flex: 3, child: Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child:
          ClipRRect(borderRadius: BorderRadius.circular(16), child: RepaintBoundary(key: _key,
            child: AspectRatio(aspectRatio: _ar(), child: ColorFiltered(colorFilter: _cf(),
              child: Image.memory(widget.imageBytes, fit: BoxFit.cover))))))),
        const SizedBox(height: 12),
        Container(margin: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white.withValues(alpha: 0.06))),
          child: TabBar(controller: _tabs,
            indicator: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(10)),
            indicatorSize: TabBarIndicatorSize.tab, dividerColor: Colors.transparent,
            labelColor: AppColors.primaryForeground, unselectedLabelColor: AppColors.mutedForeground,
            labelStyle: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700),
            tabs: const [Tab(text: 'Filters'), Tab(text: 'Adjust'), Tab(text: 'Crop')])),
        const SizedBox(height: 8),
        Expanded(flex: 2, child: TabBarView(controller: _tabs, children: [
          // Filters
          ListView.builder(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _filters.length, itemBuilder: (_, i) {
              final key = _filters.keys.elementAt(i);
              final label = (_filters[key]!['label'] as String);
              final sel = key == _filter;
              return GestureDetector(onTap: () => setState(() => _filter = key), child: Padding(padding: const EdgeInsets.only(right: 12), child: Column(mainAxisSize: MainAxisSize.min, children: [
                AnimatedContainer(duration: const Duration(milliseconds: 160), width: 64, height: 64,
                  decoration: BoxDecoration(borderRadius: BorderRadius.circular(12), border: Border.all(color: sel ? AppColors.primary : Colors.white.withValues(alpha: 0.1), width: sel ? 2 : 1)),
                  child: ClipRRect(borderRadius: BorderRadius.circular(10), child: ColorFiltered(
                    colorFilter: _cf(), child: Image.memory(widget.imageBytes, fit: BoxFit.cover)))),
                const SizedBox(height: 4),
                Text(label, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: sel ? AppColors.primary : AppColors.mutedForeground)),
              ])));
            }),
          // Adjust
          ListView(padding: const EdgeInsets.symmetric(horizontal: 16), children: [
            _sl('Brightness', Icons.brightness_6_outlined, _brightness, (v) => setState(() => _brightness = v)),
            _sl('Contrast', Icons.contrast_outlined, _contrast, (v) => setState(() => _contrast = v)),
            _sl('Saturation', Icons.palette_outlined, _saturation, (v) => setState(() => _saturation = v)),
          ]),
          // Crop
          Row(mainAxisAlignment: MainAxisAlignment.center, children: ['free','1:1','4:3','16:9'].map((r) {
            final sel = r == _cropRatio;
            return GestureDetector(onTap: () => setState(() => _cropRatio = r), child: AnimatedContainer(
              duration: const Duration(milliseconds: 160),
              margin: const EdgeInsets.symmetric(horizontal: 8),
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
              decoration: BoxDecoration(color: sel ? AppColors.primary : AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: sel ? AppColors.primary : Colors.white.withValues(alpha: 0.1))),
              child: Text(r, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: sel ? AppColors.primaryForeground : AppColors.mutedForeground))));
          }).toList()),
        ])),
        const SizedBox(height: 16),
      ]),
    );
  }

  Widget _sl(String label, IconData icon, double value, ValueChanged<double> onChanged) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Row(children: [
      Icon(icon, size: 16, color: AppColors.mutedForeground), const SizedBox(width: 8),
      SizedBox(width: 80, child: Text(label, style: GoogleFonts.inter(fontSize: 12, color: AppColors.mutedForeground))),
      Expanded(child: SliderTheme(data: SliderThemeData(activeTrackColor: AppColors.primary, inactiveTrackColor: Colors.white.withValues(alpha: 0.1), thumbColor: AppColors.primary, trackHeight: 3, thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8)),
        child: Slider(value: value.clamp(0.5, 2.0), min: 0.5, max: 2.0, onChanged: onChanged))),
      SizedBox(width: 36, child: Text('${((value-1)*100).round()}', textAlign: TextAlign.right, style: GoogleFonts.inter(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w700))),
    ]),
  );
>>>>>>> cba2ec76e37806f1068d50f04ca754de752921ec
}
