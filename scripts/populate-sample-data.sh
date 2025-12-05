#!/bin/bash
# Script to populate CRM with sample Atlantic Canada businesses and contacts

API_URL="http://localhost:3000/api"

echo "🏢 Creating sample businesses..."

# Nova Scotia Businesses
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Maritime Digital Solutions", "category": "Technology", "city": "Halifax", "province": "NS", "phone_raw": "(902) 555-0101", "email": "info@maritimedigital.ca", "latitude": 44.6488, "longitude": -63.5752}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Clearwater Seafoods", "category": "Fishing & Marine", "city": "Bedford", "province": "NS", "phone_raw": "(902) 555-0102", "email": "sales@clearwater.ca", "latitude": 44.7313, "longitude": -63.6567}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Halifax Harbour Tours", "category": "Tourism", "city": "Halifax", "province": "NS", "phone_raw": "(902) 555-0103", "latitude": 44.6453, "longitude": -63.5724}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Garrison Brewing Company", "category": "Brewery", "city": "Halifax", "province": "NS", "phone_raw": "(902) 555-0104", "email": "hello@garrisonbrewing.ca", "latitude": 44.6611, "longitude": -63.5902}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Lunenburg Foundry", "category": "Manufacturing", "city": "Lunenburg", "province": "NS", "phone_raw": "(902) 555-0105", "latitude": 44.3776, "longitude": -64.3093}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Cape Breton Coal Mining Museum", "category": "Tourism", "city": "Glace Bay", "province": "NS", "phone_raw": "(902) 555-0106", "latitude": 46.1968, "longitude": -59.9569}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Annapolis Valley Cider Co", "category": "Food & Beverage", "city": "Wolfville", "province": "NS", "phone_raw": "(902) 555-0107", "email": "orders@avcider.ca", "latitude": 45.0877, "longitude": -64.3638}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Dartmouth Ferry Service", "category": "Transportation", "city": "Dartmouth", "province": "NS", "phone_raw": "(902) 555-0108", "latitude": 44.6658, "longitude": -63.5669}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Bluewave Technologies", "category": "Technology", "city": "Halifax", "province": "NS", "phone_raw": "(902) 555-0109", "email": "contact@bluewave.tech", "latitude": 44.6476, "longitude": -63.5728}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Peggy\u0027s Cove Restaurant", "category": "Restaurant", "city": "Peggy\u0027s Cove", "province": "NS", "phone_raw": "(902) 555-0110", "latitude": 44.4914, "longitude": -63.9182}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Atlantic Veterinary College", "category": "Education", "city": "Truro", "province": "NS", "phone_raw": "(902) 555-0111", "latitude": 45.3689, "longitude": -63.2687}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Sobeys Head Office", "category": "Retail", "city": "Stellarton", "province": "NS", "phone_raw": "(902) 555-0112", "email": "corporate@sobeys.ca", "latitude": 45.5575, "longitude": -62.6603}' > /dev/null
echo "  ✓ 12 Nova Scotia businesses created"

# New Brunswick Businesses
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Irving Oil Limited", "category": "Energy", "city": "Saint John", "province": "NB", "phone_raw": "(506) 555-0201", "email": "info@irvingoil.com", "latitude": 45.2733, "longitude": -66.0633}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "McCain Foods", "category": "Food Processing", "city": "Florenceville-Bristol", "province": "NB", "phone_raw": "(506) 555-0202", "latitude": 46.4417, "longitude": -67.6148}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Moosehead Breweries", "category": "Brewery", "city": "Saint John", "province": "NB", "phone_raw": "(506) 555-0203", "email": "tours@moosehead.ca", "latitude": 45.2806, "longitude": -66.0569}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Fundy Trail Development", "category": "Tourism", "city": "St. Martins", "province": "NB", "phone_raw": "(506) 555-0204", "latitude": 45.3589, "longitude": -65.5336}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "New Brunswick Power", "category": "Utilities", "city": "Fredericton", "province": "NB", "phone_raw": "(506) 555-0205", "email": "service@nbpower.com", "latitude": 45.9636, "longitude": -66.6431}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Moncton Medical Clinic", "category": "Healthcare", "city": "Moncton", "province": "NB", "phone_raw": "(506) 555-0206", "latitude": 46.0878, "longitude": -64.7782}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Acadian Seaplants", "category": "Agriculture", "city": "Dartmouth", "province": "NB", "phone_raw": "(506) 555-0207", "latitude": 45.2800, "longitude": -66.0400}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Kings Landing Historical", "category": "Tourism", "city": "Prince William", "province": "NB", "phone_raw": "(506) 555-0208", "latitude": 45.8439, "longitude": -66.9103}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "UNB Research Centre", "category": "Education", "city": "Fredericton", "province": "NB", "phone_raw": "(506) 555-0209", "email": "research@unb.ca", "latitude": 45.9500, "longitude": -66.6400}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Bay Ferries", "category": "Transportation", "city": "Saint John", "province": "NB", "phone_raw": "(506) 555-0210", "latitude": 45.2700, "longitude": -66.0700}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Atlantic Superstore NB", "category": "Retail", "city": "Moncton", "province": "NB", "phone_raw": "(506) 555-0211", "latitude": 46.1000, "longitude": -64.8000}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Covered Bridge Chips", "category": "Food Processing", "city": "Waterville", "province": "NB", "phone_raw": "(506) 555-0212", "email": "info@coveredbridge.ca", "latitude": 46.3167, "longitude": -67.4500}' > /dev/null
echo "  ✓ 12 New Brunswick businesses created"

