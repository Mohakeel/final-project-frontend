#!/bin/bash
# Quick seed script for Unix/Linux/Mac

echo "🌱 CertiVerify Database Seeding"
echo "================================"
echo ""

if [ "$1" == "--clear" ]; then
    echo "⚠️  WARNING: This will DELETE all existing data!"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" == "yes" ]; then
        python seed_database.py --clear
    else
        echo "❌ Seeding cancelled"
    fi
else
    python seed_database.py
fi
