import 'package:flutter_test/flutter_test.dart';

import 'package:matchpoint/app.dart';

void main() {
  testWidgets('o app abre na tela provisória', (tester) async {
    await tester.pumpWidget(const MatchPointApp());

    expect(find.text('MatchPoint'), findsOneWidget);
    expect(find.text('Etapa 2 em construção'), findsOneWidget);
  });
}
