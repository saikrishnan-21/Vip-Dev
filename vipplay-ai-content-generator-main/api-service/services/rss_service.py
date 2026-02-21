"""
RSS Feed Service
Handles RSS/Atom feed fetching and parsing
"""

import os
import logging
import aiohttp
import xml.etree.ElementTree as ET
from typing import Optional, Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)


class RSSService:
    """Service for fetching and parsing RSS/Atom feeds"""

    async def fetch_and_parse_rss(
        self,
        feed_url: str,
        max_items: int = 50,
        include_content: bool = True,
    ) -> Dict[str, Any]:
        """
        Fetch and parse an RSS/Atom feed

        Args:
            feed_url: URL of the RSS/Atom feed
            max_items: Maximum number of items to return
            include_content: Whether to include full content

        Returns:
            Dict with success status and feed data or error message
        """
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "User-Agent": "Mozilla/5.0 (compatible; VIPContentAI/1.0; +https://vipcontentai.com)"
                }

                logger.info(f"Fetching RSS feed: {feed_url}")

                async with session.get(feed_url, headers=headers, timeout=30) as response:
                    if response.status != 200:
                        logger.error(f"Failed to fetch RSS feed: {response.status}")
                        return {
                            "success": False,
                            "error": f"Failed to fetch RSS feed: {response.status} {response.reason}"
                        }

                    xml_text = await response.text()

            # Parse XML
            feed_data = self._parse_rss_xml(xml_text, max_items, include_content)

            logger.info(f"Successfully parsed RSS feed: {len(feed_data['items'])} items")

            return {
                "success": True,
                "feed": feed_data
            }

        except aiohttp.ClientError as e:
            logger.error(f"HTTP error fetching RSS feed: {str(e)}")
            return {
                "success": False,
                "error": f"Network error: {str(e)}"
            }
        except ET.ParseError as e:
            logger.error(f"XML parse error: {str(e)}")
            return {
                "success": False,
                "error": f"Invalid RSS feed format: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Unexpected error parsing RSS feed: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to parse RSS feed: {str(e)}"
            }

    def _parse_rss_xml(
        self,
        xml_text: str,
        max_items: int,
        include_content: bool
    ) -> Dict[str, Any]:
        """
        Parse RSS/Atom XML

        Args:
            xml_text: Raw XML text
            max_items: Maximum items to parse
            include_content: Whether to include full content

        Returns:
            Parsed feed data
        """
        root = ET.fromstring(xml_text)

        # Detect feed type (RSS or Atom)
        if root.tag == "{http://www.w3.org/2005/Atom}feed":
            return self._parse_atom_feed(root, max_items, include_content)
        else:
            return self._parse_rss_feed(root, max_items, include_content)

    def _parse_rss_feed(
        self,
        root: ET.Element,
        max_items: int,
        include_content: bool
    ) -> Dict[str, Any]:
        """Parse RSS 2.0 feed"""
        channel = root.find("channel")
        if channel is None:
            raise ValueError("Invalid RSS feed: no channel element")

        feed_title = self._get_text(channel, "title")
        feed_description = self._get_text(channel, "description")
        feed_link = self._get_text(channel, "link")

        items = []
        for item_elem in channel.findall("item")[:max_items]:
            item = {
                "title": self._get_text(item_elem, "title"),
                "link": self._get_text(item_elem, "link"),
                "description": self._get_text(item_elem, "description"),
                "guid": self._get_text(item_elem, "guid"),
                "pubDate": self._get_text(item_elem, "pubDate"),
                "author": self._get_text(item_elem, "author") or self._get_text(item_elem, "{http://purl.org/dc/elements/1.1/}creator"),
            }

            # Extract content
            if include_content:
                content_encoded = self._get_text(item_elem, "{http://purl.org/rss/1.0/modules/content/}encoded")
                item["content"] = content_encoded or item["description"]

            # Extract categories
            categories = [cat.text for cat in item_elem.findall("category") if cat.text]
            item["categories"] = categories

            # Extract enclosure (for images)
            enclosure = item_elem.find("enclosure")
            if enclosure is not None:
                item["enclosure"] = {
                    "url": enclosure.get("url"),
                    "type": enclosure.get("type"),
                    "length": enclosure.get("length")
                }

            items.append(item)

        return {
            "title": feed_title,
            "description": feed_description,
            "link": feed_link,
            "items": items
        }

    def _parse_atom_feed(
        self,
        root: ET.Element,
        max_items: int,
        include_content: bool
    ) -> Dict[str, Any]:
        """Parse Atom feed"""
        ns = {"atom": "http://www.w3.org/2005/Atom"}

        feed_title = self._get_text(root, "atom:title", ns)
        feed_subtitle = self._get_text(root, "atom:subtitle", ns)

        link_elem = root.find("atom:link[@rel='alternate']", ns) or root.find("atom:link", ns)
        feed_link = link_elem.get("href") if link_elem is not None else None

        items = []
        for entry in root.findall("atom:entry", ns)[:max_items]:
            link_elem = entry.find("atom:link[@rel='alternate']", ns) or entry.find("atom:link", ns)
            link = link_elem.get("href") if link_elem is not None else None

            item = {
                "title": self._get_text(entry, "atom:title", ns),
                "link": link,
                "description": self._get_text(entry, "atom:summary", ns),
                "guid": self._get_text(entry, "atom:id", ns),
                "pubDate": self._get_text(entry, "atom:published", ns) or self._get_text(entry, "atom:updated", ns),
            }

            # Extract author
            author_elem = entry.find("atom:author", ns)
            if author_elem is not None:
                author_name = self._get_text(author_elem, "atom:name", ns)
                item["author"] = author_name

            # Extract content
            if include_content:
                content = self._get_text(entry, "atom:content", ns)
                item["content"] = content or item["description"]

            # Extract categories
            categories = [cat.get("term") for cat in entry.findall("atom:category", ns) if cat.get("term")]
            item["categories"] = categories

            items.append(item)

        return {
            "title": feed_title,
            "description": feed_subtitle,
            "link": feed_link,
            "items": items
        }

    def _get_text(self, element: ET.Element, path: str, namespaces: Optional[Dict[str, str]] = None) -> Optional[str]:
        """Safely get text from XML element"""
        child = element.find(path, namespaces or {})
        return child.text if child is not None and child.text else None


# Singleton instance
rss_service = RSSService()
