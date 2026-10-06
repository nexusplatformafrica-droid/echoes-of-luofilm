import { useEffect, useState } from "react";
import { Phone, X, ArrowUpRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import collageBg from "@/assets/whatsapp-movie-wall-clean.jpg";
import movieMaxLogo from "@/assets/moviemax-logo.png";
import { Button } from "@/components/ui/button";
import { TOUR_STATE_EVENT } from "@/components/luo/DownloadTour";

const CHANNEL_URL = "https://whatsapp.com/channel/0029VbEBSz6J3jv5PPsldQ3u";
const SUPPORT_URL = "https://wa.me/256795592662";
/** Only set once the visitor actually joins the channel — closing it does not stick. */
const JOINED_KEY = "luofilm:whatsapp-channel-joined";
const AUTO_EXIT_MS = 8000;
const TOUR_KEY = "luofilm-download-tour-v3";
export const WHATSAPP_PROMPT_CLOSED_EVENT = "luofilm:whatsapp-prompt-closed";

export function WhatsAppPrompt() {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let joined = false;
    try {
      joined = localStorage.getItem(JOINED_KEY) === "1";
    } catch {
      /* storage unavailable */
    }
    if (joined) {
      window.setTimeout(() => window.dispatchEvent(new Event(WHATSAPP_PROMPT_CLOSED_EVENT)), 0);
      return;
    }

    const tourFinished = (() => {
      try {
        const saved = JSON.parse(localStorage.getItem(TOUR_KEY) ?? "null") as {
          done?: boolean;
        } | null;
        return saved?.done === true;
      } catch {
        return false;
      }
    })();
    if (tourFinished) setOpen(true);

    const onTourState = (event: Event) => {
      const active = (event as CustomEvent<{ active?: boolean }>).detail?.active;
      setOpen(!active);
    };
    window.addEventListener(TOUR_STATE_EVENT, onTourState);
    return () => window.removeEventListener(TOUR_STATE_EVENT, onTourState);
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => {
        setOpen(false);
        window.dispatchEvent(new Event(WHATSAPP_PROMPT_CLOSED_EVENT));
      }, 400);
    }, AUTO_EXIT_MS);
    return () => clearTimeout(t);
  }, [open]);

  /** Closing simply hides it for this visit; it returns on the next visit. */
  const close = () => {
    setLeaving(true);
    setTimeout(() => {
      setOpen(false);
      window.dispatchEvent(new Event(WHATSAPP_PROMPT_CLOSED_EVENT));
    }, 400);
  };

  /** Joining the channel is the only action that stops the prompt for good. */
  const join = () => {
    try {
      localStorage.setItem(JOINED_KEY, "1");
    } catch {
      /* storage unavailable */
    }
    close();
  };

  if (!open) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[65] grid place-items-center px-4 transition-opacity duration-300 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <aside
        role="dialog"
        aria-label="Follow MOVIE MAX on WhatsApp"
        className={`wa-prompt pointer-events-auto relative w-full max-w-4xl overflow-hidden rounded-lg border border-channel/40 bg-background shadow-2xl transition-all duration-400 ${
          leaving ? "scale-95 opacity-0" : "animate-enter"
        }`}
      >
        <div className="relative">
          <img
            src={collageBg}
            alt=""
            width={1536}
            height={864}
            decoding="async"
            className="pointer-events-none absolute inset-0 size-full object-cover"
          />
          <div className="wa-banner-shade pointer-events-none absolute inset-0" />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={close}
            aria-label="Dismiss WhatsApp prompt"
            className="absolute top-3 right-3 z-20 rounded-full border border-foreground/20 bg-background/75 text-foreground hover:bg-background"
          >
            <X className="size-4" />
          </Button>

          <div className="relative z-10 flex min-h-[540px] flex-col justify-end p-6 sm:min-h-[530px] sm:max-w-[520px] sm:justify-center sm:p-10 lg:p-12">
            <div className="mb-7 flex items-center gap-3">
              <img src={movieMaxLogo} alt="Movie Max logo" className="size-12 shrink-0 object-contain" width={48} height={48} />
              <span className="brand-logo-text text-xl font-black">MOVIE MAX</span>
            </div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase text-channel">
              <WhatsAppIcon className="size-4" /> Official WhatsApp channel
            </div>

            <h2 className="max-w-md text-3xl font-black leading-tight text-foreground sm:text-5xl">
              Your next movie.<span className="block text-channel">One message away.</span>
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-foreground/80 sm:text-base">
              New movies, series and translated favourites. Follow MOVIE MAX for the latest releases.
            </p>

            <p className="mt-3 text-xs text-foreground/60">Action · Drama · Comedy · Sci-fi</p>
            <div className="mt-6 flex w-full flex-wrap items-center gap-2">
              <Button asChild className="h-12 bg-channel px-5 font-bold text-channel-foreground hover:bg-channel/90">
              <a
                href={CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={join}
              >
                <WhatsAppIcon className="size-5" />
                Follow Channel
                <ArrowUpRight className="size-4" />
              </a>
              </Button>
              <Button asChild variant="outline" className="h-12 border-foreground/20 bg-background/65 px-4 text-foreground hover:bg-background">
              <a
                href={SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
              >
                <Phone className="size-4" />
                Support
              </a>
              </Button>
            </div>
          </div>

          {/* 8s auto-exit progress bar */}
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-foreground/10">
            <div
              className="wa-banner-timer h-full bg-channel"
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
