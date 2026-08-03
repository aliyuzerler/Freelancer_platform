'use client';

import { useEffect, useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  initials: string;
  metric: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "I moved my whole client base off Upwork. On my last $6k project I kept every cent — that's an extra $1,200 that used to just vanish into fees.",
    name: 'Maya Chen',
    role: 'Freelance Product Designer',
    initials: 'MC',
    metric: '+$14k kept in 2025',
  },
  {
    quote:
      'The matching is genuinely better. I posted a role at 9am and had three strong, relevant proposals by lunch — not fifty copy-paste ones.',
    name: 'David Okafor',
    role: 'Founder, Northwind Labs',
    initials: 'DO',
    metric: 'Hired in 6 hours',
  },
  {
    quote:
      'Paying my developer directly through my own Stripe felt weird at first. Now it feels obvious. No middleman holding my money hostage.',
    name: 'Sofia Ramirez',
    role: 'Marketing Agency Owner',
    initials: 'SR',
    metric: '9 contracts, $0 fees',
  },
  {
    quote:
      'Clean, fast, and it respects my time. It feels like Linear built a freelance platform. My clients take me more seriously here.',
    name: 'Tom Bjørn',
    role: 'Full-Stack Engineer',
    initials: 'TB',
    metric: '4.9★ over 50 jobs',
  },
];

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const count = TESTIMONIALS.length;

  const go = (dir: number) => setIndex((i) => (i + dir + count) % count);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearInterval(id);
  }, [count]);

  const t = TESTIMONIALS[index]!;

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
          “{t.quote}”
        </blockquote>
        <div className="mt-6 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white">
            {t.initials}
          </div>
          <div>
            <p className="font-semibold text-white">{t.name}</p>
            <p className="text-sm text-navy-300">{t.role}</p>
          </div>
          <span className="ml-auto hidden rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-300 sm:block">
            {t.metric}
          </span>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          onClick={() => go(-1)}
          aria-label="Previous testimonial"
          className="grid size-9 place-items-center rounded-full border border-navy-700 text-navy-300 transition-colors hover:border-primary hover:text-white"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="flex gap-2">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-6 bg-primary' : 'w-2 bg-navy-600 hover:bg-navy-500'
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => go(1)}
          aria-label="Next testimonial"
          className="grid size-9 place-items-center rounded-full border border-navy-700 text-navy-300 transition-colors hover:border-primary hover:text-white"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
