import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly _title = inject(Title);
  private readonly _meta = inject(Meta);

  setTitle(title: string): void {
    this._title.setTitle(`${title} | Gym Routine Control`);
  }

  updateMetaTags(config: {
    title: string;
    description: string;
    image?: string;
    url?: string;
    type?: string;
  }): void {
    this.setTitle(config.title);

    this._meta.updateTag({ name: 'description', content: config.description });
    this._meta.updateTag({ property: 'og:title', content: config.title });
    this._meta.updateTag({ property: 'og:description', content: config.description });
    this._meta.updateTag({ property: 'og:type', content: config.type ?? 'website' });
    this._meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this._meta.updateTag({ name: 'twitter:title', content: config.title });
    this._meta.updateTag({ name: 'twitter:description', content: config.description });

    if (config.image) {
      this._meta.updateTag({ property: 'og:image', content: config.image });
      this._meta.updateTag({ name: 'twitter:image', content: config.image });
    }

    if (config.url) {
      this._meta.updateTag({ property: 'og:url', content: config.url });
      this._meta.updateTag({ rel: 'canonical', href: config.url });
    }
  }

  setStructuredData(jsonLd: Record<string, unknown>): void {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  }
}
