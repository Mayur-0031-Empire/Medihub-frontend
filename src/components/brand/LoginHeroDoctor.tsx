/**
 * Hero photography (Unsplash). Replace `src` with your own asset in /public when ready.
 * Photo: doctor / clinical — https://unsplash.com/photos (free to use under Unsplash License)
 */
const DOCTOR_HERO_SRC =
  "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=960&q=80";

export function LoginHeroDoctor() {
  return (
    <figure className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
      <div className="aspect-[3/4] max-h-[min(520px,72vh)] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-slate-900/10 sm:aspect-[4/5]">
        <img
          src={DOCTOR_HERO_SRC}
          alt="Doctor in a clinical setting"
          className="h-full w-full object-cover object-[center_20%]"
          loading="lazy"
          decoding="async"
          width={960}
          height={1200}
        />
      </div>
      <figcaption className="sr-only">MediHub — healthcare for patients and providers</figcaption>
    </figure>
  );
}
