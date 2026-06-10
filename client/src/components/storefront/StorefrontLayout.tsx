import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import WhatsAppButton from './WhatsAppButton';
import CartDrawer from './CartDrawer';

export default function StorefrontLayout() {
  return (
    <div className="min-h-screen bg-bg font-body flex flex-col selection:bg-accent/20 selection:text-primary">
      {/* Navbar stays fixed at top */}
      <Navbar />

      {/* Cart Drawer (overlay) */}
      <CartDrawer />

      {/* Main content takes up remaining space and flex-grows to push footer down */}
      <main className="flex-grow pt-16 lg:pt-20"> 
        {/* pt-16/20 is to account for the fixed navbar height */}
        <Outlet />
      </main>

      {/* Footer at the bottom */}
      <Footer />

      {/* Floating Action Button */}
      <WhatsAppButton />
    </div>
  );
}
