import 'package:flutter/material.dart';
import '../app_state.dart'; 
import 'home_screen.dart';

import '../app_state.dart';
import '../services/api_client.dart';
import '../services/auth_api_service.dart';

import 'signup_screen.dart';
import 'onboarding_screen.dart';
import 'permission_screen.dart';
import '../widgets/social_login_button.dart';
import 'package:http/http.dart' as http; // 추가
import 'dart:convert'; //  추가
import 'package:url_launcher/url_launcher.dart'; 
import 'package:app_links/app_links.dart'; //  
import 'package:flutter_secure_storage/flutter_secure_storage.dart'; 

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _pwController = TextEditingController();

  bool _obscurePassword = true;
  bool _isLoading = false;

  Future<void> _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _pwController.text;

    if (email.isEmpty || password.isEmpty) {
      _showSnack('이메일과 비밀번호를 입력해주세요');
      return;
    }

    if (!_isValidEmail(email)) {
      _showSnack('올바른 이메일 형식을 입력해주세요');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final result = await AuthApiService.login(
        email: email,
        password: password,
      );

      appState.setAuthenticatedSession(result.user);

      if (!mounted) return;


  // 라이브러리 인스턴스 선언
  late AppLinks _appLinks;
  final _storage = const FlutterSecureStorage();

  @override
  void initState() {
    super.initState();
    _initDeepLinks(); // 화면이 켜질 때 소셜 로그인 딥링크 감시 시작
  }

  
  void _initDeepLinks() {
    _appLinks = AppLinks();

    _appLinks.uriLinkStream.listen((Uri? uri) async {
      if (uri == null) return;

      debugPrint('🔗 감지된 딥링크 수신 호스트: ${uri.host}');

      if (uri.host == 'login-success') {
        final String? token = uri.queryParameters['token'];
        final String? platform = uri.queryParameters['platform'];
        final String? rawName = uri.queryParameters['name'];
        final String? rawEmail = uri.queryParameters['email'];
        
        String? name;
        String? email;
        try {
          if (rawName != null) name = Uri.decodeComponent(rawName);
          if (rawEmail != null) email = Uri.decodeComponent(rawEmail);
        } catch (e) {
          debugPrint('데이터 디코딩 오류 (기본값 대체): $e');
          name = rawName;
          email = rawEmail;
        }

        if (token != null) {
          debugPrint('[$platform 간편로그인 성공] 토큰 획득 완료');
          debugPrint('파싱된 유저 정보 -> 이름: $name, 이메일: $email');
          
          await _storage.write(key: 'user_token', value: token);
          await _storage.write(key: 'login_platform', value: platform ?? 'unknown');
          
          if (name != null) {
            await _storage.write(key: 'user_name', value: name);
          }
          if (email != null) {
            await _storage.write(key: 'user_email', value: email);
          }
          
          appState.login();
          if (mounted) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => const HomeScreen()),
            );
          }
        }
      } else if (uri.host == 'login-fail') {
        debugPrint('간편로그인 실패 신호 수신');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('소셜 로그인에 실패했습니다. 다시 시도해주세요.')),
          );
        }
      }
    }, onError: (err) {
      debugPrint('딥링크 리스너 내부 에러: $err');
    });
  }
  
  Future<void> _handleLogin() async {
    final email = _idController.text.trim();
    final password = _pwController.text.trim();

    // 
    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('아이디와 비밀번호를 입력해주세요.')),
      );
      return;
    }

    try {
      final response = await http.post(
        Uri.parse('------- env http4 적으시면 됩니다--------'), 
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      ).timeout(const Duration(seconds: 5)); //  [추가] 5초 타임아웃

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        final String? token = responseData['token'];

        if (token != null) {
          await _storage.write(key: 'user_token', value: token);
          await _storage.write(key: 'login_platform', value: 'email');
        }

        appState.login();
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const HomeScreen()),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('아이디 또는 비밀번호가 올바르지 않습니다.')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('서버 연결 실패! 팀플 백엔드(4000번)를 확인하세요.')),
        );
      }
    }
  }

  //  [수정] 소셜 로그인 실행 함수 (카카오, 네이버 주소 호출)
  void _handleSocialLogin(String platform) async {
    final url = Uri.parse('------- env http:4~ 적으시면 됩니다---');
    
    try {

      if (await canLaunchUrl(url)) {
        await launchUrl(url, mode: LaunchMode.externalApplication);
      } else {
        debugPrint('브라우저를 열 수 없는 주소입니다: $url');
      }
    } catch (e) {
      debugPrint('소셜 로그인 오류: $e');
    }

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => const PermissionScreen(),
        ),
      );
    } on ApiException catch (e) {
      _showSnack(e.message);
    } catch (_) {
      _showSnack('로그인 중 오류가 발생했습니다');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _continueAsGuest() async {
    await appState.logout();

    if (!context.mounted) return;

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => const PermissionScreen(),
      ),
    );
  }

  bool _isValidEmail(String value) {
    return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(value);
  }

  void _showSnack(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _pwController.dispose();
    super.dispose();
  }

  Widget _buildGuestButton() {
    return Center(
      child: GestureDetector(
        onTap: _continueAsGuest,
        behavior: HitTestBehavior.opaque,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: 12,
            vertical: 6,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                '비회원으로 이용하기',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey,
                  letterSpacing: -0.2,
                ),
              ),
              const SizedBox(height: 3),
              Container(
                width: 126,
                height: 1,
                color: Colors.grey.shade400,
              ),
            ],
          ),
        ),
      ),
    );

  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios),
          onPressed: () {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => const OnboardingScreen(),
              ),
            );
          },
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              Center(
                child: Column(
                  children: [
                    Container(
                      width: 90, height: 90,
                      decoration: BoxDecoration(
                        color: const Color(0xFF1976D2),
                        borderRadius: BorderRadius.circular(22),
                      ),
                      child: const Icon(Icons.security, color: Colors.white, size: 54),
                    ),
                    const SizedBox(height: 16),
                    const Text('스미싱 탐지기', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Color(0xFF1976D2))),
                  ],
                ),
              ),
              const SizedBox(height: 40),

              // 아이디 입력
              const Text('아이디', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              TextField(
                controller: _idController,
                style: const TextStyle(fontSize: 18), //  추가
                decoration: InputDecoration(
                  hintText: '아이디를 입력하세요', 
                  prefixIcon: const Icon(Icons.person_outline, color: Color(0xFF1976D2)), 
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))
                ),
              ),
              const SizedBox(height: 16),
              // 비밀번호 입력
              const Text('비밀번호', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),

              const Text(
                '이메일',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                autocorrect: false,
                style: const TextStyle(fontSize: 18),
                decoration: InputDecoration(
                  hintText: 'example@email.com',
                  prefixIcon: const Icon(
                    Icons.email_outlined,
                    size: 28,
                    color: Color(0xFF1976D2),
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(
                      color: Color(0xFF1976D2),
                      width: 2,
                    ),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 18,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                '비밀번호',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),

              const SizedBox(height: 8),
              TextField(
                controller: _pwController,
                obscureText: _obscurePassword,
                style: const TextStyle(fontSize: 18), // 추가 
                decoration: InputDecoration(
                  hintText: '비밀번호를 입력하세요',
                  prefixIcon: const Icon(Icons.lock_outline, color: Color(0xFF1976D2)),
                  suffixIcon: IconButton(

                    icon: Icon(_obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),

                    icon: Icon(
                      _obscurePassword
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                    ),
                    onPressed: () {
                      setState(() {
                        _obscurePassword = !_obscurePassword;
                      });
                    },
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(
                      color: Color(0xFF1976D2),
                      width: 2,
                    ),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 18,

                  ),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 24),

              // 로그인 버튼

              SizedBox(
                width: double.infinity, height: 60,
                child: ElevatedButton(

                  onPressed: _handleLogin, //  [수정] 이제 이 버튼은 서버와 통신
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1976D2), 
                    foregroundColor: Colors.white, 
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))
                  ),
                  child: const Text('로그인', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 12),
              // 회원가입 버튼
              Center(
                child: TextButton(
                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const SignupScreen())),
                  child: const Text('아직 계정이 없으신가요? 회원가입', style: TextStyle(fontSize: 16, color: Color(0xFF1976D2))),

                  onPressed: _isLoading ? null : _handleLogin,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1976D2),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          '로그인',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 12),
              Center(
                child: TextButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const SignupScreen(),
                      ),
                    );
                  },
                  child: const Text(
                    '아직 계정이 없으신가요? 회원가입',
                    style: TextStyle(
                      fontSize: 16,
                      color: Color(0xFF1976D2),
                    ),
                  ),

                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  const Expanded(child: Divider()),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12), 
                    child: Text('간편 로그인', style: TextStyle(color: Colors.grey.shade500))
                  ),
                  const Expanded(child: Divider()),
                ],
              ),
              const SizedBox(height: 20),
              SocialLoginButton(

                color: const Color(0xFFFEE500), 
                textColor: const Color(0xFF191919), 
                icon: Icons.chat_bubble, 
                iconColor: const Color(0xFF191919), 
                text: '카카오로 시작하기', 
                onTap: () => _handleSocialLogin('kakao') //  카카오 호출
              ),
              const SizedBox(height: 12),
              SocialLoginButton(
                color: const Color(0xFF03C75A), 
                textColor: Colors.white, 
                icon: Icons.login, 
                iconColor: Colors.white, 
                text: '네이버로 시작하기', 
                onTap: () => _handleSocialLogin('naver') //  네이버 호출
              ),
              const SizedBox(height: 12),
              SocialLoginButton(
                color: Colors.white, 
                textColor: const Color(0xFF191919), 
                icon: Icons.g_mobiledata, 
                iconColor: const Color(0xFF4285F4), 
                text: '구글로 시작하기', 
                onTap: () => _handleSocialLogin('google'), //  구글 호출
                hasBorder: true
              ),

                color: const Color(0xFFFEE500),
                textColor: const Color(0xFF191919),
                icon: Icons.chat_bubble,
                iconColor: const Color(0xFF191919),
                text: '카카오로 시작하기',
                onTap: () {
                  _showSnack('간편 로그인은 다음 단계에서 연동됩니다');
                },
              ),
              const SizedBox(height: 12),
              SocialLoginButton(
                color: const Color(0xFF03C75A),
                textColor: Colors.white,
                icon: Icons.login,
                iconColor: Colors.white,
                text: '네이버로 시작하기',
                onTap: () {
                  _showSnack('간편 로그인은 다음 단계에서 연동됩니다');
                },
              ),
              const SizedBox(height: 12),
              SocialLoginButton(
                color: Colors.white,
                textColor: const Color(0xFF191919),
                icon: Icons.g_mobiledata,
                iconColor: const Color(0xFF4285F4),
                text: '구글로 시작하기',
                onTap: () {
                  _showSnack('간편 로그인은 다음 단계에서 연동됩니다');
                },
                hasBorder: true,
              ),
              const SizedBox(height: 22),
              _buildGuestButton(),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
