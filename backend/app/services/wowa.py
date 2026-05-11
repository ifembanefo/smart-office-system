"""
Weighted Ordered Weighted Averaging (WOWA) operator.
Reference: Torra, V. (1997). The weighted OWA operator. IJIS, 12(2), 153-166.

WOWA unifies two aggregation ideas:
  1. Weighted Mean  — each source i has importance weight β_i (sums to 1).
  2. OWA            — values sorted high→low, positional weight W_i applied.

The key insight: build a monotone interpolation w* from the OWA cumulative
weights, then evaluate it at cumulative β values. This yields a combined
weight ω_i that simultaneously respects source importance AND value order.
"""

from typing import List, Tuple


# ─────────────────────────────────────────────────────────────────────────────
# Public helpers
# ─────────────────────────────────────────────────────────────────────────────

def owa_weights(n: int, a: float = 0.3, b: float = 0.8) -> List[float]:
    """
    Compute n OWA weights using the piecewise-linear fuzzy quantifier Q(r).

    Q(r) = 0              if r < a
    Q(r) = (r - a)/(b-a)  if a ≤ r ≤ b       ("most" region)
    Q(r) = 1              if r > b

    w_i = Q(i/n) - Q((i-1)/n)   for i = 1 … n  (1-indexed rank)

    Guarantees: w_i ≥ 0  and  Σ w_i = 1.
    Default (a=0.3, b=0.8) is the standard "most" linguistic quantifier.
    Special case (a=0, b=1) → uniform weights w_i = 1/n  (plain mean).
    """
    def Q(r: float) -> float:
        if r < a:
            return 0.0
        if r > b:
            return 1.0
        return (r - a) / (b - a)

    return [Q(i / n) - Q((i - 1) / n) for i in range(1, n + 1)]


def w_star(x: float, S: List[Tuple[float, float]]) -> float:
    """
    Monotone piecewise-linear interpolation through a set of (x, y) points.

    S need not be sorted — it is sorted internally.
    Clamps (flat extrapolation) beyond the boundary points.
    """
    pts = sorted(S, key=lambda p: p[0])

    if x <= pts[0][0]:
        return pts[0][1]
    if x >= pts[-1][0]:
        return pts[-1][1]

    # Walk the sorted segments to find the bracket containing x.
    for i in range(len(pts) - 1):
        x0, y0 = pts[i]
        x1, y1 = pts[i + 1]
        if x0 <= x <= x1:
            if x1 == x0:           # degenerate zero-length segment
                return y0
            t = (x - x0) / (x1 - x0)
            return y0 + t * (y1 - y0)

    return pts[-1][1]   # unreachable under normal use


# ─────────────────────────────────────────────────────────────────────────────
# Main operator
# ─────────────────────────────────────────────────────────────────────────────

def wowa(
    values: List[float],
    beta: List[float],
    a: float = 0.3,
    b: float = 0.8,
) -> float:
    """
    Weighted Ordered Weighted Averaging (WOWA) of `values`.

    Args:
        values: n scores / preferences from n sources.
        beta:   source importance weights (len n, should sum to 1).
        a, b:   fuzzy quantifier bounds  (default: 0.3, 0.8 = "most").

    Returns:
        Scalar WOWA aggregate.

    Verified properties:
        - all beta_i equal  →  result == plain OWA
        - a=0, b=1          →  result == weighted mean with beta
        - all values equal  →  result == that value  (idempotency)
    """
    n = len(values)
    if n == 0:
        return 0.0
    if len(beta) != n:
        raise ValueError(f"len(values)={n} != len(beta)={len(beta)}")

    # ── Step 1 ───────────────────────────────────────────────────────────────
    # Sort values descending; reorder beta to follow the same permutation.
    sigma      = sorted(range(n), key=lambda i: values[i], reverse=True)
    p_sigma    = [values[i] for i in sigma]   # rank-ordered values  (high → low)
    beta_sigma = [beta[i]   for i in sigma]   # matched importance weights

    # ── Step 2 ───────────────────────────────────────────────────────────────
    # OWA weights via the fuzzy quantifier Q(a, b).
    W = owa_weights(n, a, b)

    # ── Step 3 ───────────────────────────────────────────────────────────────
    # Build S: maps rank fraction i/n to cumulative OWA weight Σ W_1..W_i.
    # w*(x) is the unique monotone piecewise-linear function through S that
    # tells us "how much OWA weight is allocated to the top x-fraction of
    # sources" — evaluated at cumulative beta values in Step 4.
    S: List[Tuple[float, float]] = [(0.0, 0.0)]
    cum_w = 0.0
    for i in range(n):
        cum_w += W[i]
        S.append(((i + 1) / n, cum_w))

    # ── Step 4 ───────────────────────────────────────────────────────────────
    # Combined WOWA weights:
    #   ω_i = w*(Σ β_{1..i}) - w*(Σ β_{1..i-1})
    # The difference "charges" the portion of OWA weight covered by source i's
    # cumulative importance share.
    omega: List[float] = []
    cum_beta = 0.0
    for i in range(n):
        prev        = cum_beta
        cum_beta   += beta_sigma[i]
        omega.append(w_star(cum_beta, S) - w_star(prev, S))

    # ── Step 5 ───────────────────────────────────────────────────────────────
    # Weighted sum of rank-ordered values.
    return sum(omega[i] * p_sigma[i] for i in range(n))
