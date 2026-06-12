import 'package:flutter_test/flutter_test.dart';

import 'package:ecari_mobile/main.dart';

void main() {
  testWidgets('EcariApp başlatılır', (WidgetTester tester) async {
    await tester.pumpWidget(const EcariApp());
    await tester.pump();
    expect(find.byType(EcariApp), findsOneWidget);
  });
}
