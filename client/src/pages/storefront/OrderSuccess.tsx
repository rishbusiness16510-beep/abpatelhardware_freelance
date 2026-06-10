import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Download } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const orderNumber = params.get('orderNumber') || '—';
  const orderId = params.get('orderId');

  const handleDownloadBill = async () => {
    if (!orderId) return;

    try {
      const isProd = import.meta.env.PROD;
      const hostURL = (isProd ? import.meta.env.VITE_API_URL_PROD : import.meta.env.VITE_API_URL_DEV) || 'http://localhost:5000';
      const baseURL = hostURL.endsWith('/api') ? hostURL : `${hostURL}/api`;
      const url = `${baseURL}/orders/${orderId}/invoice`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to download invoice');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `ABPATEL-Invoice-${orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Invoice download error:', err);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-bg px-4">
      <div className="max-w-lg w-full text-center bg-surface rounded-2xl p-10 shadow-sm border border-border">
        {/* Success Icon */}
        <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-success" />
        </div>

        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary mb-3">
          Order Placed!
        </h1>
        <p className="text-text-muted mb-6 text-sm leading-relaxed">
          Thank you for shopping with <span className="font-semibold text-accent">ABPATEL Hardware Shop</span>.<br />
          Your order has been confirmed successfully.
        </p>

        {/* Order Details */}
        <div className="bg-bg rounded-lg p-5 mb-8 inline-block w-full">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Package className="w-5 h-5 text-accent" />
            <span className="text-sm font-semibold text-text">Order Number</span>
          </div>
          <p className="text-2xl font-heading font-bold text-primary tracking-wide">
            {orderNumber}
          </p>
          <p className="text-xs text-text-muted mt-2">
            A confirmation email will be sent to you shortly.
          </p>
        </div>

        {/* Shipping Info */}
        <div className="text-sm text-text-muted mb-8 leading-relaxed">
          <p>Estimated delivery: <span className="font-semibold text-text">5–7 business days</span></p>
          <p className="mt-1">You can contact us on WhatsApp for tracking updates.</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {orderId && (
            <Button
              onClick={handleDownloadBill}
              loadingText="Downloading..."
              className="flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white text-sm font-medium uppercase tracking-wider rounded-md hover:bg-accent-dark transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Bill
            </Button>
          )}
          <Link
            to="/products"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white text-sm font-medium uppercase tracking-wider rounded-md hover:bg-primary-dark transition-colors"
          >
            Continue Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
