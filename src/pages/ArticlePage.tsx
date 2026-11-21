import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Clock,
  ExternalLink,
  PlayCircle,
  Quote,
} from 'lucide-react';
import { ARTICLES, ARTICLE_MAP } from '../data/articles';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { useAppStore } from '../store/appStore';
import { toast } from '../store/toastStore';

export function ArticlePage() {
  const { slug = '' } = useParams();
  const article = ARTICLE_MAP[slug];
  const bookmarks = useAppStore((state) => state.articleBookmarks);
  const toggleBookmark = useAppStore((state) => state.toggleBookmark);

  if (!article) {
    return (
      <div className="page-enter">
        <PageHeader title="Article not found" back="/learn" />
        <EmptyState
          icon={<Quote />}
          title="That page isn’t here"
          text="Try the learning library for something else."
          action={
            <Link to="/learn" className="btn btn-primary">
              Back to Learn
            </Link>
          }
        />
      </div>
    );
  }

  const next = ARTICLES[(ARTICLES.findIndex((item) => item.slug === article.slug) + 1) % ARTICLES.length];
  const saved = bookmarks.includes(article.slug);

  return (
    <div className={`page-enter article-page accent-${article.accent}`}>
      <PageHeader
        eyebrow={`${article.category} · ${article.readMinutes} min read`}
        title={article.title}
        subtitle={article.excerpt}
        back="/learn"
        actions={
          <button
            type="button"
            className={saved ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            onClick={() => {
              toggleBookmark(article.slug);
              toast(saved ? 'Bookmark removed.' : 'Saved to your library.', 'success');
            }}
          >
            <Bookmark fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save'}
          </button>
        }
      />

      <div className="article-layout">
        <article className="article-body card">
          <div className="article-meta">
            <span className="badge">{article.category}</span>
            <span className="tiny muted">
              <Clock size={12} /> {article.readMinutes} minutes
            </span>
          </div>

          {article.sections.map((section, index) => (
            <section key={index} className="article-section">
              {section.heading && <h2>{section.heading}</h2>}
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets && (
                <ul className="article-bullets">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>
                      <CheckCircle2 />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {article.tips && (
            <aside className="article-tips">
              <p className="eyebrow">Put it into practice</p>
              <ul>
                {article.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </aside>
          )}

          <p className="article-disclaimer">
            General information only, not medical advice. If you have pain, an injury or a health condition, speak to a
            qualified professional.
          </p>

          <div className="article-next">
            <span className="eyebrow">Up next</span>
            <Link to={`/learn/${next.slug}`}>
              <h3>{next.title}</h3>
              <span className="section-link">
                Read next <ArrowRight size={14} />
              </span>
            </Link>
          </div>
        </article>

        <aside className="stack">
          {article.videoLinks && article.videoLinks.length > 0 && (
            <div className="card">
              <div className="between" style={{ marginBottom: 8 }}>
                <h2 className="section-title" style={{ fontSize: '0.98rem' }}>
                  Watch
                </h2>
                <PlayCircle size={17} className="coral" />
              </div>
              <div className="stack-sm">
                {article.videoLinks.map((video) => (
                  <a key={video.url} href={video.url} target="_blank" rel="noopener noreferrer" className="article-link-row">
                    <PlayCircle />
                    <span className="grow">
                      <span className="strong small">{video.label}</span>
                      <span className="tiny muted">YouTube · external</span>
                    </span>
                    <ExternalLink size={14} className="muted" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {article.sources && (
            <div className="card">
              <div className="between" style={{ marginBottom: 8 }}>
                <h2 className="section-title" style={{ fontSize: '0.98rem' }}>
                  Further reading
                </h2>
                <ExternalLink size={16} className="muted" />
              </div>
              <div className="stack-sm">
                {article.sources.map((source) => (
                  <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="article-link-row">
                    <ExternalLink />
                    <span className="grow">
                      <span className="strong small">{source.label}</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <p className="eyebrow">Keep reading</p>
            <div className="stack-sm mt-2">
              {ARTICLES.filter((item) => item.slug !== article.slug)
                .slice(0, 3)
                .map((item) => (
                  <Link key={item.slug} to={`/learn/${item.slug}`} className="mini-article-link">
                    <span className="badge">{item.category}</span>
                    <span className="grow small strong">{item.title}</span>
                    <ArrowRight size={14} className="muted" />
                  </Link>
                ))}
            </div>
            <Link to="/learn" className="btn btn-secondary btn-sm btn-block mt-3">
              <ArrowLeft size={14} /> All articles
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
