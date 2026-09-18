# 🚀 QUICK REFERENCE - ORDERING SYSTEM URLS

## ⭐ MAIN ORDERING PAGES

### 1. Order Placement
```
Pharmacy:   http://localhost:5174/pharmacy/order
Hospital:   http://localhost:5174/hospital/order
```
**What to do:**
- Browse medicines
- Add to cart
- Enter delivery address
- Place order

---

### 2. Order Tracking (Real-time)
```
URL: http://localhost:5174/orders
```
**What to see:**
- Your orders
- Real-time status
- Progress bar
- Delivery location
- Delivery person info
- Order timeline

---

### 3. Manufacturer Orders Processing
```
URL: http://localhost:5174/manufacturer/orders
```
**What to do:**
- View incoming orders
- Confirm order
- Start processing
- Mark ready for dispatch

---

### 4. Distributor Order Processing
```
URL: http://localhost:5174/distributor/orders
```
**What to do:**
- View orders from manufacturer
- Receive & verify
- Assign delivery staff
- Dispatch orders

---

### 5. Admin Order Management
```
URL: http://localhost:5174/admin/orders
```
**What to see:**
- System-wide orders
- KPI analytics
- Charts & trends
- Top customers
- Performance metrics

---

## 🔐 AUTHENTICATION PAGES

```
Login:         http://localhost:5174/login
Register:      http://localhost:5174/register
Forgot Pass:   http://localhost:5174/forgot-password
Role Select:   http://localhost:5174/get-started
```

---

## 👤 DEMO ACCOUNT CREDENTIALS

### Login Credentials:
| Email | Password | Role |
|-------|----------|------|
| `pharmacy@test.com` | `password` | Pharmacy |
| `hospital@test.com` | `password` | Hospital |
| `customer@test.com` | `password` | Customer |
| `manufacturer@test.com` | `password` | Manufacturer |
| `distributor@test.com` | `password` | Distributor |
| `warehouse@test.com` | `password` | Warehouse Manager |
| `delivery@test.com` | `password` | Delivery Staff |
| `admin@test.com` | `password` | Admin |

**All Passwords:** `password`

---

## 📱 OTHER ROLE DASHBOARDS

### Pharmacy Dashboard
```
URL: http://localhost:5174/pharmacy
```
- Dashboard with KPIs
- Orders section
- Inventory management

### Hospital Dashboard
```
URL: http://localhost:5174/hospital
```
- Dashboard with KPIs
- Orders section
- Inventory management

### Manufacturer Dashboard
```
URL: http://localhost:5174/manufacturer
```
- Dashboard with KPIs
- Orders section
- Drug management
- Batch tracking

### Distributor Dashboard
```
URL: http://localhost:5174/distributor
```
- Dashboard with KPIs
- Orders section
- Inventory management

### Warehouse Dashboard
```
URL: http://localhost:5174/warehouse
```
- Dashboard with KPIs
- Inventory management

### Delivery Dashboard
```
URL: http://localhost:5174/delivery
```
- Dashboard with KPIs
- Assigned deliveries

### Admin Dashboard
```
URL: http://localhost:5174/admin
```
- Main dashboard with 15 KPIs
- 3 charts
- Quick actions

---

## 📚 DOCUMENTATION PAGES

### Ordering System Guide
```
File: ORDERING_SYSTEM.md
Read this for:
- Complete workflow documentation
- All features explained
- Business processes
- Database schema
```

### Getting Started Guide
```
File: GETTING_STARTED.md
Read this for:
- Quick start instructions
- Testing procedures
- Step-by-step tutorials
- Feature overview
```

### Completion Guide
```
File: COMPLETION_GUIDE.md
Read this for:
- What was built
- How it works
- Design system
- Next steps
```

### Project Summary
```
File: PROJECT_SUMMARY.md
Read this for:
- Project overview
- Completion status
- Feature list
- Technical stack
```

### System Architecture
```
File: SYSTEM_ARCHITECTURE.md
Read this for:
- Complete system design
- All 8 modules
- Database structure
- Security details
```

---

## 🧪 TESTING WORKFLOW

### Test Complete Order Flow:

