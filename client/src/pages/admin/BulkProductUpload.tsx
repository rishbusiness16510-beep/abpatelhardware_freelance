import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Upload, ArrowLeft, Loader2, Save, FileSpreadsheet, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';

interface ParsedRow {
  ProductName: string;
  ProductSKU: string;
  CategorySlug: string;
  BrandName?: string;
  Description?: string;
  Status?: string;
  VariantSKU: string;
  VariantFinish?: string;
  VariantSize?: string;
  MRP: number;
  SellingPrice: number;
  Stock: number;
  ImageURLs?: string; // Comma separated
}

export default function BulkProductUpload() {
  const navigate = useNavigate();
  const [data, setData] = useState<ParsedRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const parsedData = XLSX.utils.sheet_to_json<ParsedRow>(ws);
        
        // Basic validation
        if (parsedData.length === 0) throw new Error("Excel file is empty");
        
        // Check for required columns in the first row
        const firstRow = parsedData[0];
        const required = ['ProductName', 'ProductSKU', 'CategorySlug', 'VariantSKU', 'MRP', 'SellingPrice', 'Stock'];
        const missing = required.filter(col => !(col in firstRow));
        if (missing.length > 0) {
          throw new Error(`Missing required columns: ${missing.join(', ')}`);
        }

        setData(parsedData);
      } catch (err: any) {
        setError(err.message || 'Error parsing Excel file');
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Error reading file');
      setIsLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  const handleUploadToDB = async () => {
    if (data.length === 0) return;
    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      // Group variants by product SKU
      const productsMap = new Map<string, any>();

      data.forEach(row => {
        const prodSKU = row.ProductSKU.toString().trim();
        
        if (!productsMap.has(prodSKU)) {
          productsMap.set(prodSKU, {
            name: row.ProductName,
            sku: prodSKU,
            categorySlug: row.CategorySlug,
            brandName: row.BrandName || null,
            description: row.Description || '',
            status: row.Status && ['ACTIVE', 'DRAFT', 'ARCHIVED'].includes(row.Status.toUpperCase()) ? row.Status.toUpperCase() : 'DRAFT',
            variants: [],
            images: row.ImageURLs ? row.ImageURLs.split(',').map(url => url.trim()).filter(url => url) : []
          });
        }

        productsMap.get(prodSKU).variants.push({
          sku: row.VariantSKU.toString().trim(),
          finish: row.VariantFinish || null,
          size: row.VariantSize || null,
          mrp: parseFloat(row.MRP.toString()) || 0,
          sellingPrice: parseFloat(row.SellingPrice.toString()) || 0,
          stockQuantity: parseInt(row.Stock.toString()) || 0,
        });
      });

      const payload = { products: Array.from(productsMap.values()) };

      const res = await api.post('/products/bulk', payload);
      setSuccess(`Successfully imported ${res.data.productsCreated} products and ${res.data.variantsCreated} variants!`);
      setData([]); // clear on success
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to upload products to database');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      ProductName: 'Premium Brass Handle',
      ProductSKU: 'ABPATEL-CH-001',
      CategorySlug: 'cabinet-handles', // Must match existing category slug
      BrandName: 'ABPATEL', // Optional, must match existing
      Description: 'High quality brass handle',
      Status: 'ACTIVE', // DRAFT, ACTIVE, ARCHIVED
      VariantSKU: 'ABPATEL-CH-001-AB-6',
      VariantFinish: 'Antique Brass',
      VariantSize: '6 inch',
      MRP: 1500,
      SellingPrice: 1200,
      Stock: 50,
      ImageURLs: 'https://example.com/img1.jpg, https://example.com/img2.jpg'
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "ABPATEL_Products_Template.xlsx");
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button onClick={() => navigate('/admin/products')} className="text-text-muted hover:text-text cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold text-text">Bulk Upload Products</h1>
          <p className="text-sm text-text-muted mt-0.5">Upload products via Excel spreadsheet</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="font-heading font-semibold text-text mb-3">Instructions</h2>
            <ul className="text-sm text-text-muted space-y-2 list-disc pl-4">
              <li>Download the template file first to see the exact format.</li>
              <li><strong className="text-text">ProductSKU</strong> groups variants together. Rows with the same ProductSKU will be combined into one product with multiple variants.</li>
              <li><strong className="text-text">CategorySlug</strong> is required. The category must already exist in the system.</li>
              <li><strong className="text-text">BrandName</strong> must exactly match an existing brand name, or leave empty.</li>
              <li><strong className="text-text">ImageURLs</strong> should be public links separated by commas. The system will save these URLs directly. We recommend uploading files to an image host (like Cloudinary, Imgur, or public AWS S3) and pasting the URLs here.</li>
            </ul>
            <Button 
              onClick={downloadTemplate}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-bg-alt cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download Template
            </Button>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="font-heading font-semibold text-text mb-4">Upload Excel File</h2>
            
            {error && (
              <div className="flex items-start gap-2 bg-error/5 border border-error/20 text-error text-sm rounded-lg px-4 py-3 mb-4">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            {success && (
              <div className="bg-success/10 border border-success/20 text-success text-sm rounded-lg px-4 py-3 mb-4">
                {success}
              </div>
            )}

            <div className="relative">
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileUpload}
                className="hidden"
                id="excel-upload"
              />
              <label 
                htmlFor="excel-upload"
                className="w-full h-32 border-2 border-dashed border-border hover:border-accent/40 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors bg-bg"
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 text-accent animate-spin mb-1" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-text-muted mb-2" />
                    <span className="text-sm font-medium text-text">Click to browse file</span>
                    <span className="text-xs text-text-muted mt-1">.xlsx, .xls, or .csv</span>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Table */}
      {data.length > 0 && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-heading font-semibold text-text">Data Preview</h3>
              <p className="text-sm text-text-muted">{data.length} rows detected</p>
            </div>
            <Button 
              onClick={handleUploadToDB}
              loading={isUploading}
              loadingText="Uploading..."
              className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" />
              Upload to Database
            </Button>
          </div>
          
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="sticky top-0 bg-bg-alt border-b border-border z-10">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Product Name</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Product SKU</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Category Slug</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Variant SKU</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Finish</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Size</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">MRP</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Price</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.slice(0, 100).map((row, i) => (
                  <tr key={i} className="hover:bg-bg-alt/30 transition-colors">
                    <td className="px-4 py-2 truncate max-w-[150px]">{row.ProductName}</td>
                    <td className="px-4 py-2">{row.ProductSKU}</td>
                    <td className="px-4 py-2">{row.CategorySlug}</td>
                    <td className="px-4 py-2">{row.VariantSKU}</td>
                    <td className="px-4 py-2">{row.VariantFinish || '-'}</td>
                    <td className="px-4 py-2">{row.VariantSize || '-'}</td>
                    <td className="px-4 py-2">₹{row.MRP}</td>
                    <td className="px-4 py-2">₹{row.SellingPrice}</td>
                    <td className="px-4 py-2">{row.Stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length > 100 && (
              <div className="p-3 text-center text-xs text-text-muted bg-bg-alt/50 border-t border-border">
                Showing first 100 rows
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
