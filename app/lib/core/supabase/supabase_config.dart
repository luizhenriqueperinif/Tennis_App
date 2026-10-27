import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

/// Dados de conexão com o Supabase. Não ficam no código: vêm do arquivo
/// `config.json` (fora do Git), passado com `--dart-define-from-file`.
/// Modelo do arquivo: `config.example.json`.
class SupabaseConfig {
  static const url = String.fromEnvironment('SUPABASE_URL');
  static const chave = String.fromEnvironment('SUPABASE_PUBLISHABLE_KEY');

  static bool get configurado => url.isNotEmpty && chave.isNotEmpty;
}

Future<void> iniciarSupabase() async {
  await Supabase.initialize(
    url: SupabaseConfig.url,
    publishableKey: SupabaseConfig.chave,
  );
}

/// Confere se o Supabase responde com a chave configurada.
Future<bool> supabaseResponde() async {
  try {
    final resposta = await http
        .get(
          Uri.parse('${SupabaseConfig.url}/auth/v1/health'),
          headers: {'apikey': SupabaseConfig.chave},
        )
        .timeout(const Duration(seconds: 10));
    return resposta.statusCode == 200;
  } catch (_) {
    return false;
  }
}