# Prince Edward Island Businesses
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "COWS Ice Cream", "category": "Food & Beverage", "city": "Charlottetown", "province": "PE", "phone_raw": "(902) 555-0301", "email": "moo@cows.ca", "latitude": 46.2382, "longitude": -63.1311}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Anne of Green Gables Store", "category": "Tourism", "city": "Cavendish", "province": "PE", "phone_raw": "(902) 555-0302", "latitude": 46.4950, "longitude": -63.3883}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "PEI Brewing Company", "category": "Brewery", "city": "Charlottetown", "province": "PE", "phone_raw": "(902) 555-0303", "email": "cheers@peibrewing.com", "latitude": 46.2400, "longitude": -63.1300}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Atlantic Wind Power", "category": "Energy", "city": "Summerside", "province": "PE", "phone_raw": "(902) 555-0304", "latitude": 46.3941, "longitude": -63.7872}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Island Coastal Services", "category": "Transportation", "city": "Wood Islands", "province": "PE", "phone_raw": "(902) 555-0305", "latitude": 45.9500, "longitude": -62.7500}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "UPEI Innovation", "category": "Education", "city": "Charlottetown", "province": "PE", "phone_raw": "(902) 555-0306", "email": "innovation@upei.ca", "latitude": 46.2589, "longitude": -63.1369}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Prince County Hospital", "category": "Healthcare", "city": "Summerside", "province": "PE", "phone_raw": "(902) 555-0307", "latitude": 46.4000, "longitude": -63.7900}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "PEI Mussel King", "category": "Fishing & Marine", "city": "Montague", "province": "PE", "phone_raw": "(902) 555-0308", "email": "sales@musselking.ca", "latitude": 46.1500, "longitude": -62.6500}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Confederation Bridge Tours", "category": "Tourism", "city": "Borden-Carleton", "province": "PE", "phone_raw": "(902) 555-0309", "latitude": 46.2519, "longitude": -63.7092}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Island Potato Farms", "category": "Agriculture", "city": "Kensington", "province": "PE", "phone_raw": "(902) 555-0310", "latitude": 46.4372, "longitude": -63.6364}' > /dev/null
echo "  ✓ 10 PEI businesses created"

# Newfoundland & Labrador Businesses
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Signal Hill Brewing", "category": "Brewery", "city": "St. John\u0027s", "province": "NL", "phone_raw": "(709) 555-0401", "email": "info@signalhillbrewing.com", "latitude": 47.5615, "longitude": -52.7126}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Iceberg Vodka Corp", "category": "Food & Beverage", "city": "St. John\u0027s", "province": "NL", "phone_raw": "(709) 555-0402", "latitude": 47.5700, "longitude": -52.7000}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Ocean Choice International", "category": "Fishing & Marine", "city": "St. John\u0027s", "province": "NL", "phone_raw": "(709) 555-0403", "email": "info@oceanchoice.com", "latitude": 47.5649, "longitude": -52.7093}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Gros Morne Adventures", "category": "Tourism", "city": "Norris Point", "province": "NL", "phone_raw": "(709) 555-0404", "latitude": 49.4667, "longitude": -57.8833}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Newfoundland Power", "category": "Utilities", "city": "St. John\u0027s", "province": "NL", "phone_raw": "(709) 555-0405", "email": "service@newfoundlandpower.com", "latitude": 47.5600, "longitude": -52.7100}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "MUN Ocean Sciences", "category": "Education", "city": "St. John\u0027s", "province": "NL", "phone_raw": "(709) 555-0406", "email": "oceansciences@mun.ca", "latitude": 47.5744, "longitude": -52.7344}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Corner Brook Pulp Mill", "category": "Manufacturing", "city": "Corner Brook", "province": "NL", "phone_raw": "(709) 555-0407", "latitude": 48.9500, "longitude": -57.9500}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Labrador Mining Corp", "category": "Mining", "city": "Labrador City", "province": "NL", "phone_raw": "(709) 555-0408", "latitude": 52.9500, "longitude": -66.9167}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Fogo Island Inn", "category": "Hospitality", "city": "Fogo Island", "province": "NL", "phone_raw": "(709) 555-0409", "email": "stay@fogoislandinn.ca", "latitude": 49.6167, "longitude": -54.1667}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "St. John\u0027s International Airport", "category": "Transportation", "city": "St. John\u0027s", "province": "NL", "phone_raw": "(709) 555-0410", "latitude": 47.6186, "longitude": -52.7519}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "Eastern Health", "category": "Healthcare", "city": "St. John\u0027s", "province": "NL", "phone_raw": "(709) 555-0411", "email": "info@easternhealth.ca", "latitude": 47.5700, "longitude": -52.7100}' > /dev/null
curl -s -X POST "$API_URL/businesses" -H "Content-Type: application/json" -d '{"name": "L\u0027Anse aux Meadows Historic Site", "category": "Tourism", "city": "St. Anthony", "province": "NL", "phone_raw": "(709) 555-0412", "latitude": 51.5892, "longitude": -55.5333}' > /dev/null
echo "  ✓ 12 Newfoundland businesses created"

