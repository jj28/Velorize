#!/bin/bash

# Get auth token
echo "=== Getting Auth Token ==="
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login/json \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

echo "Token: ${TOKEN:0:50}..."
echo ""

# Test endpoints
echo "=== Testing API Endpoints ==="
echo ""

echo "1. Dashboard Overview:"
curl -s -X GET "http://localhost:8000/api/v1/dashboard/overview" \
  -H "Authorization: Bearer $TOKEN" | head -100
echo -e "\n---\n"

echo "2. Products List:"
curl -s -X GET "http://localhost:8000/api/v1/products/?skip=0&limit=5" \
  -H "Authorization: Bearer $TOKEN" | head -50
echo -e "\n---\n"

echo "3. Customers List:"
curl -s -X GET "http://localhost:8000/api/v1/customers/?skip=0&limit=5" \
  -H "Authorization: Bearer $TOKEN" | head -50
echo -e "\n---\n"

echo "4. Suppliers List:"
curl -s -X GET "http://localhost:8000/api/v1/suppliers/?skip=0&limit=5" \
  -H "Authorization: Bearer $TOKEN" | head -50
echo -e "\n---\n"

echo "5. Users List:"
curl -s -X GET "http://localhost:8000/api/v1/users/" \
  -H "Authorization: Bearer $TOKEN" | head -50
echo -e "\n---\n"

echo "6. Inventory List:"
curl -s -X GET "http://localhost:8000/api/v1/inventory/?skip=0&limit=5" \
  -H "Authorization: Bearer $TOKEN" | head -50
echo -e "\n---\n"

echo "Test complete!"
