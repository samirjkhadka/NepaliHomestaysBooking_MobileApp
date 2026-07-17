import 'dart:convert';
import 'dart:io';

const _debugLogPath =
    '/Users/samirjkhadka/Projects/SUPER_APP/homestays/.cursor/debug-118416.log';
const _debugEndpoint =
    'http://127.0.0.1:7551/ingest/6389afa9-9439-4744-8416-971e3c77945f';

Future<void> agentDebugLog({
  required String hypothesisId,
  required String location,
  required String message,
  required Map<String, Object?> data,
}) async {
  final payload = <String, Object?>{
    'sessionId': '118416',
    'runId': 'physical-pre-fix',
    'hypothesisId': hypothesisId,
    'location': location,
    'message': message,
    'data': data,
    'timestamp': DateTime.now().millisecondsSinceEpoch,
  };
  final line = jsonEncode(payload);
  try {
    await File(_debugLogPath).writeAsString(
      '$line\n',
      mode: FileMode.append,
      flush: true,
    );
    return;
  } catch (_) {}
  try {
    final client = HttpClient()
      ..connectionTimeout = const Duration(seconds: 1);
    final request = await client.postUrl(Uri.parse(_debugEndpoint));
    request.headers.contentType = ContentType.json;
    request.headers.set('X-Debug-Session-Id', '118416');
    request.write(line);
    await request.close();
    client.close();
  } catch (_) {
    stdout.writeln(line);
  }
}
