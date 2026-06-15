from typing import TypedDict

class CustomerProfile(TypedDict):
    customerId: str
    name: str
    churnScore: int
    clvScore: int
    healthScore: int
    lifecycleStage: str
