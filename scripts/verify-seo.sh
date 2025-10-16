#!/bin/bash

# SEO Verification Script
# Tests all SEO endpoints and validates implementation

set -e

echo "=========================================="
echo "DevTalks SEO Verification Script"
echo "=========================================="
echo ""

# Configuration
BASE_URL="${1:-http://localhost:3000}"
echo "Testing against: $BASE_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local description=$2
    local expected_content_type=$3

    echo -n "Testing $description... "

    if response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" 2>&1); then
        http_code=$(echo "$response" | tail -n1)
        content=$(echo "$response" | head -n-1)

        if [ "$http_code" = "200" ]; then
            # Check if response has content
            if [ -n "$content" ]; then
                echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
                ((PASSED++))
                return 0
            else
                echo -e "${RED}✗ FAILED${NC} (Empty response)"
                ((FAILED++))
                return 1
            fi
        else
            echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
            ((FAILED++))
            return 1
        fi
    else
        echo -e "${RED}✗ FAILED${NC} (Connection error)"
        ((FAILED++))
        return 1
    fi
}

# Function to check XML validity
test_xml() {
    local endpoint=$1
    local description=$2

    echo -n "Validating $description XML... "

    if response=$(curl -s "$BASE_URL$endpoint" 2>&1); then
        if echo "$response" | xmllint --noout - 2>&1; then
            echo -e "${GREEN}✓ VALID XML${NC}"
            ((PASSED++))
            return 0
        else
            echo -e "${RED}✗ INVALID XML${NC}"
            ((FAILED++))
            return 1
        fi
    else
        echo -e "${RED}✗ FAILED${NC} (Connection error)"
        ((FAILED++))
        return 1
    fi
}

# Function to check JSON validity
test_json() {
    local endpoint=$1
    local description=$2

    echo -n "Validating $description JSON... "

    if response=$(curl -s "$BASE_URL$endpoint" 2>&1); then
        if echo "$response" | python3 -m json.tool > /dev/null 2>&1; then
            echo -e "${GREEN}✓ VALID JSON${NC}"
            ((PASSED++))
            return 0
        else
            echo -e "${RED}✗ INVALID JSON${NC}"
            ((FAILED++))
            return 1
        fi
    else
        echo -e "${RED}✗ FAILED${NC} (Connection error)"
        ((FAILED++))
        return 1
    fi
}

echo "=========================================="
echo "1. Testing Core SEO Endpoints"
echo "=========================================="
echo ""

test_endpoint "/sitemap.xml" "XML Sitemap" "application/xml"
test_endpoint "/feed.xml" "RSS Feed" "application/rss+xml"
test_endpoint "/atom.xml" "Atom Feed" "application/atom+xml"
test_endpoint "/opensearch.xml" "OpenSearch" "application/opensearchdescription+xml"
test_endpoint "/robots.txt" "Robots.txt" "text/plain"

echo ""
echo "=========================================="
echo "2. Testing Search API"
echo "=========================================="
echo ""

test_endpoint "/api/search?q=test" "Search API (basic query)" "application/json"
test_endpoint "/api/search?q=react&limit=5" "Search API (with limit)" "application/json"
test_endpoint "/api/search?q=next&type=post" "Search API (with type filter)" "application/json"

echo ""
echo "=========================================="
echo "3. Validating XML/JSON Formats"
echo "=========================================="
echo ""

# Check if xmllint is available
if command -v xmllint &> /dev/null; then
    test_xml "/sitemap.xml" "Sitemap"
    test_xml "/feed.xml" "RSS Feed"
    test_xml "/atom.xml" "Atom Feed"
    test_xml "/opensearch.xml" "OpenSearch"
else
    echo -e "${YELLOW}⚠ WARNING${NC}: xmllint not found, skipping XML validation"
    echo "  Install with: sudo apt-get install libxml2-utils (Ubuntu/Debian)"
fi

# Check if python3 is available for JSON validation
if command -v python3 &> /dev/null; then
    test_json "/api/search?q=test" "Search API"
else
    echo -e "${YELLOW}⚠ WARNING${NC}: python3 not found, skipping JSON validation"
fi

echo ""
echo "=========================================="
echo "4. Testing Structured Data on Pages"
echo "=========================================="
echo ""

# Test if pages contain structured data
echo -n "Checking homepage for structured data... "
if curl -s "$BASE_URL/" | grep -q "application/ld+json"; then
    echo -e "${GREEN}✓ FOUND${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ NOT FOUND${NC}"
    ((FAILED++))
fi

echo -n "Checking for WebSite schema on homepage... "
if curl -s "$BASE_URL/" | grep -q "\"@type\":\"WebSite\""; then
    echo -e "${GREEN}✓ FOUND${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ NOT FOUND${NC}"
    ((FAILED++))
fi

echo -n "Checking for Organization schema on homepage... "
if curl -s "$BASE_URL/" | grep -q "\"@type\":\"Organization\""; then
    echo -e "${GREEN}✓ FOUND${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ NOT FOUND${NC}"
    ((FAILED++))
fi

echo ""
echo "=========================================="
echo "5. Testing Meta Tags"
echo "=========================================="
echo ""

echo -n "Checking for canonical URL... "
if curl -s "$BASE_URL/" | grep -q "rel=\"canonical\""; then
    echo -e "${GREEN}✓ FOUND${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ NOT FOUND${NC}"
    ((FAILED++))
fi

echo -n "Checking for Open Graph tags... "
if curl -s "$BASE_URL/" | grep -q "property=\"og:title\""; then
    echo -e "${GREEN}✓ FOUND${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ NOT FOUND${NC}"
    ((FAILED++))
fi

echo -n "Checking for Twitter Card tags... "
if curl -s "$BASE_URL/" | grep -q "name=\"twitter:card\""; then
    echo -e "${GREEN}✓ FOUND${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ NOT FOUND${NC}"
    ((FAILED++))
fi

echo -n "Checking for RSS feed link... "
if curl -s "$BASE_URL/" | grep -q "type=\"application/rss+xml\""; then
    echo -e "${GREEN}✓ FOUND${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ NOT FOUND${NC}"
    ((FAILED++))
fi

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""

TOTAL=$((PASSED + FAILED))
PERCENTAGE=$((PASSED * 100 / TOTAL))

echo "Tests Passed: $PASSED/$TOTAL ($PERCENTAGE%)"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo ""
    echo "Your SEO implementation is working correctly!"
    echo ""
    echo "Next steps:"
    echo "1. Deploy to production"
    echo "2. Submit sitemap to Google Search Console"
    echo "3. Verify structured data with Rich Results Test"
    echo "4. Start creating great content!"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
    echo "Please review the failed tests above and fix any issues."
    echo ""
    echo "Common issues:"
    echo "- Development server not running (start with: npm run dev)"
    echo "- Database not populated (add some blog posts)"
    echo "- Build errors (check: npm run build)"
    echo ""
    exit 1
fi
