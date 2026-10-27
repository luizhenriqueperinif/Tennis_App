import 'package:flutter/material.dart';

/// Raiz do app. O tema definitivo vem do brandbook (KAN-50) e as rotas
/// do go_router (KAN-51); por enquanto, uma tela provisória.
class MatchPointApp extends StatelessWidget {
  const MatchPointApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MatchPoint',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1F6F43)),
      ),
      home: const TelaProvisoria(),
    );
  }
}

class TelaProvisoria extends StatelessWidget {
  const TelaProvisoria({super.key});

  @override
  Widget build(BuildContext context) {
    final texto = Theme.of(context).textTheme;
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('MatchPoint', style: texto.headlineMedium),
            const SizedBox(height: 8),
            Text('Etapa 2 em construção', style: texto.bodyLarge),
          ],
        ),
      ),
    );
  }
}
