# SyndetAI - AI-Powered Report Generation Platform

SyndetAI is a comprehensive web application built with Next.js that provides AI-powered report generation services. Users can submit company information and documents to generate detailed analysis reports.

## 🚀 Website Flow & User Journey

### 1. **Authentication Flow**
- **Entry Point**: Root redirects to `/login` (`src/app/page.js`)
- **Login Screen**: Magic link authentication via email (`src/components/LoginScreen.js`)
- **User Verification**: Checks against `app_users` table in Supabase
- **Session Management**: Automatic session handling and redirect to dashboard

### 2. **Main Dashboard Flow**
- **Dashboard**: Main application interface (`src/components/App.js`)
- **Navigation**: Sidebar with main sections (`src/components/Sidebar.js`)
- **Mobile Support**: Responsive mobile header (`src/components/MobileHeader.js`)

### 3. **Core Functionalities**

#### 📊 **Library/Previous Submissions** (`src/components/PreviousSubmissions.js`)
- View all previously submitted reports
- Search and filter submissions
- Preview reports in modal (`src/components/ReportPreviewModal.js`)
- Download completed reports
- Track submission status and queue position

#### 📝 **New Report Request** (`src/components/RequestNewReport.js`)
- Submit company information (name, website)
- Upload supporting documents (`src/components/ImageUpload.js`)
- Credit-based pricing system (10 credits without files, 15 with files)
- Real-time credit validation
- Confirmation modal before submission (`src/components/ConfirmModal.js`)

#### 👥 **Account Management** (`src/components/ManageAccount.js`)
- View organization users
- Invite new team members (`src/lib/invite.js`)
- Manage user permissions
- View transaction history (`src/components/TransactionsTable.js`)

#### 💳 **Add Credits** (`src/components/AddCredits.js`)
- Purchase credits using Stripe payment integration
- Multiple credit packages available
- Secure payment processing
- Real-time credit updates

#### 🔧 **Super Admin Panel** (`src/app/superadmin/page.js`)
- Advanced administrative controls
- System-wide user management
- Organization oversight
- Advanced reporting and analytics

## 🏗️ Technical Architecture

### **Frontend Structure**
```
src/
├── app/                    # Next.js App Router pages
│   ├── page.js            # Root redirect to login
│   ├── login/page.js      # Login page
│   ├── library/page.js    # Library page
│   ├── new-request/page.js # New request page
│   ├── manage-account/page.js # Account management
│   ├── add-credits/page.js # Add credits page
│   ├── superadmin/page.js # Super admin panel
│   └── api/               # API routes
│       ├── invite/accept/route.js
│       └── payments/      # Payment processing
├── components/            # React components
│   ├── App.js            # Main application component
│   ├── LoginScreen.js    # Authentication interface
│   ├── RequestNewReport.js # Report submission form
│   ├── PreviousSubmissions.js # Report library
│   ├── ManageAccount.js  # User management
│   ├── AddCredits.js     # Payment interface
│   ├── Sidebar.js        # Navigation sidebar
│   ├── MobileHeader.js   # Mobile navigation
│   └── theme/           # Theme provider
├── context/              # React context
│   └── AppContext.js    # Global state management
└── lib/                 # Utility libraries
    └── invite.js        # Invitation system
```

### **Backend Services**
```
supabase/functions/
├── report-processing/index.ts      # Main report processing
├── report-processor-fresh/index.ts  # Fresh report processor
├── report-upload-handler/index.ts   # File upload handling
└── delete-orphaned-auth-users/index.ts # User cleanup
```

## 🔧 Key Features

### **Authentication & Security**
- Magic link authentication via Supabase Auth
- User invitation system with email verification
- Role-based access control (Admin, Super Admin)
- Session management and automatic redirects

### **Report Generation**
- AI-powered document analysis
- Multiple file format support
- Queue-based processing system
- Real-time status updates
- Credit-based pricing model

### **Payment Integration**
- Stripe payment processing
- Secure credit card handling
- Multiple credit packages
- Transaction history tracking

### **User Management**
- Organization-based user grouping
- Team member invitations
- Permission management
- User activity tracking

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account
- Stripe account (for payments)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd syndetai-parthaa
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Environment Setup**
Create a `.env.local` file with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

4. **Run the development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```





## 🔄 Data Flow
1. **User Authentication** → Supabase Auth → Session Management
2. **Report Submission** → File Upload → Queue Processing → AI Analysis
3. **Payment Processing** → Stripe Integration → Credit Updates
4. **User Management** → Invitation System → Role Assignment




