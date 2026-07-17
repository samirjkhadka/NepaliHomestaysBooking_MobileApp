import 'package:flutter_test/flutter_test.dart';
import 'package:nepali_homestays/core/theme/app_theme.dart';

void main() {
  test('Himalayan Hearth color tokens', () {
    expect(AppColors.primary.toARGB32(), 0xFF680003);
    expect(AppColors.background.toARGB32(), 0xFFFBF9F4);
    expect(AppColors.dhakaRed.toARGB32(), 0xFFB32821);
  });
}
