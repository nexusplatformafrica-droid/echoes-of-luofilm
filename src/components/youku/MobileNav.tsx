import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Clapperboard, Film, Home, Tv, User, Video } from "lucide-react";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { listAllEpisodes, listLuoTitles, type LuoLanguage } from "@/lib/luo";

/** Compact 56px bottom bar (6 × 56px tabs, 24px icons, 11px labels), mobile only. */
export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const queryClient = useQueryClient();

  const warm = (language: LuoLanguage) => () => {
    void queryClient.prefetchQuery({ queryKey: ["luo-titles", language], queryFn: () => listLuoTitles(language), staleTime: 30_000 });
    void queryClient.prefetchQuery({ queryKey: ["luo-all-episodes"], queryFn: listAllEpisodes, staleTime: 60_000 });
  };

  const item = (active: boolean) =>
    `relative flex h-14 w-14 flex-col items-center justify-center gap-1 text-[11px] font-semibold leading-none transition-colors ${
      active ? "text-primary-foreground" : "text-primary-foreground/70"
    }`;
  const Body = ({ icon, label, active }: { icon: ReactNode; label: string; active: boolean }) => (
    <>
      {active && <span className="absolute inset-x-1.5 inset-y-1 rounded-xl bg-primary-foreground/15" />}
      <span className="relative">{icon}</span>
      <span className="relative">{label}</span>
    </>
  );
  const ic = "size-6";

  const openProfile = () => {
    if (!user) return setAuthOpen(true);
    document.querySelector<HTMLButtonElement>('button[aria-label="Account"]')?.click();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] lg:hidden">
      <nav className="pointer-events-auto flex h-14 items-center justify-between rounded-2xl bg-primary px-3 shadow-lg">
        <Link to="/" className={item(pathname === "/")}>
          <Body icon={<Home className={ic} />} label="Home" active={pathname === "/"} />
        </Link>
        <Link to="/category/$slug" params={{ slug: "movies" }} className={item(pathname.startsWith("/category"))}>
          <Body icon={<Film className={ic} />} label="Eng" active={pathname.startsWith("/category")} />
        </Link>
        <Link to="/luo" data-tour="luo-tab" onTouchStart={warm("luo")} className={item(pathname.startsWith("/luo"))}>
          <Body icon={<Tv className={ic} />} label="Luo" active={pathname.startsWith("/luo")} />
        </Link>
        <Link to="/luganda" onTouchStart={warm("luganda")} className={item(pathname.startsWith("/luganda"))}>
          <Body icon={<Clapperboard className={ic} />} label="Luganda" active={pathname.startsWith("/luganda")} />
        </Link>
        <Link to="/teso" onTouchStart={warm("teso")} className={item(pathname.startsWith("/teso"))}>
          <Body icon={<Video className={ic} />} label="Teso" active={pathname.startsWith("/teso")} />
        </Link>
        <button type="button" onClick={openProfile} className={item(false)}>
          <Body icon={<User className={ic} />} label="Profile" active={false} />
        </button>
      </nav>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
