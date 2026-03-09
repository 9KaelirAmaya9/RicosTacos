# La Taco Atelier - Restaurant Ordering System

A full-stack restaurant ordering platform built with React, TypeScript, Supabase, and Stripe.

## 🚀 Features

- **Menu Browsing**: Browse menu items with filtering and search
- **Cart Management**: Add, update, and manage cart items
- **Order Processing**: Place orders for pickup or delivery
- **Payment Integration**: Secure Stripe payment processing
- **Real-time Updates**: Live order updates for kitchen and admin
- **Role-Based Access**: Admin and kitchen staff dashboards
- **Delivery Validation**: Geospatial validation for 15-minute delivery zones
- **Multi-language**: English and Spanish support

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Payments**: Stripe
- **Maps**: Mapbox (geocoding and directions)
- **State Management**: React Context, React Query
- **Routing**: React Router v6

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Stripe account
- Mapbox account (for delivery validation)

## 🔧 Setup

```sh
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Add your Supabase and Stripe keys to .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📚 Documentation

- **[Comprehensive Testing Report](./COMPREHENSIVE_TESTING_REPORT.md)** - Full QA documentation
- **[Testing Checklist](./TESTING_CHECKLIST.md)** - Testing checklist
- **[Geospatial Validation](./GEOSPATIAL_VALIDATION.md)** - Delivery zone validation

## 🧪 Testing

### Manual Testing
See [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) for complete testing procedures.

### Key Test Areas
1. **Functionality**: All user flows and edge cases
2. **Performance**: Load times, responsiveness, optimization
3. **Security**: Authentication, authorization, data protection
4. **Compatibility**: Cross-browser and device testing
5. **Error Handling**: Network errors, validation, edge cases
6. **User Experience**: Navigation, feedback, accessibility

## 🔒 Security

- Row Level Security (RLS) on all database tables
- Input validation with Zod schemas
- XSS and SQL injection prevention
- Secure payment processing via Stripe
- Role-based access control
- Protected routes for admin/kitchen

## 📱 Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🚀 Deployment

The project is configured for deployment on:
- Lovable platform
- Vercel
- Netlify
- Any static hosting service

## 📖 Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React contexts (Cart, Language)
├── hooks/          # Custom React hooks
├── integrations/   # Supabase client and types
├── pages/          # Page components
├── utils/          # Utility functions
└── data/           # Static data (menu, translations)
```

## 🐛 Troubleshooting

See [COMPREHENSIVE_TESTING_REPORT.md](./COMPREHENSIVE_TESTING_REPORT.md) section 8.4 for troubleshooting guide.

## 📝 License

Private project - All rights reserved

## 👥 Support

For issues or questions, refer to the documentation files or contact the development team.
