import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nepali_homestays/core/network/api_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';

typedef CurrencyCode = String;

const currencyCodes = <CurrencyCode>['NPR', 'USD', 'INR', 'GBP', 'EUR', 'AUD'];

const currencySymbols = <CurrencyCode, String>{
  'NPR': 'रू',
  'USD': '\$',
  'INR': '₹',
  'GBP': '£',
  'EUR': '€',
  'AUD': 'A\$',
};

class CurrencyState {
  const CurrencyState({
    this.code = 'NPR',
    this.rates = const {},
    this.loading = true,
  });

  final CurrencyCode code;
  final Map<String, double> rates;
  final bool loading;

  CurrencyState copyWith({
    CurrencyCode? code,
    Map<String, double>? rates,
    bool? loading,
  }) {
    return CurrencyState(
      code: code ?? this.code,
      rates: rates ?? this.rates,
      loading: loading ?? this.loading,
    );
  }

  double convert(num priceNpr) {
    if (code == 'NPR') return priceNpr.toDouble();
    final r = rates[code];
    if (r == null) return priceNpr.toDouble();
    return priceNpr.toDouble() * r;
  }

  String format(num priceNpr, {int fractionDigits = 0}) {
    final amount = convert(priceNpr);
    final sym = currencySymbols[code] ?? code;
    return '$sym ${amount.toStringAsFixed(fractionDigits)}';
  }
}

class CurrencyNotifier extends StateNotifier<CurrencyState> {
  CurrencyNotifier(this._api) : super(const CurrencyState()) {
    _init();
  }

  final ApiRepository _api;
  static const _storageKey = 'nepali_homestays_currency';

  Future<void> _init() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_storageKey);
    final code = currencyCodes.contains(saved) ? saved! : 'NPR';
    state = state.copyWith(code: code);
    await refreshRates();
  }

  Future<void> refreshRates() async {
    try {
      final data = await _api.getCurrencyRates();
      final ratesRaw = data['rates'];
      final rates = <String, double>{};
      if (ratesRaw is Map) {
        ratesRaw.forEach((k, v) {
          final n = (v as num?)?.toDouble();
          if (n != null) rates[k.toString()] = n;
        });
      }
      state = state.copyWith(rates: rates, loading: false);
    } catch (_) {
      state = state.copyWith(
        rates: const {
          'USD': 0.0075,
          'INR': 0.62,
          'GBP': 0.0059,
          'EUR': 0.0069,
          'AUD': 0.0115,
        },
        loading: false,
      );
    }
  }

  Future<void> setCurrency(CurrencyCode code) async {
    if (!currencyCodes.contains(code)) return;
    state = state.copyWith(code: code);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_storageKey, code);
  }
}

final currencyProvider = StateNotifierProvider<CurrencyNotifier, CurrencyState>((ref) {
  return CurrencyNotifier(ref.watch(apiRepositoryProvider));
});
