const SITE_URL = 'https://biliardo.kz'

interface SeoProps {
  title: string
  description: string
  path: string
  keywords?: string
  image?: string
  type?: 'website' | 'article' | 'product'
  noindex?: boolean
}

/**
 * Per-page SEO. Использует нативный рендер метатегов React 19 — теги
 * автоматически поднимаются в <head>. Дубли с index.html перезатираются
 * по правилам React 19 (последний рендер выигрывает).
 */
export function Seo({
  title,
  description,
  path,
  keywords,
  image = `${SITE_URL}/og-image.png`,
  type = 'website',
  noindex,
}: SeoProps) {
  const url = `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={url} />

      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  )
}
