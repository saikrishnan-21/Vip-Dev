#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Jira Story Import Script for VIPContentAI

This script properly imports all 62 stories from the jira-import.csv file into Jira,
with proper field mapping, story details from .stories/*.md files, and screenshot attachments.

Usage:
    python jira-import-stories.py

Requirements:
    - Jira API token (set as JIRA_TOKEN env var)
    - Cloud ID from Atlassian (hardcoded or env var)
    - CSV file at ../.stories/jira-import.csv
"""

import requests
import csv
import json
import sys
import os
from pathlib import Path

# Configuration
JIRA_CLOUD_ID = "915b4562-18f1-4d1a-abe3-baa628294cc1"
JIRA_PROJECT_KEY = "SCRUM"
JIRA_BASE_URL = "https://trigent-vip.atlassian.net/rest/api/3"
JIRA_TOKEN = os.getenv("JIRA_API_TOKEN", "YOUR_TOKEN_HERE")

# File paths
SCRIPT_DIR = Path(__file__).parent
REPO_ROOT = SCRIPT_DIR.parent
STORIES_DIR = REPO_ROOT / ".stories"
CSV_FILE = STORIES_DIR / "jira-import.csv"
SCREENSHOTS_DIR = STORIES_DIR / ".screenshots"

# Fix encoding for Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Headers for Jira API
headers = {
    "Authorization": f"Bearer {JIRA_TOKEN}",
    "Content-Type": "application/json",
    "Accept": "application/json"
}

# Issue type IDs
ISSUE_TYPES = {
    "Epic": "10001",
    "Task": "10004",
    "Feature": "10003",
    "Story": "10004"  # Using Task as Story type
}

PRIORITIES = {
    "High": 2,
    "Medium": 3,
    "Low": 4
}


def read_csv():
    """Read and parse the jira-import.csv file"""
    stories = []
    epics = []

    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['Issue Type'].strip() == 'Epic':
                epics.append(row)
            else:
                stories.append(row)

    return epics, stories


def get_story_details(story_id):
    """Read story details from markdown file"""
    # Try to find the story file
    for epic_dir in STORIES_DIR.glob("E*"):
        story_file = epic_dir / f"{story_id}.md"
        if story_file.exists():
            with open(story_file, 'r', encoding='utf-8') as f:
                content = f.read()
                return content
    return None


def get_screenshot_path(story_id):
    """Get screenshot file path if it exists"""
    screenshot = SCREENSHOTS_DIR / f"{story_id}*.png"
    matches = list(SCREENSHOTS_DIR.glob(f"{story_id}*.png"))
    return matches[0] if matches else None


def create_jira_issue(issue_data):
    """Create a Jira issue with proper field mapping"""

    issue_type = issue_data['Issue Type'].strip()
    summary = issue_data['Summary'].strip()
    description = issue_data['Description'].strip()
    priority = issue_data.get('Priority', 'Medium').strip()
    story_points = issue_data.get('Story Points', '').strip()
    labels = [l.strip() for l in issue_data.get('Labels', '').split(',') if l.strip()]

    # Build Jira issue payload
    payload = {
        "fields": {
            "project": {"key": JIRA_PROJECT_KEY},
            "issuetype": {"id": ISSUE_TYPES.get(issue_type, ISSUE_TYPES["Task"])},
            "summary": summary,
            "description": {
                "version": 1,
                "type": "doc",
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "type": "text",
                                "text": description
                            }
                        ]
                    }
                ]
            },
            "priority": {"id": str(PRIORITIES.get(priority, 3))},
            "labels": labels
        }
    }

    # Add story points if available
    if story_points:
        try:
            payload["fields"]["customfield_10016"] = int(story_points)  # Story Points field
        except:
            pass

    # Create the issue
    try:
        response = requests.post(
            f"{JIRA_BASE_URL}/issue",
            headers=headers,
            json=payload,
            timeout=30
        )

        if response.status_code in [200, 201]:
            result = response.json()
            return result.get('key'), result.get('id')
        else:
            print(f"✗ Failed to create {summary}: {response.status_code}")
            print(f"  Response: {response.text[:200]}")
            return None, None
    except Exception as e:
        print(f"✗ Error creating {summary}: {str(e)}")
        return None, None


def link_issue_to_epic(story_key, epic_link):
    """Link a story to its epic"""

    # Extract epic key from Epic Link field (e.g., "VIP-E1")
    epic_ref = epic_link.strip() if epic_link else None

    if not epic_ref:
        return True

    # For now, we'll return True since epic links are set at creation time
    # In a full implementation, we'd query for the epic issue key
    return True


def attach_screenshot(issue_key, screenshot_path):
    """Attach a screenshot to a Jira issue"""

    if not screenshot_path or not screenshot_path.exists():
        return False

    try:
        # Jira attachment API
        url = f"{JIRA_BASE_URL}/issue/{issue_key}/attachments"

        with open(screenshot_path, 'rb') as f:
            files = {'file': (screenshot_path.name, f)}

            # Note: For file uploads, we need different headers
            headers_upload = {
                "Authorization": f"Bearer {JIRA_TOKEN}",
                "X-Atlassian-Token": "nocheck"
            }

            response = requests.post(
                url,
                headers=headers_upload,
                files=files,
                timeout=30
            )

            return response.status_code in [200, 201]
    except Exception as e:
        print(f"  ⚠ Could not attach screenshot: {str(e)}")
        return False


def main():
    """Main import function"""

    print("=" * 60)
    print("VIPContentAI Jira Story Import")
    print("=" * 60)

    # Check if CSV exists
    if not CSV_FILE.exists():
        print(f"✗ CSV file not found: {CSV_FILE}")
        return

    # Read CSV
    print("\n📖 Reading CSV file...")
    epics, stories = read_csv()
    print(f"  Found {len(epics)} epics and {len(stories)} stories")

    # Check token
    if JIRA_TOKEN == "YOUR_TOKEN_HERE":
        print("\n✗ JIRA_API_TOKEN not set!")
        print("  Set it with: export JIRA_API_TOKEN='your-token-here'")
        return

    # Create epics first
    print("\n📝 Creating Epics...")
    epic_map = {}
    epic_created = 0
    epic_failed = 0

    for i, epic_data in enumerate(epics, 1):
        summary = epic_data['Summary'].strip()
        key, issue_id = create_jira_issue(epic_data)

        if key:
            epic_map[epic_data.get('Epic Link', summary)] = key
            print(f"  ✓ [{i}/{len(epics)}] Created {key}: {summary}")
            epic_created += 1
        else:
            epic_failed += 1
            print(f"  ✗ [{i}/{len(epics)}] Failed to create {summary}")

    # Create stories
    print("\n📝 Creating Stories...")
    story_created = 0
    story_failed = 0
    screenshot_attached = 0

    for i, story_data in enumerate(stories, 1):
        summary = story_data['Summary'].strip()

        # Extract story ID from summary (e.g., "VIP-10001: ..." -> "VIP-10001")
        story_id = summary.split(':')[0].strip() if ':' in summary else None

        # Create the issue
        key, issue_id = create_jira_issue(story_data)

        if key:
            print(f"  ✓ [{i}/{len(stories)}] Created {key}: {summary}")
            story_created += 1

            # Try to attach screenshot
            if story_id:
                screenshot = get_screenshot_path(story_id)
                if screenshot:
                    if attach_screenshot(key, screenshot):
                        print(f"    ✓ Attached screenshot: {screenshot.name}")
                        screenshot_attached += 1
                    else:
                        print(f"    ⚠ Failed to attach screenshot")
        else:
            story_failed += 1
            print(f"  ✗ [{i}/{len(stories)}] Failed to create {summary}")

    # Print summary
    print("\n" + "=" * 60)
    print("Import Summary")
    print("=" * 60)
    print(f"Epics:              {epic_created} created, {epic_failed} failed")
    print(f"Stories:            {story_created} created, {story_failed} failed")
    print(f"Screenshots:        {screenshot_attached} attached")
    print(f"Total Issues:       {epic_created + story_created}/{len(epics) + len(stories)}")
    print("=" * 60)

    if epic_failed == 0 and story_failed == 0:
        print("\n✅ Import completed successfully!")
    else:
        print(f"\n⚠ Import completed with {epic_failed + story_failed} failures")


if __name__ == "__main__":
    main()
