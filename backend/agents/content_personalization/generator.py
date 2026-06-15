from typing import Dict

def package_message_variants(subject: str, variant_a: str, variant_b: str, variant_c: str) -> Dict[str, str]:
    return {
        "variantA": f"Subject: {subject}\n\n{variant_a}",
        "variantB": f"Subject: {subject}\n\n{variant_b}",
        "variantC": f"Subject: {subject}\n\n{variant_c}"
    }
