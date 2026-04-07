import 'package:flutter/material.dart';
import '../app_state.dart';
import '../widgets/setting_header.dart';
import 'login_screen.dart';

class SettingsScreen extends StatefulWidget {
  final VoidCallback? onBackHome;

  const SettingsScreen({super.key, this.onBackHome});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  VoidCallback? _listener;

  @override
  void initState() {
    super.initState();

    _listener = () {
      if (mounted) {
        setState(() {});
      }
    };

    appState.addListener(_listener!);
  }

  @override
  void dispose() {
    if (_listener != null) {
      appState.removeListener(_listener!);
    }
    super.dispose();
  }

  String _getFontSizeLabel(double size) {
    if (size <= 0.8) return '작게';
    if (size <= 1.0) return '보통';
    if (size <= 1.2) return '크게';
    return '매우 크게';
  }

  void _handleBack(BuildContext context) {
    if (widget.onBackHome != null) {
      widget.onBackHome!();
    } else if (Navigator.canPop(context)) {
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => _handleBack(context),
        ),
        centerTitle: true,
        title: const Text('설정', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        children: [
          const SettingHeader(title: '화면'),

          SwitchListTile(
            title: const Text('다크모드', style: TextStyle(fontSize: 18)),
            subtitle: const Text('어두운 화면으로 전환합니다'),
            value: appState.isDarkMode,
            onChanged: (val) => appState.toggleDarkMode(),
            secondary: const Icon(Icons.dark_mode_outlined, size: 28),
          ),

          ListTile(
            leading: const Icon(Icons.text_fields, size: 28),
            title: const Text('글씨 크기', style: TextStyle(fontSize: 18)),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _getFontSizeLabel(appState.fontSize),
                  style: const TextStyle(fontSize: 14),
                ),
                Slider(
                  value: appState.fontSize,
                  min: 0.8,
                  max: 1.4,
                  divisions: 3,
                  onChanged: (val) => appState.setFontSize(val),
                ),
              ],
            ),
          ),

          const Divider(),

          const SettingHeader(title: '알림'),

          SwitchListTile(
            title: const Text('스미싱 경고 알림', style: TextStyle(fontSize: 18)),
            subtitle: const Text('위험 탐지 시 알림을 받습니다'),
            value: appState.smishingAlert,
            onChanged: (val) => appState.toggleSmishingAlert(),
            secondary: const Icon(Icons.notifications_outlined, size: 28),
          ),

          SwitchListTile(
            title: const Text('주의 알림', style: TextStyle(fontSize: 18)),
            subtitle: const Text('주의 탐지 시 알림을 받습니다'),
            value: appState.cautionAlert,
            onChanged: (val) => appState.toggleCautionAlert(),
            secondary: const Icon(Icons.warning_amber_outlined, size: 28),
          ),

          const Divider(),

          const SettingHeader(title: '앱 정보'),

          const ListTile(
            leading: Icon(Icons.info_outline, size: 28),
            title: Text('버전', style: TextStyle(fontSize: 18)),
            trailing: Text('1.0.0', style: TextStyle(fontSize: 16)),
          ),

          ListTile(
            leading: const Icon(Icons.privacy_tip_outlined, size: 28),
            title: const Text('개인정보 처리방침', style: TextStyle(fontSize: 18)),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),

          const Divider(),

          ListTile(
            leading: const Icon(Icons.logout, size: 28, color: Colors.red),
            title: const Text(
              '로그아웃',
              style: TextStyle(fontSize: 18, color: Colors.red),
            ),
            onTap: () {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (context) => const LoginScreen()),
              );
            },
          ),
        ],
      ),
    );
  }
}
