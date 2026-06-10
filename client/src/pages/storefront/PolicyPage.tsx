import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

interface CmsPage {
  id: string;
  title: string;
  content: string | null;
  slug: string;
}

export default function PolicyPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      setError(false);
      try {
        const { data } = await api.get(`/cms/${slug}`);
        setPage(data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-bg">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !page || !page.content) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-bg px-4 text-center">
        <AlertCircle className="w-12 h-12 text-text-muted mb-4" />
        <h2 className="font-heading text-2xl font-bold text-primary mb-2">Page Not Found</h2>
        <p className="text-text-muted mb-6">The policy page you're looking for doesn't exist or is currently unavailable.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-medium uppercase tracking-wider rounded-md hover:bg-primary-dark transition-colors">
          <ArrowLeft className="w-4 h-4" /> Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="bg-primary py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-heading text-2xl md:text-4xl font-bold text-white mb-2">{page.title}</h1>
          <div className="w-12 h-1 bg-accent mx-auto" />
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-surface rounded-2xl border border-border p-8 md:p-12 shadow-sm">
          <div className="prose prose-lg max-w-none text-text prose-headings:font-heading prose-headings:text-primary prose-a:text-accent hover:prose-a:text-accent-dark"
               dangerouslySetInnerHTML={{ __html: page.content }} />
        </div>
      </div>
    </div>
  );
}
