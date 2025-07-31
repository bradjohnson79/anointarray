# ANOINT Array 🔮

Welcome to the official repository of the **ANOINT Array Generator** — an innovative platform for Scalar Energy Healing. This project powers the digital generation of personalized healing seals, integrating numerology, astrology, and ancient symbology.

## 🌟 Live Demo

Visit [anointarray.com](https://anointarray.com) to experience the live generator.

## 🧠 Features

- **Scalar-enhanced Seal Array Generation** - Custom metaphysical seals with personalized energy patterns
- **Aurora Background Effects** - Dynamic animated backgrounds across all pages
- **Supabase Authentication** - Secure member system with role-based access
- **Admin Dashboard** - Complete backend for user and VIP management
- **VIP Products System** - Exclusive Bio-Scalar technology waitlist
- **Contact Form Integration** - Email notifications via Edge Functions
- **Responsive Design** - Mobile-first approach with elegant UI/UX
- **Performance Optimized** - Lazy loading, code splitting, and service worker

## 🛠 Technologies

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Styling**: Tailwind CSS + Custom Aurora Animations
- **Icons**: Lucide React
- **Routing**: React Router v7
- **State Management**: React Context API + TanStack Query

## 📁 Project Structure

```
anoint-app/
├── src/
│   ├── components/       # Reusable components
│   ├── contexts/        # React contexts (Auth, Cart)
│   ├── pages/           # Route pages
│   │   ├── public/      # Public pages
│   │   ├── private/     # Protected user pages
│   │   └── admin/       # Admin-only pages
│   ├── lib/            # Utilities and helpers
│   └── types/          # TypeScript definitions
├── public/
│   └── images/         # Static assets
├── supabase/
│   ├── migrations/     # Database schemas
│   └── functions/      # Edge Functions
└── scripts/            # Utility scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bradjohnson79/anoint-array.git
   cd anoint-array/anoint-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Then edit `.env.local` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Run database migrations**
   
   In your Supabase dashboard SQL editor, run each file in `/supabase/migrations/` in order:
   - `001_create_orders_table.sql`
   - `002_performance_optimizations.sql`
   - `003_create_vip_waitlist.sql`
   - `004_create_user_profiles.sql`
   - `005_create_contact_submissions.sql`

5. **Create admin user**
   ```bash
   npm run seed-admin
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

   Visit http://localhost:5173

## 🔐 Default Admin Login

- **Username**: `info@anoint.me`
- **Password**: `Admin123`

⚠️ **Important**: Change the admin password after first login!

## 📱 Key Pages

- `/` - Home page with product showcase
- `/anoint-array` - Array Generator information
- `/vip-products` - Exclusive Bio-Scalar Vest waitlist
- `/products` - Product catalog
- `/contact` - Contact form
- `/auth` - Login/Signup
- `/admin/*` - Admin dashboard (requires admin role)

## 🎨 Features Showcase

### Aurora Backgrounds
- Dynamic animated effects on all pages
- Multiple intensity variants (subtle, default, intense, home)
- Responsive particle systems and geometric shapes

### VIP System
- Email waitlist for exclusive products
- Admin dashboard for subscriber management
- Automated email confirmations

### Contact System
- Spam-protected contact form
- Email notifications via Supabase Edge Functions
- Admin tracking and response management

## 🔧 Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run seed-admin # Create admin user
```

## 🚢 Deployment

### Vercel (Recommended)
1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Netlify
1. Connect GitHub repo
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🙏 Acknowledgments

- Built with ❤️ by Brad Johnson
- Powered by [Supabase](https://supabase.com)
- UI components from [Tailwind CSS](https://tailwindcss.com)
- Icons by [Lucide](https://lucide.dev)

## 📞 Support

For support, email info@anoint.me or visit our [contact page](https://anointarray.com/contact).

## 🔮 About ANOINT

ANOINT Array is pioneering the intersection of ancient wisdom and modern technology, creating tools for energy healing and personal transformation through scalar field technology.

---

**Live Site**: [anointarray.com](https://anointarray.com)  
**Documentation**: [View Setup Guide](./SUPABASE-SETUP-GUIDE.md)
