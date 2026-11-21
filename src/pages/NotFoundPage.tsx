import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';

export function NotFoundPage() {
  return (
    <div className="page-enter" style={{ paddingTop: 40 }}>
      <EmptyState
        icon={<Compass />}
        title="This page isn’t in the program"
        text="The link may be old or the page may have moved. Everything you’ve logged is still safe."
        action={
          <Link to="/" className="btn btn-primary">
            <Home /> Back to home
          </Link>
        }
      />
    </div>
  );
}
