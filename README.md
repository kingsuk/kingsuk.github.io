This is a portfolio site for [Kingsuk Majumder](https://kingsuk.github.io).

## Adding a LinkedIn insight

New posts are **not** fetched automatically. Add them to `data/insights.json`, then rebuild:

```bash
npm run build:insights
```

Commit both `data/insights.json` and the updated `index.html`.

### Example entry

Add a new object to the `posts` array in `data/insights.json`:

```json
{
  "id": "my-new-post",
  "datePublished": "2026-07-09",
  "title": "Your post title (shown on the site)",
  "meta": "Topic · Keywords · Shown above title",
  "excerpt": "A short summary for the portfolio card (1–3 sentences).",
  "url": "https://www.linkedin.com/posts/your-post-url",
  "tags": ["Tag One", "Tag Two"],
  "schemaHeadline": "SEO headline for search engines",
  "schemaDescription": "SEO description for structured data.",
  "schemaKeywords": "Comma, Separated, Keywords"
}
```

Posts are sorted by `datePublished` (newest first). The build updates the Insights section and JSON-LD schema in `index.html`.
