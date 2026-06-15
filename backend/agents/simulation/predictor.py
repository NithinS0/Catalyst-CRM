def predict_revenue(audience_size: int, conversion_rate: float, average_order_value: float) -> float:
    return int(audience_size * conversion_rate) * average_order_value
