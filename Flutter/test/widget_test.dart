import 'package:flutter_test/flutter_test.dart';
import 'package:sportsphere/main.dart';

void main() {
  testWidgets('App starts', (WidgetTester tester) async {
    await tester.pumpWidget(const SportsphereApp());
    // Splash is shown initially
    expect(find.text('SPORTSPHERE'), findsOneWidget);
  });
}
