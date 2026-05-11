"""
Unit tests for the WOWA operator.

Covers:
  - owa_weights:  sum-to-one, non-negativity, exact values
  - w_star:       boundary clamping, exact interpolation points, interior
  - wowa:         numerical example, OWA-equivalence, weighted-mean-equivalence,
                  idempotency, monotonicity, invalid input
"""

import pytest
from app.services.wowa import wowa, owa_weights, w_star

# Exact expected value computed analytically for the n=7 example:
#   sigma = [0,2,6,1,5,3,4], p = [5,5,5,4,4,3,2], beta_sigma=[0.2,0.1,0.1,0.2,0.2,0.1,0.1]
#   omega = [0, 9/350, 9/50, 69/175, 58/175, 12/175, 0]
#   WOWA  = 724/175
EXAMPLE_VALUES = [5.0, 4.0, 5.0, 3.0, 2.0, 4.0, 5.0]
EXAMPLE_BETA   = [0.2, 0.2, 0.1, 0.1, 0.1, 0.2, 0.1]
EXAMPLE_A, EXAMPLE_B = 0.3, 0.8
EXAMPLE_WOWA_EXACT = 724 / 175        # ≈ 4.1371
EXAMPLE_OWA_EXACT  = 143 / 35         # ≈ 4.0857
EXAMPLE_WM_EXACT   = 4.1              # exact (finite decimal)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers used across tests
# ─────────────────────────────────────────────────────────────────────────────

def plain_owa(values, a=0.3, b=0.8):
    """Reference plain-OWA result (no beta weighting)."""
    n = len(values)
    W = owa_weights(n, a, b)
    return sum(W[i] * v for i, v in enumerate(sorted(values, reverse=True)))


def weighted_mean(values, beta):
    return sum(b * v for b, v in zip(beta, values))


# ─────────────────────────────────────────────────────────────────────────────
# owa_weights
# ─────────────────────────────────────────────────────────────────────────────

class TestOwaWeights:

    @pytest.mark.parametrize("n", [1, 2, 3, 7, 10, 20])
    def test_sums_to_one(self, n):
        assert sum(owa_weights(n)) == pytest.approx(1.0, rel=1e-9)

    @pytest.mark.parametrize("n", [1, 2, 3, 7, 10])
    def test_all_non_negative(self, n):
        assert all(w >= -1e-12 for w in owa_weights(n))

    def test_n7_most_exact(self):
        # Exact fractions: w=[0,0,9/35,10/35,10/35,6/35,0]
        W = owa_weights(7, a=0.3, b=0.8)
        expected = [0.0, 0.0, 9/35, 10/35, 10/35, 6/35, 0.0]
        for got, exp in zip(W, expected):
            assert got == pytest.approx(exp, rel=1e-9)

    def test_uniform_when_a0_b1(self):
        # Q(r)=r → w_i = 1/n for all i
        for n in [1, 3, 7]:
            W = owa_weights(n, a=0.0, b=1.0)
            assert all(w == pytest.approx(1 / n, rel=1e-9) for w in W)

    def test_first_weight_zero_when_quantifier_starts_late(self):
        # With a=0.3 and n=7, the first two ranks fall below a → w=0
        W = owa_weights(7, a=0.3, b=0.8)
        assert W[0] == pytest.approx(0.0)
        assert W[1] == pytest.approx(0.0)

    def test_last_weight_zero_when_quantifier_ends_early(self):
        # With b=0.8 and n=7, rank 7 (r=1.0 > b) → w_7 = Q(1)-Q(6/7)=1-1=0
        W = owa_weights(7, a=0.3, b=0.8)
        assert W[-1] == pytest.approx(0.0)


# ─────────────────────────────────────────────────────────────────────────────
# w_star
# ─────────────────────────────────────────────────────────────────────────────

class TestWStar:

    S = [(0.0, 0.0), (0.5, 0.4), (1.0, 1.0)]

    def test_exact_knot_points(self):
        for x, y in self.S:
            assert w_star(x, self.S) == pytest.approx(y)

    def test_interior_interpolation(self):
        # Between (0,0) and (0.5,0.4): t=0.5 → y=0.2
        assert w_star(0.25, self.S) == pytest.approx(0.2, rel=1e-9)

    def test_clamp_below(self):
        assert w_star(-1.0, self.S) == pytest.approx(0.0)

    def test_clamp_above(self):
        assert w_star(2.0, self.S) == pytest.approx(1.0)

    def test_unsorted_input_gives_same_result(self):
        S_shuffled = [(1.0, 1.0), (0.0, 0.0), (0.5, 0.4)]
        assert w_star(0.25, S_shuffled) == pytest.approx(w_star(0.25, self.S))

    def test_flat_segment(self):
        # Both surrounding points have y=0 → interior must also be 0
        S = [(0.0, 0.0), (1/7, 0.0), (2/7, 0.0), (3/7, 0.25)]
        assert w_star(0.20, S) == pytest.approx(0.0)


# ─────────────────────────────────────────────────────────────────────────────
# wowa — numerical example
# ─────────────────────────────────────────────────────────────────────────────

