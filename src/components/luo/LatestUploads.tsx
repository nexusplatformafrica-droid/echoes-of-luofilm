import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listLatestTitles, LANG_LABEL, type LuoLanguage } from "@/lib/luo";

const ROUTE = { luo: "/luo/$id", luganda: "/luganda/$id", teso: "/teso/$id" } as const;

/** Home rail: titles the admin marked "Latest" across Luo, Luganda and Teso. */
export function LatestUploads() {
  const q = useQuery({
    queryKey: ["luo-titles", "latest"],
    queryFn: () => listLatestTitles(24),
    staleTime: 30_000,
  });
  const items = (q.data ?? []).filter((t) => t.language in ROUTE);
  if (!items.length) return null;
  return (
    <section className="mt-6 pr-3 sm:pr-4 lg:pr-8">
      <h2 className="mb-3 text-[17px] font-bold text-foreground">Latest</h2>
      <div className="flex gap-2 overflow-x-auto pb-2 sm:gap-3 [scrollbar-width:none]">
        {items.map((t) => (
          <Link
            key={t.id}
            to={ROUTE[t.language as LuoLanguage]}
            params={{ id: t.id }}
            className="group block w-[30%] shrink-0 sm:w-[160px]"
          >
            <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-muted ring-1 ring-border transition-transform group-hover:-translate-y-1">
              {t.poster_url ? (
                <img src={t.poster_url} alt={t.title} loading="lazy" decoding="async" className="size-full object-cover" />
              ) : (
                <div className="grid size-full place-items-center px-2 text-center text-xs text-muted-foreground">{t.title}</div>
              )}
              <span className="absolute right-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-black uppercase text-primary-foreground">
                {LANG_LABEL[t.language as LuoLanguage]}
              </span>
            </div>
            <p className="mt-2 truncate text-[13px] text-muted-foreground group-hover:text-foreground">{t.title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
