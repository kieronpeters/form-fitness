import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  ExternalLink,
  PlayCircle,
  Search,
  Sparkles,
  Timer,
} from 'lucide-react';
import { ARTICLES, ARTICLE_CATEGORIES } from '../data/articles';
import { PageHeader } from '../components/ui/PageHeader';
import { useAppStore } from '../store/appStore';
import { toast } from '../store/toastStore';

export function LearnPage() {
  const bookmarks = useAppStore((state) => state.articleBookmarks);
  const toggleBookmark = useAppStore((state) => state.toggleBookmark);
  const [category, setCategory] = useState<(typeof ARTICLE_CATEGORIES)[number]>('All');
  const [savedOnly, setSavedOnly] = useState(false);
  const [query, setQuery] = useState('');

  const featured = ARTICLES.find((article) => article.featured) ?? ARTICLES[0];
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ARTICLES.filter((article) => !article.featured)
      .filter((article) => category === 'All' || article.category === category)
      .filter((article) => !savedOnly || bookmarks.includes(article.slug))
      .filter((article) => !needle || `${article.title} ${article.excerpt}`.toLowerCase().includes(needle));
  }, [category, savedOnly, bookmarks, query]);

  const videoLinks = ARTICLES.flatMap((article) => article.videoLinks ?? []).slice(0, 4);
  const uniqueVideos = videoLinks.filter((link, index, list) => list.findIndex((item) => item.url === link.url) === index);

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Learn"
        title="Train smarter"
        subtitle="Short, practical reads on training, eating, recovery and the psychology of showing up."
      />

      <div className="learn-tools">
        <div className="exercise-search">
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the library…"
            aria-label="Search articles"
          />
        </div>
        <button type="button" className="chip" data-active={savedOnly} onClick={() => setSavedOnly((value) => !value)}>
          <Bookmark size={14} /> Saved
        </button>
      </div>

      <div className="scroll-x learn-categories" aria-label="Article categories">
        {ARTICLE_CATEGORIES.map((item) => (
          <button key={item} type="button" className="chip" data-active={category === item} onClick={() => setCategory(item)}>
            {item}
          </button>
        ))}
      </div>

      {!savedOnly && !query && category === 'All' && (
        <Link to={`/learn/${featured.slug}`} className="learn-feature">
          <div className="learn-feature-main">
            <span className="badge badge-lime">Article of the month</span>
            <h2>{featured.title}</h2>
            <p>{featured.excerpt}</p>
            <div className="learn-feature-meta">
              <span>{featured.category}</span>
              <span>·</span>
              <span>
                <Timer size={13} /> {featured.readMinutes} min
              </span>
              <span className="learn-feature-cta">
                Read <ArrowRight size={15} />
              </span>
            </div>
          </div>
          <div className="learn-feature-art" aria-hidden="true">
            <span className="learn-orbit learn-orbit-1" />
            <span className="learn-orbit learn-orbit-2" />
            <Sparkles />
          </div>
        </Link>
      )}

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">{savedOnly ? 'Saved reads' : query ? 'Search results' : 'The library'}</h2>
          <span className="badge">{filtered.length}</span>
        </div>
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">
              <BookOpen />
            </div>
            <p className="empty-title">Nothing here yet</p>
            <p className="empty-text">
              {savedOnly ? 'Bookmark an article and it will show up here.' : 'Try another category or clear your search.'}
            </p>
          </div>
        ) : (
          <div className="article-grid">
            {filtered.map((article) => (
              <article className={`article-card card accent-${article.accent}`} key={article.slug}>
                <div className="between" style={{ alignItems: 'flex-start' }}>
                  <span className="badge">{article.category}</span>
                  <button
                    type="button"
                    className="icon-btn icon-btn-sm"
                    aria-label={bookmarks.includes(article.slug) ? 'Remove bookmark' : 'Bookmark article'}
                    onClick={() => {
                      toggleBookmark(article.slug);
                      toast(bookmarks.includes(article.slug) ? 'Bookmark removed.' : 'Saved to your library.', 'success');
                    }}
                  >
                    <Bookmark fill={bookmarks.includes(article.slug) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <Link to={`/learn/${article.slug}`}>
                  <h3 className="article-card-title">{article.title}</h3>
                  <p className="article-card-excerpt clamp-2">{article.excerpt}</p>
                  <div className="article-card-foot">
                    <span className="tiny muted">
                      <Timer size={12} /> {article.readMinutes} min read
                    </span>
                    <span className="section-link">
                      Read <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Watch & learn</h2>
          <span className="tiny muted">External channels</span>
        </div>
        <div className="video-grid">
          {uniqueVideos.map((video) => (
            <a href={video.url} target="_blank" rel="noopener noreferrer" className="card card-sm video-card" key={video.url}>
              <span className="entity-icon entity-icon-coral">
                <PlayCircle />
              </span>
              <span className="grow">
                <span className="strong small">{video.label}</span>
                <span className="tiny muted">Opens on YouTube</span>
              </span>
              <ExternalLink size={15} className="muted" />
            </a>
          ))}
        </div>
      </section>

      <div className="info-note mt-4">
        <BookOpen />
        <span>
          These articles are general information, not medical advice. If something hurts, get it assessed by a
          professional who can see you move.
        </span>
      </div>
    </div>
  );
}