echo ""
echo "📇 Creating sample contacts..."

# Get business IDs and add contacts
BUSINESSES=$(curl -s "$API_URL/businesses?pageSize=50" | grep -o '"id":"[^"]*"' | head -30 | cut -d'"' -f4)

i=1
for BIZ_ID in $BUSINESSES; do
    FIRST_NAMES=("Sarah" "Michael" "Jennifer" "David" "Emily" "Robert" "Amanda" "Christopher" "Jessica" "Daniel")
    LAST_NAMES=("MacDonald" "Smith" "LeBlanc" "Murphy" "Campbell" "Walsh" "MacLeod" "Power" "Chicken" "Chicken")
    POSITIONS=("CEO" "Manager" "Director" "Owner" "VP Sales" "Operations" "Marketing" "Finance" "HR" "IT")
    
    IDX=$((i % 10))
    FIRST="${FIRST_NAMES[$IDX]}"
    LAST="${LAST_NAMES[$IDX]}"
    POS="${POSITIONS[$IDX]}"
    
    curl -s -X POST "$API_URL/contacts" -H "Content-Type: application/json" \
        -d "{\"business_id\": \"$BIZ_ID\", \"first_name\": \"$FIRST\", \"last_name\": \"$LAST\", \"position\": \"$POS\", \"email\": \"${FIRST,,}.${LAST,,}@company.ca\", \"phone_raw\": \"(902) 555-${i}000\", \"is_primary\": true}" > /dev/null
    
    # Add a second contact to some businesses
    if [ $((i % 3)) -eq 0 ]; then
        IDX2=$(((i + 5) % 10))
        FIRST2="${FIRST_NAMES[$IDX2]}"
        LAST2="${LAST_NAMES[$IDX2]}"
        curl -s -X POST "$API_URL/contacts" -H "Content-Type: application/json" \
            -d "{\"business_id\": \"$BIZ_ID\", \"first_name\": \"$FIRST2\", \"last_name\": \"$LAST2\", \"position\": \"Assistant\", \"email\": \"${FIRST2,,}.${LAST2,,}@company.ca\", \"phone_raw\": \"(902) 555-${i}001\"}" > /dev/null
    fi
    
    i=$((i + 1))
done

echo "  ✓ ~40 contacts created"

echo ""
echo "📊 Creating sample interactions..."

# Add some interactions
for BIZ_ID in $(echo "$BUSINESSES" | head -10); do
    curl -s -X POST "$API_URL/interactions" -H "Content-Type: application/json" \
        -d "{\"business_id\": \"$BIZ_ID\", \"type\": \"call\", \"direction\": \"outbound\", \"subject\": \"Initial outreach\", \"notes\": \"Left voicemail, will follow up next week.\"}" > /dev/null
done

for BIZ_ID in $(echo "$BUSINESSES" | head -5); do
    curl -s -X POST "$API_URL/interactions" -H "Content-Type: application/json" \
        -d "{\"business_id\": \"$BIZ_ID\", \"type\": \"email\", \"direction\": \"inbound\", \"subject\": \"Partnership inquiry\", \"notes\": \"Interested in discussing collaboration opportunities.\"}" > /dev/null
done

for BIZ_ID in $(echo "$BUSINESSES" | head -3); do
    curl -s -X POST "$API_URL/interactions" -H "Content-Type: application/json" \
        -d "{\"business_id\": \"$BIZ_ID\", \"type\": \"meeting\", \"direction\": \"outbound\", \"subject\": \"Quarterly review\", \"notes\": \"Met with leadership team. Positive outlook for next quarter.\"}" > /dev/null
done

echo "  ✓ 18 interactions created"

echo ""
echo "✅ Sample data population complete!"
echo ""

# Show counts
echo "📈 Data Summary:"
curl -s "$API_URL/businesses" | grep -o '"count":[0-9]*' | head -1
echo ""
