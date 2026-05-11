from app.models.sensor import UserPreference, SimpleAggregationResult, WOWAAggregationResult, BlindPosition
from app.services.wowa import wowa

PARTNER_DATA = {
    "professor": {"label": "Prof. Dr. Weber", "height": 60.0, "angle": 93.0, "temp": 23.0, "licht": 3000.0},
    "student":   {"label": "Leonie Bauer",    "height": 80.0, "angle": 85.0, "temp": 27.0, "licht": 1200.0},
}

DIMS = ["height", "angle", "temp", "licht"]


def simple_average(pref: UserPreference) -> SimpleAggregationResult:
    partner = PARTNER_DATA[pref.partner_profile]
    user_vals    = {d: getattr(pref, d) for d in DIMS}
    partner_vals = {d: partner[d]       for d in DIMS}
    aggregated   = {d: round((user_vals[d] + partner_vals[d]) / 2, 1) for d in DIMS}

    return SimpleAggregationResult(
        partner_label=partner["label"],
        partner_values=partner_vals,
        user_values=user_vals,
        aggregated=aggregated,
        blind_position=BlindPosition(height=aggregated["height"], angle=aggregated["angle"]),
    )


def wowa_aggregate(
    pref: UserPreference,
    beta_user: float = 0.5,
    beta_partner: float = 0.5,
    a: float = 0.3,
    b: float = 0.8,
) -> WOWAAggregationResult:
    partner = PARTNER_DATA[pref.partner_profile]
    user_vals    = {d: getattr(pref, d) for d in DIMS}
    partner_vals = {d: partner[d]       for d in DIMS}

    # WOWA over the two sources (user, partner) per dimension.
    # beta = [user_weight, partner_weight]; values always ordered [user, partner].
    aggregated = {
        d: round(
            wowa(
                [user_vals[d], partner_vals[d]],
                [beta_user, beta_partner],
                a=a,
                b=b,
            ),
            1,
        )
        for d in DIMS
    }

    return WOWAAggregationResult(
        partner_label=partner["label"],
        beta={"user": beta_user, "partner": beta_partner},
        owa_params={"a": a, "b": b},
        partner_values=partner_vals,
        user_values=user_vals,
        aggregated=aggregated,
        blind_position=BlindPosition(height=aggregated["height"], angle=aggregated["angle"]),
    )
