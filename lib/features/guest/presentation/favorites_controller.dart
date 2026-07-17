import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nepali_homestays/core/network/api_repository.dart';
import 'package:nepali_homestays/features/auth/presentation/auth_controller.dart';

final favoritesIdsProvider =
    StateNotifierProvider<FavoritesIdsController, Set<int>>((ref) {
  final ctrl = FavoritesIdsController(ref);
  ref.listen(authControllerProvider, (prev, next) {
    if (next.status == AuthStatus.authenticated) {
      ctrl.refresh();
    } else {
      ctrl.clear();
    }
  });
  if (ref.read(authControllerProvider).status == AuthStatus.authenticated) {
    Future.microtask(ctrl.refresh);
  }
  return ctrl;
});

class FavoritesIdsController extends StateNotifier<Set<int>> {
  FavoritesIdsController(this._ref) : super({});

  final Ref _ref;

  void clear() => state = {};

  Future<void> refresh() async {
    try {
      final rows = await _ref.read(apiRepositoryProvider).getFavorites();
      state = rows.map((e) => e.listingId).toSet();
    } catch (_) {
      state = {};
    }
  }

  Future<bool> toggle(int listingId) async {
    final auth = _ref.read(authControllerProvider);
    if (auth.status != AuthStatus.authenticated) return false;
    final api = _ref.read(apiRepositoryProvider);
    final isFav = state.contains(listingId);
    if (isFav) {
      await api.removeFavorite(listingId);
      state = {...state}..remove(listingId);
    } else {
      await api.addFavorite(listingId);
      state = {...state, listingId};
    }
    return true;
  }
}
