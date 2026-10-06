import { Link, useRouterState } from "@tanstack/react-router";
import homeIconSrc from "@/assets/home.svg";
import moviesIconSrc from "@/assets/movies.svg";
import seriesIconSrc from "@/assets/series.svg";
import animationIconSrc from "@/assets/animation.svg";
import tvIconSrc from "@/assets/tv.svg";

const items = [
  { slug: "home", label: "Home", icon: homeIconSrc },
  { slug: "movies", label: "Movies", icon: moviesIconSrc },
  { slug: "drama", label: "Series", icon: seriesIconSrc },
  { slug: "animation", label: "Animation", icon: animationIconSrc },
  { slug: "tv", label: "TV", icon: tvIconSrc },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const itemClass = (active: boolean) =>
    `relative flex size-14 items-center justify-center transition-colors ${
      active
        ? "bg-sidebar-accent"
        : "hover:bg-sidebar-accent"
    }`;

  return (
    <aside className="fixed bottom-4 left-0 top-16 z-30 hidden w-[var(--sidebar-w)] flex-col overflow-hidden rounded-r-2xl border border-l-0 border-sidebar-border bg-sidebar shadow-xl lg:flex">
      <nav aria-label="Categories" className="scrollbar-none flex-1 overflow-y-auto py-2">
        {items.map(({ slug, label, icon }) => {
          const active = slug === "home" ? pathname === "/" : pathname === `/category/${slug}`;
          const inner = (
            <>
              {active && (
                <span className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r bg-sidebar-primary" />
              )}
              <img src={icon} alt="" className={`size-7 shrink-0 object-contain brightness-0 invert ${active ? "opacity-100" : "opacity-75"}`} />
            </>
          );
          return slug === "home" ? (
              <Link key={slug} to="/" className={itemClass(active)} title={label} aria-label={label} aria-current={active ? "page" : undefined}>
              {inner}
            </Link>
          ) : (
              <Link key={slug} to="/category/$slug" params={{ slug }} className={itemClass(active)} title={label} aria-label={label} aria-current={active ? "page" : undefined}>
              {inner}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