**Step 1: Place Order**
```
1. Go to: /pharmacy/order
2. Add 2x Amoxicillin + 1x Paracetamol to cart
3. Enter address: "4th Floor, Silver Plaza, MG Road"
4. Click "Place Order"
5. Note order number: ORD-xxxxx
```

**Step 2: Track Order**
```
1. Go to: /orders
2. See order status: PENDING
3. See progress: 0%
4. Note the order timeline
```

**Step 3: Process as Manufacturer**
```
1. Logout and login as manufacturer@test.com
2. Go to: /manufacturer/orders
3. See your order in "Pending Orders"
4. Click "Take Action"
5. Click "Confirm Order" → CONFIRMED
6. Click "Take Action" again
7. Click "Start Processing" → PROCESSING
8. Click "Take Action" again
9. Click "Mark Ready for Dispatch" → READY_FOR_DISPATCH
```

**Step 4: Check Status**
```
1. Logout and login as pharmacy@test.com
2. Go to: /orders
3. See order status updated to: PROCESSING
4. See progress: 50%
```

**Step 5: Dispatch as Distributor**
```
1. Logout and login as distributor@test.com
2. Go to: /distributor/orders
3. See order in "Incoming" section
4. Click "Take Action"
5. Click "Receive Order" → RECEIVED
6. Click "Take Action" again
7. Click "Mark Ready for Dispatch" → READY_FOR_DISPATCH
8. Click "Take Action" again
9. Select "Kiran Shah" from dropdown
10. Order status → DISPATCHED
```

**Step 6: Track Final Status**
```
1. Logout and login as pharmacy@test.com
2. Go to: /orders
3. See order status: DISPATCHED
4. See progress: 85%
5. See delivery person: "Kiran Shah"
```

**Step 7: Admin View**
```
1. Logout and login as admin@test.com
2. Go to: /admin/orders
3. See all orders with analytics
4. View KPI cards
5. See charts and trends
6. View top customers table
```

---

## 🎯 KEY URL PATTERNS

### Pharmacy/Hospital Flow:
```
/pharmacy/order           ← Place order
/orders                   ← Track order
```

### Manufacturer Flow:
```
/manufacturer             ← Dashboard
/manufacturer/orders      ← Process orders
/manufacturer/my-drugs    ← Drug management
/manufacturer/batches     ← Batch tracking
```

### Distributor Flow:
```
/distributor              ← Dashboard
/distributor/orders       ← Process orders
/distributor/inventory    ← Stock management
```

### Delivery Flow:
```
/delivery                 ← Dashboard
```

### Admin Flow:
```
/admin                    ← Dashboard
/admin/orders             ← Order management ← NEW!
/admin/users              ← User management
/admin/drugs              ← Drug management
/admin/categories         ← Categories
/admin/batches            ← Batch management
/admin/inventory          ← Inventory
```

---

## 🔥 HOTLINKS TO TEST IMMEDIATELY

### For Quick Testing:
1. **Order Placement:** `http://localhost:5174/pharmacy/order`
2. **Order Tracking:** `http://localhost:5174/orders`
3. **Manufacturer:** `http://localhost:5174/manufacturer/orders`
4. **Distributor:** `http://localhost:5174/distributor/orders`
5. **Admin Analytics:** `http://localhost:5174/admin/orders`

---

## 💡 TROUBLESHOOTING URLS

### If App Won't Load:
```
1. Check server is running:
   npm run dev
2. Try http://localhost:5174/ (home)
3. If port 5174 in use, try 5175
4. Check browser console for errors
```

### If Login Doesn't Work:
```
1. Use demo account: pharmacy@test.com / password
2. Make sure VITE_DEMO_MODE=true in .env
3. Clear browser cache
4. Check AuthContext is working
```

### If Order Won't Save:
```
1. Check browser console (F12)
2. Verify Firestore is configured
3. Or use demo mode (no Firebase needed)
4. Check Firebase credentials in .env
```

---

## 📊 SAMPLE DATA PREVIEW

### Available Test Medicines:
```
1. Amoxicillin 500mg - ₹45
   Stock: 150 | Manufacturer: Mehta Pharma

2. Paracetamol 650mg - ₹30
   Stock: 200 | Manufacturer: Global Health

3. Ibuprofen 400mg - ₹35
   Stock: 175 | Manufacturer: Generic Pharma

4. Aspirin 75mg - ₹15
   Stock: 300 | Manufacturer: Mehta Pharma

5. Ciprofloxacin 500mg - ₹65
   Stock: 120 | Manufacturer: Generic Pharma
```

