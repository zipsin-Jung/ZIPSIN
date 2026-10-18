import type {MetadataRoute} from 'next';

export const dynamic = 'force-static';

export default function sitemap():MetadataRoute.Sitemap {
  return [{url:'https://zipsin.net',changeFrequency:'weekly',priority:1},{url:'https://ck.zipsin.net/',changeFrequency:'monthly',priority:.9}];
}
