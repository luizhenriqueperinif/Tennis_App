import 'package:flutter/material.dart';

import 'app.dart';
import 'core/supabase/supabase_config.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  if (SupabaseConfig.configurado) {
    await iniciarSupabase();
  }
  runApp(const MatchPointApp());
}
