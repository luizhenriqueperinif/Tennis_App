import 'package:flutter/material.dart';

import 'core/supabase/supabase_config.dart';

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

class TelaProvisoria extends StatefulWidget {
  const TelaProvisoria({super.key});

  @override
  State<TelaProvisoria> createState() => _TelaProvisoriaState();
}

class _TelaProvisoriaState extends State<TelaProvisoria> {
  // Só testa a conexão quando o config.json foi passado.
  late final Future<bool>? _conexao =
      SupabaseConfig.configurado ? supabaseResponde() : null;

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
            const SizedBox(height: 24),
            _statusSupabase(texto),
          ],
        ),
      ),
    );
  }

  Widget _statusSupabase(TextTheme texto) {
    final conexao = _conexao;
    if (conexao == null) {
      return Text(
        'Supabase não configurado (veja app/README.md)',
        style: texto.bodyMedium,
      );
    }
    return FutureBuilder<bool>(
      future: conexao,
      builder: (context, resultado) {
        if (!resultado.hasData) {
          return Text('Conectando ao Supabase...', style: texto.bodyMedium);
        }
        return Text(
          resultado.data! ? 'Supabase conectado' : 'Sem conexão com o Supabase',
          style: texto.bodyMedium,
        );
      },
    );
  }
}
