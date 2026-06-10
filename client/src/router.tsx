import { createBrowserRouter } from 'react-router-dom';
import NotFound from './pages/NotFound';
import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import CategoryManager from './pages/admin/CategoryManager';
import BrandManager from './pages/admin/BrandManager';
import ProductList from './pages/admin/ProductList';
import ProductForm from './pages/admin/ProductForm';
import BulkProductUpload from './pages/admin/BulkProductUpload';
import OrderList from './pages/admin/OrderList';
import OrderDetail from './pages/admin/OrderDetail';
import CustomerList from './pages/admin/CustomerList';
import CmsManager from './pages/admin/CmsManager';
import MediaLibrary from './pages/admin/MediaLibrary';
import SeoManager from './pages/admin/SeoManager';

import StorefrontLayout from './components/storefront/StorefrontLayout';
import Home from './pages/storefront/Home';
import ProductCatalog from './pages/storefront/ProductCatalog';
import ProductDetailPage from './pages/storefront/ProductDetail';
import CheckoutPage from './pages/storefront/CheckoutPage';
import OrderSuccess from './pages/storefront/OrderSuccess';
import AboutUs from './pages/storefront/AboutUs';
import ContactUs from './pages/storefront/ContactUs';
import FAQ from './pages/storefront/FAQ';
import BlogList from './pages/storefront/BlogList';
import BlogDetail from './pages/storefront/BlogDetail';
import PolicyPage from './pages/storefront/PolicyPage';
import CustomerLogin from './pages/storefront/CustomerLogin';
import AccountLayout from './components/storefront/AccountLayout';
import AccountDashboard from './pages/storefront/account/AccountDashboard';
import MyOrders from './pages/storefront/account/MyOrders';
import MyAddresses from './pages/storefront/account/MyAddresses';

export const router = createBrowserRouter([
  // Storefront routes
  {
    path: '/',
    element: <StorefrontLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <CustomerLogin /> },
      { path: 'products', element: <ProductCatalog /> },
      { path: 'category/:slug', element: <ProductCatalog /> },
      { path: 'product/:slug', element: <ProductDetailPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'order-success', element: <OrderSuccess /> },
      { path: 'about', element: <AboutUs /> },
      { path: 'contact', element: <ContactUs /> },
      { path: 'faq', element: <FAQ /> },
      { path: 'blog', element: <BlogList /> },
      { path: 'blog/:slug', element: <BlogDetail /> },
      { path: 'policies/:slug', element: <PolicyPage /> },
      {
        path: 'account',
        element: <AccountLayout />,
        children: [
          { index: true, element: <AccountDashboard /> },
          { path: 'orders', element: <MyOrders /> },
          { path: 'addresses', element: <MyAddresses /> },
        ]
      },
      { path: '*', element: <NotFound /> },
    ],
    errorElement: <NotFound />,
  },

  // Admin login (outside layout — no sidebar)
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },

  // Admin panel routes (inside layout — with sidebar + auth guard)
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'products', element: <ProductList /> },
      { path: 'products/new', element: <ProductForm /> },
      { path: 'products/bulk', element: <BulkProductUpload /> },
      { path: 'products/:id', element: <ProductForm /> },
      { path: 'categories', element: <CategoryManager /> },
      { path: 'brands', element: <BrandManager /> },
      { path: 'orders', element: <OrderList /> },
      { path: 'orders/:id', element: <OrderDetail /> },
      { path: 'customers', element: <CustomerList /> },
      { path: 'media', element: <MediaLibrary /> },
      { path: 'cms', element: <CmsManager /> },
      { path: 'seo', element: <SeoManager /> },
      { path: '*', element: <NotFound /> },
    ],
  },

  // Global catch-all — must be last
  { path: '*', element: <NotFound /> },
]);
