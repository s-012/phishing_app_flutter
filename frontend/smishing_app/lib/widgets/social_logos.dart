import 'package:flutter/material.dart';

/// 카카오톡 로고 (노란 배경 + 검정 말풍선)
class KakaoLogo extends StatelessWidget {
  const KakaoLogo({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 24,
      height: 24,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(6),
        child: Container(
          color: const Color(0xFFFEE500),
          child: const CustomPaint(
            size: Size(24, 24),
            painter: _KakaoPainter(),
          ),
        ),
      ),
    );
  }
}

class _KakaoPainter extends CustomPainter {
  const _KakaoPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF391B1B)
      ..style = PaintingStyle.fill;

    final w = size.width;
    final h = size.height;

    final bodyRect = Rect.fromLTWH(w * 0.12, h * 0.18, w * 0.76, h * 0.55);
    final bodyRRect = RRect.fromRectAndRadius(
      bodyRect,
      Radius.circular(h * 0.28),
    );
    canvas.drawRRect(bodyRRect, paint);

    final tailPath = Path();
    tailPath.moveTo(w * 0.28, h * 0.62);
    tailPath.lineTo(w * 0.18, h * 0.85);
    tailPath.lineTo(w * 0.40, h * 0.66);
    tailPath.close();
    canvas.drawPath(tailPath, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// 구글 로고 (이미지, 크게)
class GoogleLogo extends StatelessWidget {
  const GoogleLogo({super.key});

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      'assets/images/google_logo.png',
      width: 32,
      height: 32,
    );
  }
}

/// 네이버 로고 (초록 배경 + 흰 N)
class NaverLogo extends StatelessWidget {
  const NaverLogo({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 24,
      height: 24,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(6),
        child: Container(
          color: const Color(0xFF03C75A),
          child: const CustomPaint(
            size: Size(24, 24),
            painter: _NaverPainter(),
          ),
        ),
      ),
    );
  }
}

class _NaverPainter extends CustomPainter {
  const _NaverPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final paint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    final path = Path();
    path.moveTo(w * 0.22, h * 0.78);
    path.lineTo(w * 0.22, h * 0.22);
    path.lineTo(w * 0.45, h * 0.22);
    path.lineTo(w * 0.78, h * 0.62);
    path.lineTo(w * 0.78, h * 0.22);
    path.lineTo(w * 0.96, h * 0.22);
    path.lineTo(w * 0.96, h * 0.78);
    path.lineTo(w * 0.73, h * 0.78);
    path.lineTo(w * 0.40, h * 0.38);
    path.lineTo(w * 0.40, h * 0.78);
    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}