import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import PageHero from '../../components/storefront/PageHero';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
}

interface BlogListResponse {
  data: BlogPost[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export default function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get<BlogListResponse>(`/blog?page=${page}&limit=9`);
        setPosts(data.data);
        setTotalPages(data.pagination.totalPages);
      } catch (err) {
        console.error('Failed to fetch blog posts:', err);
      }
      setLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [page]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-bg">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero */}
      <PageHero title="Inspiration & Insights" subtitle="Tips, guides, and news from the world of premium hardware." eyebrow="The ABPATEL Blog" />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-20 text-text-muted">
            <p className="text-lg font-semibold mb-2">No blog posts yet</p>
            <p className="text-sm">Check back soon for tips, guides, and product updates.</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map(post => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="group overflow-hidden hover:shadow-lg transition-shadow" style={{ background: '#faf8f5', border: '1px solid #e0dbd4', borderRadius: '2px' }}>
                  {/* Cover Image */}
                  <div className="aspect-[16/10] bg-bg-alt overflow-hidden">
                    {post.coverImageUrl ? (
                      <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted/30 text-4xl font-heading font-bold">ABP</div>
                    )}
                  </div>
                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <h3 className="font-heading text-base font-bold text-primary mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-text-muted line-clamp-3 leading-relaxed">{post.excerpt}</p>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent mt-3 group-hover:gap-2 transition-all">
                      Read More <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <Button
                    key={p}
                    onClick={() => { setPage(p); window.scrollTo(0, 0); }}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all cursor-pointer ${p === page ? 'bg-primary text-white' : 'bg-surface border border-border text-text-muted hover:bg-primary/5'}`}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
