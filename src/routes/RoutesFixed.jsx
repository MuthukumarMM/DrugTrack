import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ROLES } from '../constants/roles'
import ProtectedRoute from './ProtectedRoute'
import RoleRoute from './RoleRoute'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'
import CustomerLayout from '../layouts/CustomerLayout'
import ManufacturerLayout from '../layouts/ManufacturerLayout'
import DistributorLayout from '../layouts/DistributorLayout'
import PharmacyLayout from '../layouts/PharmacyLayout'
import HospitalLayout from '../layouts/HospitalLayout'
import WarehouseLayout from '../layouts/WarehouseLayout'
import DeliveryLayout from '../layouts/DeliveryLayout'
import AdminLayout from '../layouts/AdminLayout'
import CartPage from '../pages/customer/CartPage'
import CheckoutPage from '../pages/customer/SecureCheckout'
import TrackingMap from '../pages/customer/TrackingMap'
import DrugManager from '../pages/management/DrugManager'
import BatchPage from '../pages/management/BatchPage'
import InventoryPage from '../pages/management/InventoryPage'
import CataloguePage from '../pages/customer/CataloguePage'
import MedicineDetailsPage from '../pages/customer/MedicineDetailsPage'
import { AboutPage, CategoriesPage, ContactPage, HomePage, SupplyChainPage } from '../pages/public/PublicPages'
import { AddressesPage, NotificationsPage, OrderDetailPage, OrdersPage } from '../pages/customer/CustomerOperations'
import VerifyBatchPage from '../pages/public/VerifyBatchPage'
import RoleSelectionPage from '../pages/auth/RoleSelectionPage'
import AccountStatusPage from '../pages/auth/AccountStatusPage'
import AdminDashboard from '../pages/management/AdminDashboard'
import AdminUsersPage from '../pages/management/AdminUsersPage'
import CategoryPage from '../pages/management/CategoryPage'
import ProfilePage from '../pages/profile/ProfilePage'
import DeliveryDashboard from '../pages/operations/DeliveryDashboard'
import OrderQueuePage from '../pages/operations/OrderQueuePage'
import DistributorOrderQueue from '../pages/operations/DistributorOrderQueue'
import RoleDashboard from '../pages/operations/RoleDashboard'

export default function RoutesFixed() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/medicines" element={<CataloguePage />} />
    <Route path="/medicines/:listingId" element={<MedicineDetailsPage />} />
    <Route path="/categories" element={<CategoriesPage />} />
    <Route path="/supply-chain" element={<SupplyChainPage />} />
    <Route path="/contact" element={<ContactPage />} />
    <Route path="/verify-drug" element={<VerifyBatchPage/>}/>
    <Route path="/verify/:token?" element={<VerifyBatchPage/>}/>
    <Route path="/get-started" element={<RoleSelectionPage/>}/>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/account-status" element={<AccountStatusPage/>}/>
    <Route element={<ProtectedRoute />}>
      <Route element={<RoleRoute roles={[ROLES.CUSTOMER]} />}>
        <Route path="/shop/*" element={<CustomerLayout />}><Route index element={<CataloguePage />} /><Route path="drug/:listingId" element={<MedicineDetailsPage />} /></Route>
        <Route path="/cart" element={<CartPage />} /><Route path="/checkout" element={<CheckoutPage />} /><Route path="/orders" element={<OrdersPage/>}/><Route path="/orders/:orderId" element={<OrderDetailPage/>}/><Route path="/history" element={<OrdersPage history />}/><Route path="/addresses" element={<AddressesPage/>}/><Route path="/notifications" element={<NotificationsPage/>}/><Route path="/profile" element={<ProfilePage/>}/><Route path="/track/:shipmentId" element={<TrackingMap />} />
      </Route>
      <Route element={<RoleRoute roles={[ROLES.MANUFACTURER]} />}><Route path="/manufacturer/*" element={<ManufacturerLayout />}><Route index element={<RoleDashboard role="MANUFACTURER" />} /><Route path="orders" element={<OrderQueuePage />} /><Route path="my-drugs" element={<DrugManager />} /><Route path="batches" element={<BatchPage />} /><Route path="inventory" element={<InventoryPage />} /><Route path="profile" element={<ProfilePage/>}/></Route></Route>
      <Route element={<RoleRoute roles={[ROLES.WAREHOUSE_MANAGER]} />}><Route path="/warehouse/*" element={<WarehouseLayout />}><Route index element={<RoleDashboard role="WAREHOUSE_MANAGER"/>}/><Route path="inventory" element={<InventoryPage/>}/><Route path="profile" element={<ProfilePage/>}/></Route></Route>
      <Route element={<RoleRoute roles={[ROLES.DISTRIBUTOR]} />}><Route path="/distributor/*" element={<DistributorLayout />}><Route index element={<RoleDashboard role="DISTRIBUTOR" />} /><Route path="orders" element={<DistributorOrderQueue />} /><Route path="inventory" element={<InventoryPage />} /><Route path="profile" element={<ProfilePage/>}/></Route></Route>
      <Route element={<RoleRoute roles={[ROLES.PHARMACY]} />}><Route path="/pharmacy/*" element={<PharmacyLayout />}><Route index element={<RoleDashboard role="PHARMACY" />} /><Route path="order" element={<CataloguePage />} /><Route path="cart" element={<CartPage />} /><Route path="checkout" element={<CheckoutPage />} /><Route path="purchases" element={<OrdersPage />} /><Route path="history" element={<OrdersPage history />} /><Route path="orders/:orderId" element={<OrderDetailPage />} /><Route path="track/:shipmentId" element={<TrackingMap />} /><Route path="orders" element={<OrderQueuePage />} /><Route path="my-inventory" element={<InventoryPage />} /><Route path="profile" element={<ProfilePage/>}/></Route></Route>
      <Route element={<RoleRoute roles={[ROLES.HOSPITAL]} />}><Route path="/hospital/*" element={<HospitalLayout />}><Route index element={<RoleDashboard role="HOSPITAL" />} /><Route path="order" element={<CataloguePage />} /><Route path="cart" element={<CartPage />} /><Route path="checkout" element={<CheckoutPage />} /><Route path="purchases" element={<OrdersPage />} /><Route path="history" element={<OrdersPage history />} /><Route path="orders/:orderId" element={<OrderDetailPage />} /><Route path="track/:shipmentId" element={<TrackingMap />} /><Route path="orders" element={<OrderQueuePage />} /><Route path="inventory" element={<InventoryPage />} /><Route path="profile" element={<ProfilePage/>}/></Route></Route>
      <Route element={<RoleRoute roles={[ROLES.DELIVERY_STAFF]} />}><Route path="/delivery/*" element={<DeliveryLayout/>}><Route index element={<DeliveryDashboard/>}/><Route path="profile" element={<ProfilePage/>}/></Route></Route>
      <Route element={<RoleRoute roles={[ROLES.ADMIN]} />}>
        <Route path="/admin/*" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="orders" element={<OrderQueuePage admin />} />
          <Route path="categories" element={<CategoryPage />} />
          <Route path="drugs" element={<DrugManager admin />} />
          <Route path="batches" element={<BatchPage admin />} />
          <Route path="inventory" element={<InventoryPage admin />} />
          <Route path="profile" element={<ProfilePage/>} />
        </Route>
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes></BrowserRouter>
}
