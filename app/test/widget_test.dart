import 'package:flutter_test/flutter_test.dart';

import 'package:matchpoint/app.dart';

void main() {
  testWidgets('o app abre na tela provisória', (tester) async {
    await tester.pumpWidget(const MatchPointApp());

    expect(find.text('MatchPoint'), findsOneWidget);
    expect(find.text('Etapa 2 em construção'), findsOneWidget);
  });

  testWidgets('sem config.json, avisa que o Supabase não foi configurado',
      (tester) async {
    await tester.pumpWidget(const MatchPointApp());

    expect(
      find.text('Supabase não configurado (veja app/README.md)'),
      findsOneWidget,
    );
  });
}
