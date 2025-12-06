# 🏢 Atlantic Canada Business CRM

A modern, full-featured Customer Relationship Management system built specifically for managing business data across Atlantic Canada (Nova Scotia, New Brunswick, Prince Edward Island, and Newfoundland & Labrador).

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-3FCF8E?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss)

---

## ✨ Features

### 📊 Dashboard
- Real-time statistics overview (businesses, contacts, interactions)
- Province breakdown with clickable filters
- Recently added businesses
- Quick action shortcuts

### 🏬 Business Management
- **Full CRUD operations** for businesses
- **Advanced filtering** with 15+ filter options:
  - Multiple provinces, statuses, sources, and size bands
  - Date ranges (created & last interaction)
  - Data quality filters (has email, phone, website, coordinates)
  - NAICS code, city, and category search
  - Tag-based filtering
- **Quick Add Modal** for rapid data entry
- **Table & Card view** toggle
- Pagination with 20 records per page
- Soft delete support

### 👥 Contact Management
- Link contacts to businesses
- Track primary contacts
- Store position, email, and phone information

### 💬 Interaction Tracking
- Log calls, emails, meetings, and notes
- Track direction (inbound/outbound/internal)
- Associate interactions with specific contacts

### 🗺️ Map View
- Interactive Leaflet map showing all businesses
- Geocoded business locations
- Click markers to view business details

### 🏷️ Tags Management
- Create custom tags with colors
- Apply multiple tags to businesses
- Filter businesses by tags

### 📥 Data Import/Export
- **CSV Import** with field mapping
- **CSV Export** with custom filters
- Bulk data operations

### 🔍 Global Search
- Search across all businesses
- Real-time results
- Quick navigation

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **UI Library** | [React 19](https://react.dev/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **Maps** | [Leaflet](https://leafletjs.com/) + [React Leaflet](https://react-leaflet.js.org/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Forms** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| **Phone Parsing** | [libphonenumber-js](https://gitlab.com/nickcox/libphonenumber-js) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (or use development mode)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd crm
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

### Development Mode

To intentionally run without Supabase, set `NEXT_PUBLIC_DEV_MODE=true` in `.env.local`. When this flag is present and Supabase credentials are missing, the app uses the local JSON file storage in `.dev-data/`. Only enable this in local development—never in production—because authentication is bypassed.

---

## 📁 Project Structure

```
crm/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes
│   │   ├── businesses/     # Business CRUD endpoints
│   │   ├── contacts/       # Contact endpoints
│   │   ├── interactions/   # Interaction endpoints
│   │   ├── tags/           # Tags endpoints
│   │   ├── search/         # Global search
│   │   └── export/         # CSV export
│   ├── businesses/         # Business pages
│   │   ├── [id]/           # Business detail & edit
│   │   ├── new/            # Create business
│   │   └── page.tsx        # Business list
│   ├── contacts/           # Contacts list page
│   ├── map/                # Map view page
│   ├── tags/               # Tags management page
│   ├── import/             # CSV import page
│   ├── export/             # Export page
│   ├── login/              # Authentication
│   └── page.tsx            # Dashboard
├── components/             # React components
│   ├── AdvancedFilters.tsx # Multi-criteria filter panel
│   ├── QuickAddModal.tsx   # Quick business creation
│   ├── ContactModal.tsx    # Contact editor
│   ├── InteractionModal.tsx# Interaction logger
│   ├── GlobalSearch.tsx    # Search overlay
│   ├── Sidebar.tsx         # Navigation sidebar
│   ├── BusinessMap.tsx     # Leaflet map component
│   └── TagsManager.tsx     # Tag CRUD component
├── lib/                    # Utilities & configuration
│   ├── supabase/           # Supabase client setup
│   ├── utils/              # Helper functions
│   ├── types.ts            # TypeScript interfaces
│   ├── validations.ts      # Zod schemas
│   ├── config.ts           # App configuration
│   └── dev-store.ts        # Local JSON storage (dev mode)
├── supabase/               # Database migrations
└── public/                 # Static assets
```

---

## 🗄️ Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `businesses` | Core business records with full contact info |
| `contacts` | People associated with businesses |
| `interactions` | Communication history (calls, emails, meetings) |
| `tags` | Custom labels for categorization |
| `business_tags` | Many-to-many relationship |
| `import_jobs` | CSV import tracking |

### Business Status Types
- `active` - Currently operating
- `inactive` - Temporarily closed
- `do_not_contact` - Marked as DNC
- `bad_data` - Invalid or outdated info
- `duplicate` - Duplicate entry

### Business Sources
- `manual` - Manually entered
- `csv_import` - Imported from CSV
- `api_import` - Via API integration
- `scraper` - Web scraping
- `other` - Other sources

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 🌐 API Endpoints

### Businesses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/businesses` | List businesses (with pagination & filters) |
| POST | `/api/businesses` | Create a business |
| GET | `/api/businesses/[id]` | Get business details |
| PATCH | `/api/businesses/[id]` | Update business |
| DELETE | `/api/businesses/[id]` | Soft delete business |

### Contacts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contacts` | List all contacts |
| POST | `/api/contacts` | Create a contact |
| PATCH | `/api/contacts/[id]` | Update contact |
| DELETE | `/api/contacts/[id]` | Delete contact |

### Tags
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tags` | List all tags |
| POST | `/api/tags` | Create a tag |
| DELETE | `/api/tags/[id]` | Delete tag |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search?q=` | Global search |
| GET | `/api/export` | Export to CSV |

---

## 🎨 UI Features

- **Dark theme** with modern glassmorphism design
- **Responsive layout** for all screen sizes
- **Smooth animations** and transitions
- **Accessible** form components
- **Toast notifications** for actions

---

## 📜 License

This project is private and proprietary.

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

---

Built with ❤️ for Atlantic Canada businesses