### Sample Orders:
```
Order 1: ORD-1725263400001 (PENDING)
  From: Mehta Pharma Labs
  To: Nair Care Pharmacy
  Amount: ₹102

Order 2: ORD-1725260800002 (RECEIVED)
  From: Global Health Pharma
  To: CityCare Hospital
  Amount: ₹164

Order 3: ORD-1725248400003 (DISPATCHED)
  From: Generic Pharma
  To: Wellness Medical Store
  Amount: ₹650
```

---

## 🎮 INTERACTIVE FEATURES TO TEST

### Drag & Drop:
- ❌ Not implemented yet (order by clicking buttons)

### Search:
- ✅ Search medicines by name
- Try: "Amoxicillin" in OrderPlacement

### Filters:
- ✅ Filter orders by status
- Try: Click "Pending" button to filter

### Charts:
- ✅ Hover over bars/lines in charts
- ✅ Pie chart shows status distribution
- ✅ Bar chart shows weekly trends

### Modals:
- ✅ Click "Take Action" to open modal
- ✅ Click outside to close
- ✅ Actions update status instantly

### Toast Notifications:
- ✅ Appears after order placed
- ✅ Appears after status updated
- ✅ Auto-dismisses after 3 seconds

---

## ⚙️ DEV SERVER COMMANDS

### Start Development Server:
```bash
npm run dev
```
**Output:** Server running on http://localhost:5174

### Build for Production:
```bash
npm run build
```
**Output:** Optimized build in dist/ folder

### Preview Production Build:
```bash
npm run preview
```
**Output:** Preview at http://localhost:5174

---

## 📱 MOBILE TESTING URLS

All URLs work on mobile/tablet at:
```
http://localhost:5174/[path]
```

**From mobile device on same network:**
```
http://[YOUR-PC-IP]:5174/[path]
```

Find your PC IP:
```powershell
ipconfig | findstr "IPv4"
```

---

## ✨ HIDDEN FEATURES TO DISCOVER

1. **Expandable Orders** - Click on order card to expand
2. **Progress Visualization** - See 0-100% progress bar
3. **Delivery Timeline** - See order history with timestamps
4. **KPI Cards** - Click cards to see more details (placeholder)
5. **Charts** - Interactive tooltips on hover
6. **Filter Buttons** - Click to filter by status
7. **Toast Notifications** - Auto-dismiss notifications
8. **Modal Dialogs** - Beautiful action confirmations

---

## 🎯 WHAT TO CLICK

### On Order Placement Page:
- Click medicine card → Add to cart
- Click +/- buttons → Adjust quantity
- Click X button → Remove from cart
- Click "Checkout" → Place order modal
- Enter address → Type address
- Click "Place Order" → Create order

### On Order Tracking Page:
- Click order card → Expand details
- See status badge → Shows current status
- See progress bar → Shows completion %
- See timeline → Shows order history

### On Manufacturer Orders Page:
- Click filter buttons → Filter by status
- Click order card → Expand to see items
- Click "Take Action" → Open action modal
- Click action button → Update status
- Click close → Close modal

### On Distributor Orders Page:
- Click filter buttons → Filter by status
- Click "Take Action" → Open action modal
- Click "Take Action" → Open confirmation
- Select dropdown → Choose delivery staff
- Click option → Assign staff & update status

### On Admin Orders Page:
- View KPI cards → See key metrics
- View charts → See trends and distribution
- View top customers table → See best customers
- Hover over chart → See interactive tooltips

---

## 🎉 YOU'RE ALL SET!

**Ready to test? Pick a URL and get started:**

1. **Just want to order?**
   → Go to `/pharmacy/order`

2. **Want to track delivery?**
   → Go to `/orders`

3. **Want to process orders?**
   → Go to `/manufacturer/orders`

4. **Want to dispatch?**
   → Go to `/distributor/orders`

5. **Want to see analytics?**
   → Go to `/admin/orders`

**Happy testing! 🚀**

---

**Last Updated:** September 2, 2026  
**Status:** ✅ All URLs working  
**Server:** ✅ Running on port 5174  
