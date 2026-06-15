#!/bin/bash

# LibertyPath Backend Setup Script
# This script helps set up the backend environment

echo "🚀 LibertyPath Backend Setup"
echo "============================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ .env file created. Please update it with your configuration."
    else
        echo "❌ .env.example not found!"
        exit 1
    fi
else
    echo "✅ .env file already exists"
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Check PostgreSQL connection
echo ""
echo "🔍 Checking database connection..."
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-libertypath}
DB_USER=${DB_USER:-postgres}

if command -v psql &> /dev/null; then
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1" &> /dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Database connection successful"
        
        # Check if database exists
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "\l" | grep -q $DB_NAME
        if [ $? -ne 0 ]; then
            echo "📊 Creating database..."
            PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"
            echo "✅ Database created"
        else
            echo "✅ Database already exists"
        fi
    else
        echo "⚠️  Could not connect to database. Please check your .env configuration."
    fi
else
    echo "⚠️  psql not found. Please install PostgreSQL client tools."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your configuration"
echo "2. Run migrations: npm run migrate"
echo "3. Seed data: npm run seed"
echo "4. Start server: npm run dev"

