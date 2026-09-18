# DrugTrack

Real-Time Smart Drug Inventory and Pharmaceutical Supply Chain Tracking System — **“Track Every Dose. Trace Every Journey.”**

## Stack

React + Vite, Tailwind CSS, Firebase Authentication, Cloud Firestore, Firebase Storage, Firebase Hosting, and Firebase Cloud Functions. MongoDB, MongoDB Atlas, Mongoose, and Express are not used.

## Roles

`ADMIN`, `MANUFACTURER`, `WAREHOUSE_MANAGER`, `DISTRIBUTOR`, `PHARMACY`, `HOSPITAL`, `DELIVERY_STAFF`, and `CUSTOMER`. Public registration deliberately excludes `ADMIN` and `DELIVERY_STAFF`; create sensitive staff accounts securely through Firebase Admin SDK/Cloud Functions or the Firebase console.

## Firebase setup

1. Create a Firebase project and register a Web app.
2. Enable **Email/Password** in Authentication.
3. Create Firestore (production mode) and Storage.
4. Copy `.env.example` to `.env`, then add the exact client values from Firebase project settings.
5. Install Firebase CLI, set the real project ID in `.firebaserc`, then deploy with `firebase deploy --only firestore:rules,firestore:indexes,hosting`.

The application intentionally disables login and registration until configuration exists; it never substitutes fake credentials or data.

## First admin setup

Public registration can never create an administrator. Create the first account in Firebase Authentication, then use the Firebase Admin SDK from a trusted local script or Cloud Function to write `users/{uid}` with `role: 'ADMIN'`, `status: 'ACTIVE'`, the required identity fields, and server timestamps. Run this only with service-account credentials outside the frontend; never add an admin email, password, or service-account JSON to this repository. After the profile exists, deployed Firestore rules permit that administrator to approve organizations.

Organization document IDs equal the Firebase Auth UID (`userId`). Therefore, `manufacturerId` on drugs/batches and `ownerId` on inventory are consistently that organization UID, which makes both client queries and rules ownership checks unambiguous.

## Local development

```bash
npm install
npm run dev
npm run build
```

## Deployment

Install the Firebase CLI, authenticate, set the real project ID in `.firebaserc`, and deploy from this project root:

```bash
npm run build
cd functions && npm install && cd ..
firebase deploy --only firestore:rules,firestore:indexes,functions,hosting
```

The callable `createOrder` Function is the production checkout boundary: it authenticates the customer, reads the stored cart/inventory/drug documents, calculates trusted prices, reserves inventory in a transaction, creates the order, clears the cart, and writes notification/audit records. Deploy Functions before enabling checkout in production.

`syncCatalogue` keeps the public `catalogue` collection synchronized from private inventory records. Only this read-safe projection is exposed to public medicine browsing; organization inventory remains private. The Functions package also contains controlled order-status, shipment, and tracking operations. Configure `.env`, create the first ADMIN profile using the Firebase Admin SDK, then deploy rules, indexes, Functions, and Hosting before testing against the live project.

## Enterprise additions

Warehouse Manager and Delivery Staff are first-class protected roles. Delivery assignments are written by the `assignDeliveryStaff` callable Function, and delivery staff can update only their assigned shipment locations through `updateShipmentTracking`. Batch verification uses a server-created opaque token and exposes only safe batch information on `/verify/:token`; QR image assets are stored under `qr/` in Firebase Storage. Deploy Storage rules together with Firestore rules:

```bash
cd functions && npm install && cd ..
firebase deploy --only firestore:rules,firestore:indexes,storage,functions,hosting
```

## Architecture

- `src/firebase`: configuration and thin Firebase SDK adapters.
- `src/services`: domain-facing auth/profile and future collection service foundation.
- `src/context/AuthContext.jsx`: Firebase auth listener, user profile, role and loading state.
- `src/routes`: protected and role-authorized routes.
- `src/layouts`: independent responsive role shells.
- `firestore.rules`: authenticated, role-aware, ownership-aware baseline rules.

## Firestore architecture (prepared; no records are seeded)

| Collection | Key fields |
|---|---|
| `users` | `uid`, `email`, `displayName`, `phone`, `role`, `status`, timestamps |
| organization profiles | `manufacturers`, `distributors`, `pharmacies`, `hospitals`, `customers`; each has `userId` and organization-specific fields |
| `drugs` | name, generic/brand name, category, manufacturer, prescription/storage/price/status fields |
| `drugBatches` | drug/manufacturer, batch number, manufacturing/expiry, produced/available/reserved quantities, quality/status |
| `inventory` | owner type/id, drug/batch, quantity/reserved/reorder, price, storage, expiry/status |
| `orders` | number, customer/seller/destination, items, totals, payment/order statuses, address/timestamps |
| `shipments` | order/drug/batch, origin/destination, carrier/tracking, status, geo fields and delivery timestamps |
| `trackingEvents` | shipment, status, coordinates, message, timestamp, updater identity/role |

Future collections: `categories`, `orderItems`, `carts`, `reviews`, `notifications`, `auditLogs`, and `addresses`. Future domain services should use Firestore `onSnapshot()` for inventory, orders, shipments, tracking events, and notifications.

## Session 2

Implement verified organization onboarding/approval (prefer Cloud Functions), then real drug, batch, inventory, marketplace, cart/order, shipment, and React Leaflet tracking features with corresponding index/rule tests.
