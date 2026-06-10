import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, ArrowLeft } from 'lucide-react';
import api from '../../lib/api';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
}

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data } = await api.get(`/blog/slug/${slug}`);
        setPost(data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-bg">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-bg px-4 text-center">
        <h2 className="font-heading text-2xl font-bold text-primary mb-2">Post Not Found</h2>
        <p className="text-text-muted mb-6">The article you're looking for doesn't exist or has been removed.</p>
        <Link to="/blog" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-medium uppercase tracking-wider rounded-md hover:bg-primary-dark transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-20">
      {/* Cover Image */}
      {post.coverImageUrl ? (
        <div className="w-full h-[40vh] md:h-[50vh] bg-bg-alt relative">
          <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      ) : (
        <div className="w-full h-[20vh] bg-primary" />
      )}

      {/* Content Container */}
      <div className="max-w-3xl mx-auto px-4 -mt-16 md:-mt-32 relative z-10">
        <div className="bg-surface rounded-2xl shadow-xl border border-border p-8 md:p-12">
          {/* Meta */}
          <div className="flex items-center gap-2 text-sm text-accent font-semibold mb-4">
            <Calendar className="w-4 h-4" />
            {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>

          {/* Title */}
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-8 leading-tight">
            {post.title}
          </h1>

          <div className="w-12 h-1 bg-accent mb-8" />

          {/* Body Content */}
          <div className="prose prose-lg max-w-none text-text prose-headings:font-heading prose-headings:text-primary prose-a:text-accent hover:prose-a:text-accent-dark prose-img:rounded-xl"
               dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to all articles
          </Link>
        </div>
      </div>
    </div>
  );
}
