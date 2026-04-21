#!/bin/bash

echo "🚀 Restaurant SaaS Setup Script"
echo "================================"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+"
    exit 1
fi

echo "✅ Node.js $(node -v) found"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker not found. Install Docker for containerized setup."
else
    echo "✅ Docker found"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Setup environment files
echo ""
echo "⚙️  Setting up environment files..."

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
else
    echo "⚠️  backend/.env already exists"
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env"
else
    echo "⚠️  frontend/.env already exists"
fi

# Setup database with Docker
echo ""
echo "🐘 Starting PostgreSQL and Redis with Docker..."

if command -v docker &> /dev/null; then
    docker-compose up -d postgres redis
    echo "✅ Database services started"
    
    # Wait for PostgreSQL
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    # Run migrations
    echo "🔄 Running database migrations..."
    cd backend
    npx prisma generate
    npx prisma migrate dev --name init
    cd ..
    
    echo "✅ Database setup complete"
else
    echo "⚠️  Docker not available. Please setup PostgreSQL and Redis manually."
    echo "   PostgreSQL: postgresql://restaurant:restaurant123@localhost:5432/restaurant_saas"
    echo "   Redis: redis://localhost:6379"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Edit backend/.env with your configuration"
echo "   2. Run 'npm run dev' to start all services"
echo "   3. Backend: http://localhost:3000"
echo "   4. Frontend: http://localhost:5173"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Overview"
echo "   - ARCHITECTURE.md - System design"
echo "   - API.md - API documentation"
echo "   - DEPLOYMENT.md - Deployment guide"
echo ""
