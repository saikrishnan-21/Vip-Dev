#!/usr/bin/env python3
"""
Test Coverage Utilities
Helper script for managing test coverage analysis from CSV file.
"""

import csv
import sys
import os

CSV_FILE = 'VIP PLAY Master Test Cases - Description.csv'

def add_covered_column():
    """Add 'Covered' column to CSV if it doesn't exist."""
    if not os.path.exists(CSV_FILE):
        print(f"Error: {CSV_FILE} not found")
        return False
    
    rows = []
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        
        if 'Covered' not in fieldnames:
            fieldnames.append('Covered')
        
        for row in reader:
            if 'Covered' not in row:
                row['Covered'] = 'No'
            rows.append(row)
    
    with open(CSV_FILE, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f'✓ Added "Covered" column to {len(rows)} rows')
    return True

def list_uncovered():
    """List all uncovered test cases."""
    if not os.path.exists(CSV_FILE):
        print(f"Error: {CSV_FILE} not found")
        return
    
    not_covered = []
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get('Covered', 'No') == 'No':
                not_covered.append((
                    row.get('Test Case ID', ''),
                    row.get('Test Case Description', ''),
                    row.get('Ticket', '')
                ))
    
    print(f"\nUncovered Test Cases ({len(not_covered)}):\n")
    for tc_id, desc, ticket in not_covered:
        desc_short = desc[:100] + '...' if len(desc) > 100 else desc
        print(f"{tc_id}: {desc_short} [{ticket}]")

def show_coverage_stats():
    """Show coverage statistics."""
    if not os.path.exists(CSV_FILE):
        print(f"Error: {CSV_FILE} not found")
        return
    
    covered = 0
    not_covered = 0
    total = 0
    
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            total += 1
            if row.get('Covered', 'No') == 'Yes':
                covered += 1
            else:
                not_covered += 1
    
    coverage_pct = (covered / total * 100) if total > 0 else 0
    
    print(f"\nCoverage Statistics:")
    print(f"  Covered: {covered}")
    print(f"  Not Covered: {not_covered}")
    print(f"  Total: {total}")
    print(f"  Coverage: {coverage_pct:.1f}%")

def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python test-coverage-utils.py <command>")
        print("\nCommands:")
        print("  add-column    - Add 'Covered' column to CSV")
        print("  list-uncovered - List all uncovered test cases")
        print("  stats         - Show coverage statistics")
        return
    
    command = sys.argv[1].lower()
    
    # Change to script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    if command == 'add-column':
        add_covered_column()
    elif command == 'list-uncovered':
        list_uncovered()
    elif command == 'stats':
        show_coverage_stats()
    else:
        print(f"Unknown command: {command}")
        print("Use: add-column, list-uncovered, or stats")

if __name__ == '__main__':
    main()

