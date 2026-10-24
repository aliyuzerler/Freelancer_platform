'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const KEYS = ['maya', 'david', 'sofia', 'tom'] as const;

export function Testimonials() {
  const t = useTranslations('home.testimonials');
  const [index, setIndex] = useState(0);
  const count = KEYS.length;

  const go = (dir: number) => setIndex((i) => (i + dir + count) % count);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearInterval(id);
  }, [count]);

  const key = KEYS[index]!;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative rounded-2xl border border-navy-700/50 bg-navy-850/60 p-8 shadow-float sm:p-10">
        <Quote className="absolute right-8 top-8 size-10 text-navy-700" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="size-5 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <blockquote className="mt-5 text-lg font-medium leading-relaxed text-white sm:text-xl">
          “{t(`${key}.quote`)}”
        </blockquote>
        <div className="mt-6 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white">
            {t(`${key}.initials`)}
          </div>
          <div>
            <p className="font-semibold text-white">{t(`${key}.name`)}</p>
            <p className="text-sm text-navy-300">{t(`${key}.role`)}</p>
          </div>
          <span className="ml-auto hidden rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-300 sm:block">
            {t(`${key}.metric`)}
          </span>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          onClick={() => go(-1)}
          aria-label={t('previous')}
          className="grid size-9 place-items-center rounded-full border border-navy-700 text-navy-300 transition-colors hover:border-primary hover:text-white"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="flex gap-2">
          {KEYS.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={t('goTo', { n: i + 1 })}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-6 bg-primary' : 'w-2 bg-navy-600 hover:bg-navy-500'
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => go(1)}
          aria-label={t('next')}
          className="grid size-9 place-items-center rounded-full border border-navy-700 text-navy-300 transition-colors hover:border-primary hover:text-white"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