class TestWOWANumerical:

    def test_wowa_exact_value(self):
        """n=7 example: WOWA = 724/175 ≈ 4.1371."""
        result = wowa(EXAMPLE_VALUES, EXAMPLE_BETA, EXAMPLE_A, EXAMPLE_B)
        assert result == pytest.approx(EXAMPLE_WOWA_EXACT, rel=1e-6)

    def test_owa_exact_value(self):
        """Sanity-check the reference OWA: 143/35 ≈ 4.0857."""
        result = plain_owa(EXAMPLE_VALUES, EXAMPLE_A, EXAMPLE_B)
        assert result == pytest.approx(EXAMPLE_OWA_EXACT, rel=1e-6)

    def test_weighted_mean_exact_value(self):
        """Sanity-check the reference weighted mean: 4.1."""
        result = weighted_mean(EXAMPLE_VALUES, EXAMPLE_BETA)
        assert result == pytest.approx(EXAMPLE_WM_EXACT, rel=1e-9)

    def test_wowa_omega_weights_sum_to_one(self):
        """Verify via idempotency: WOWA([c,c,...]) == c for any constant c."""
        n = len(EXAMPLE_VALUES)
        for c in [0.0, 1.0, 7.5]:
            assert wowa([c] * n, EXAMPLE_BETA) == pytest.approx(c, abs=1e-9)


# ─────────────────────────────────────────────────────────────────────────────
# wowa — mathematical properties
# ─────────────────────────────────────────────────────────────────────────────

class TestWOWAProperties:

    # ── Property 1: equal beta → WOWA == OWA ──────────────────────────────
    def test_equal_beta_matches_owa(self):
        """When all β_i = 1/n, WOWA reduces to plain OWA (positional weights only)."""
        n = 7
        equal_beta = [1 / n] * n
        result   = wowa(EXAMPLE_VALUES, equal_beta, EXAMPLE_A, EXAMPLE_B)
        expected = plain_owa(EXAMPLE_VALUES, EXAMPLE_A, EXAMPLE_B)
        assert result == pytest.approx(expected, rel=1e-9)

    def test_equal_beta_matches_owa_small(self):
        vals = [10.0, 3.0, 7.0]
        n = len(vals)
        result   = wowa(vals, [1/n]*n, a=0.3, b=0.8)
        expected = plain_owa(vals, a=0.3, b=0.8)
        assert result == pytest.approx(expected, rel=1e-9)

    # ── Property 2: uniform W (a=0,b=1) → WOWA == weighted mean ──────────
    def test_uniform_owa_matches_weighted_mean(self):
        """When W_i = 1/n  (a=0, b=1), WOWA reduces to the weighted mean."""
        result   = wowa(EXAMPLE_VALUES, EXAMPLE_BETA, a=0.0, b=1.0)
        expected = weighted_mean(EXAMPLE_VALUES, EXAMPLE_BETA)
        assert result == pytest.approx(expected, rel=1e-9)

    def test_uniform_owa_matches_weighted_mean_small(self):
        vals = [2.0, 8.0, 5.0]
        beta = [0.5, 0.3, 0.2]
        result   = wowa(vals, beta, a=0.0, b=1.0)
        expected = weighted_mean(vals, beta)
        assert result == pytest.approx(expected, rel=1e-9)

    # ── Idempotency ────────────────────────────────────────────────────────
    def test_idempotent(self):
        """All equal values → result is that value regardless of weights."""
        for c in [0.0, 3.14, 100.0]:
            assert wowa([c, c, c], [0.3, 0.5, 0.2]) == pytest.approx(c, abs=1e-9)

    # ── Boundary (monotonicity) ────────────────────────────────────────────
    def test_bounded_by_min_max(self):
        """Result must lie within [min(values), max(values)]."""
        result = wowa(EXAMPLE_VALUES, EXAMPLE_BETA)
        assert result >= min(EXAMPLE_VALUES) - 1e-9
        assert result <= max(EXAMPLE_VALUES) + 1e-9

    def test_monotone_higher_value_higher_result(self):
        """Raising one source's value cannot decrease WOWA."""
        beta = [0.5, 0.5]
        r1 = wowa([5.0, 3.0], beta)
        r2 = wowa([4.0, 3.0], beta)
        assert r1 >= r2

    # ── n=1 edge case ──────────────────────────────────────────────────────
    def test_single_element(self):
        assert wowa([42.0], [1.0]) == pytest.approx(42.0)

    # ── n=2 special case ───────────────────────────────────────────────────
    def test_n2_equal_beta_is_owa(self):
        """For two equal-weight sources WOWA == OWA."""
        vals = [7.0, 3.0]
        result   = wowa(vals, [0.5, 0.5], a=0.3, b=0.8)
        expected = plain_owa(vals, a=0.3, b=0.8)
        assert result == pytest.approx(expected, rel=1e-9)

    def test_n2_uniform_w_is_weighted_mean(self):
        vals = [7.0, 3.0]
        beta = [0.7, 0.3]
        result   = wowa(vals, beta, a=0.0, b=1.0)
        expected = weighted_mean(vals, beta)
        assert result == pytest.approx(expected, rel=1e-9)


# ─────────────────────────────────────────────────────────────────────────────
# wowa — invalid input
# ─────────────────────────────────────────────────────────────────────────────

class TestWOWAInvalidInput:

    def test_length_mismatch_raises(self):
        with pytest.raises(ValueError, match="len"):
            wowa([1.0, 2.0], [0.5, 0.3, 0.2])

    def test_empty_values_returns_zero(self):
        assert wowa([], []) == 0.0
