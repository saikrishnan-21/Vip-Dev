"""
SEO Analysis Service (VIP-10209)
"""

import re
from typing import Dict, List

def analyze_seo(content: str, title: str, keywords: List[str]) -> Dict:
    """Analyze content for SEO metrics"""

    word_count = len(content.split())
    char_count = len(content)

    # Keyword density
    keyword_density = {}
    for keyword in keywords:
        count = content.lower().count(keyword.lower())
        density = (count / word_count * 100) if word_count > 0 else 0
        keyword_density[keyword] = {
            "count": count,
            "density": round(density, 2)
        }

    # Headings count
    h2_count = len(re.findall(r'##\s+', content))
    h3_count = len(re.findall(r'###\s+', content))

    # Calculate SEO score (0-100)
    score = 0
    score += min(word_count / 15, 30)  # Word count (max 30 points)
    score += min(sum([kd["count"] for kd in keyword_density.values()]) * 2, 25)  # Keywords (max 25)
    score += min(h2_count * 5, 20)  # Headings (max 20)
    score += 25 if title else 0  # Title present

    return {
        "overall_score": round(score),  # Test expects overall_score
        "score": round(score),  # Keep for backward compatibility
        "word_count": word_count,
        "char_count": char_count,
        "keyword_density": keyword_density,
        "headings": {
            "h2": h2_count,
            "h3": h3_count
        },
        "recommendations": generate_seo_recommendations(score, keyword_density, h2_count)
    }


def generate_seo_recommendations(score: float, keyword_density: Dict, h2_count: int) -> List[str]:
    """Generate SEO improvement recommendations"""
    recommendations = []

    if score < 50:
        recommendations.append("Improve overall SEO optimization")
    if h2_count < 3:
        recommendations.append("Add more H2 headings for better structure")

    for kw, data in keyword_density.items():
        if data["density"] < 0.5:
            recommendations.append(f"Increase '{kw}' keyword usage")
        elif data["density"] > 3:
            recommendations.append(f"Reduce '{kw}' keyword density to avoid stuffing")

    return recommendations
