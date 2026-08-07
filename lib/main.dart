import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await [Permission.camera].request();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
  ));
  runApp(const RokApp());
}

class RokApp extends StatelessWidget {
  const RokApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Rock Hound',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(scaffoldBackgroundColor: const Color(0xFF18160f)),
      home: const RokViewer(),
    );
  }
}

class RokViewer extends StatefulWidget {
  const RokViewer({super.key});

  @override
  State<RokViewer> createState() => _RokViewerState();
}

class _RokViewerState extends State<RokViewer> {
  InAppWebViewController? _ctrl;
  String? _htmlPath;

  @override
  void initState() {
    super.initState();
    _prepare();
  }

  Future<void> _prepare() async {
    final src = await rootBundle.loadString('assets/rok.jsx');

    final cleaned = src.replaceFirst(
      'export default function RockHound',
      'function RockHound',
    );

    final html = '''<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
</head>
<body style="margin:0;background:#18160f">
<div id="root"></div>
<script type="text/babel">
$cleaned

const _root = ReactDOM.createRoot(document.getElementById('root'));
_root.render(<RockHound />);
</script>
</body>
</html>''';

    final dir = await getApplicationDocumentsDirectory();
    final file = File('${dir.path}/rok.html');
    await file.writeAsString(html);

    if (mounted) setState(() => _htmlPath = file.path);
  }

  @override
  Widget build(BuildContext context) {
    if (_htmlPath == null) {
      return const Scaffold(
        backgroundColor: Color(0xFF18160f),
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFFb87c38)),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF18160f),
      body: InAppWebView(
        initialUrlRequest: URLRequest(
          url: WebUri.uri(Uri.file(_htmlPath!)),
        ),
        initialSettings: InAppWebViewSettings(
          javaScriptEnabled: true,
          allowFileAccessFromFileURLs: true,
          allowUniversalAccessFromFileURLs: true,
          mediaPlaybackRequiresUserGesture: false,
          allowsInlineMediaPlayback: true,
          databaseEnabled: true,
          domStorageEnabled: true,
        ),
        onWebViewCreated: (ctrl) => _ctrl = ctrl,
        onPermissionRequest: (_, request) async {
          return PermissionResponse(
            resources: request.resources,
            action: PermissionResponseAction.GRANT,
          );
        },
      ),
    );
  }
}
