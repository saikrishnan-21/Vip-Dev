"""
Readability Analysis Service (VIP-10210)
"""

import re
from typing import Dict

def analyze_readability(content: str) -> Dict:
    """Calculate readability metrics"""

    sentences = re.split(r'[.!?]+', content)
    sentences = [s.strip() for s in sentences if s.strip()]
    sentence_count = len(sentences)

    words = content.split()
    word_count = len(words)

    # Count syllables (simplified)
    syllables = sum([count_syllables(word) for word in words])

    # Flesch Reading Ease
    if sentence_count > 0 and word_count > 0:
        avg_sentence_length = word_count / sentence_count
        avg_syllables_per_word = syllables / word_count
        flesch_score = 206.835 - 1.015 * avg_sentence_length - 84.6 * avg_syllables_per_word
        flesch_score = max(0, min(100, flesch_score))
    else:
        flesch_score = 0
        avg_sentence_length = 0
        avg_syllables_per_word = 0

    # Grade level
    grade_level = calculate_grade_level(avg_sentence_length, avg_syllables_per_word)

    return {
        "flesch_ease": round(flesch_score, 1),  # Test expects flesch_ease
        "flesch_score": round(flesch_score, 1),  # Keep for backward compatibility
        "grade_level": grade_level,
        "readability_level": get_readability_level(flesch_score),
        "metrics": {
            "sentence_count": sentence_count,
            "word_count": word_count,
            "avg_sentence_length": round(avg_sentence_length, 1),
            "avg_syllables_per_word": round(avg_syllables_per_word, 2)
        },
        "recommendations": generate_readability_recommendations(flesch_score, avg_sentence_length)
    }


def count_syllables(word: str) -> int:
    """Simple syllable counter"""
    word = word.lower()
    vowels = "aeiouy"
    syllable_count = 0
    previous_was_vowel = False

    for char in word:
        is_vowel = char in vowels
        if is_vowel and not previous_was_vowel:
            syllable_count += 1
        previous_was_vowel = is_vowel

    if word.endswith('e'):
        syllable_count -= 1
    if syllable_count == 0:
        syllable_count = 1

    return syllable_count


def calculate_grade_level(avg_sentence_length: float, avg_syllables: float) -> str:
    """Calculate grade level"""
    grade = 0.39 * avg_sentence_length + 11.8 * avg_syllables - 15.59
    grade = max(1, min(18, grade))
    return f"Grade {int(grade)}"


def get_readability_level(flesch_score: float) -> str:
    """Get readability level description"""
    if flesch_score >= 90:
        return "Very Easy"
    elif flesch_score >= 80:
        return "Easy"
    elif flesch_score >= 70:
        return "Fairly Easy"
    elif flesch_score >= 60:
        return "Standard"
    elif flesch_score >= 50:
        return "Fairly Difficult"
    elif flesch_score >= 30:
        return "Difficult"
    else:
        return "Very Difficult"


def generate_readability_recommendations(flesch_score: float, avg_sentence_length: float) -> list:
    """Generate readability improvement recommendations"""
    recommendations = []

    if flesch_score < 60:
        recommendations.append("Simplify sentence structure for better readability")
    if avg_sentence_length > 20:
        recommendations.append("Shorten sentences - aim for 15-20 words per sentence")
    if flesch_score < 50:
        recommendations.append("Use simpler words and shorter paragraphs")

    return recommendations
