const FEED_URL = 'https://aurorasystems.substack.com/feed';

function decodeEntities(value = '') {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8212;/g, '-')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8203;/g, '');
}

function getTag(item, tagName) {
  const escapedTag = tagName.replace(':', '\\:');
  const match = item.match(new RegExp(`<${escapedTag}[^>]*>([\\s\\S]*?)<\\/${escapedTag}>`, 'i'));
  return match ? decodeEntities(match[1]).trim() : '';
}

function stripHtml(value = '') {
  return decodeEntities(value)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getEnclosureImage(item) {
  const enclosure = item.match(/<enclosure[^>]*url="([^"]+)"/i);
  return enclosure ? decodeEntities(enclosure[1]) : '';
}

function getContentImage(content) {
  const image = content.match(/<img[^>]*src="([^"]+)"/i);
  return image ? decodeEntities(image[1]) : '';
}

function getExcerpt(description, content) {
  const text = stripHtml(description || content);
  if (text.length <= 180) return text;
  return `${text.slice(0, 177).trim()}...`;
}

function getCategory(title, excerpt, content) {
  const haystack = `${title} ${excerpt} ${stripHtml(content)}`.toLowerCase();

  if (/\b(ai|artificial intelligence|automation|agent|machine learning|llm)\b/.test(haystack)) {
    return { category: 'ai', categoryLabel: 'AI & Product' };
  }

  if (/\b(design|ux|ui|interface|user experience|brand)\b/.test(haystack)) {
    return { category: 'design', categoryLabel: 'Design' };
  }

  if (/\b(engineering|architecture|developer|code|technical|seo|website|software)\b/.test(haystack)) {
    return { category: 'engineering', categoryLabel: 'Engineering' };
  }

  if (/\b(africa|zimbabwe|market|digital adoption|local)\b/.test(haystack)) {
    return { category: 'africa', categoryLabel: 'Africa & Markets' };
  }

  return { category: 'founder', categoryLabel: 'Founder Playbook' };
}

function estimateReadTime(content) {
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 220))} min read`;
}

function parseFeed(xml) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .map(([, item]) => {
      const title = getTag(item, 'title');
      const link = getTag(item, 'link');
      const description = getTag(item, 'description');
      const content = getTag(item, 'content:encoded');
      const excerpt = getExcerpt(description, content);
      const publishedAt = getTag(item, 'pubDate');
      const date = publishedAt
        ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(publishedAt))
        : '';
      const { category, categoryLabel } = getCategory(title, excerpt, content);

      return {
        title,
        link,
        excerpt,
        date,
        readTime: estimateReadTime(content || description),
        category,
        categoryLabel,
        image: getEnclosureImage(item) || getContentImage(content),
      };
    })
    .filter((post) => post.title && post.link);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(FEED_URL, {
      headers: {
        Accept: 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8',
        'User-Agent': 'Aurora Systems website (+https://aurorasystems.co.zw)',
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Could not load Substack posts.' });
    }

    const xml = await response.text();
    const posts = parseFeed(xml);

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');
    return res.status(200).json({ posts });
  } catch (error) {
    console.error('Substack feed failed:', error);
    return res.status(502).json({ error: 'Could not load Substack posts.' });
  }
};
