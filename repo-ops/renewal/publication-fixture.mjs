export const blogIndexPath = 'storage/blog/index.json';
export const notesPath = 'storage/editor/notes.json';
export const firstNoteId = '10000000000000001';
export const secondNoteId = '10000000000000002';
export const replyId = '10000000000000003';

export const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;

export function article(slug, title, publishedAt, text) {
  const summary = `${title} summary`;
  const tags = ['fixture'];
  return {
    projection: { slug, pathname: `blog/${slug}.mdx`, metadata: { title, summary, publishedAt, tags } },
    source: `---\ntitle: "${title}"\nsummary: "${summary}"\npublishedAt: "${publishedAt}"\ntags: ["fixture"]\n---\n${text}\n`,
    path: `storage/blog/${slug}.mdx`,
  };
}

export const firstPost = article('first', 'Fixture First A', '2026-03-01T00:00:00.000Z', 'Fixture article body A.');
export const latePost = article('late', 'Fixture Late A', '2026-02-28T00:00:00.000Z', 'Fixture late body A.');
export const secondPost = article('second', 'Fixture Second B', '2026-03-03T00:00:00.000Z', 'Fixture article body B.');
export const firstNote = {
  id: firstNoteId, createdAt: '2026-03-01T00:00:00.000Z', published: true,
  body: { ja: '最初の記録A', en: 'Fixture first note A' },
};
export const secondNote = {
  id: secondNoteId, createdAt: '2026-03-03T00:00:00.000Z', published: true,
  body: { ja: '公開した記録B', en: 'Fixture second note B' },
};
export const reply = {
  id: replyId, createdAt: '2026-03-03T01:00:00.000Z', published: true,
  body: { ja: '残る返信B', en: 'Fixture published reply B' }, parentId: secondNoteId,
};

export const initialFiles = {
  [blogIndexPath]: serialize([firstPost.projection, latePost.projection]),
  [firstPost.path]: firstPost.source,
  [latePost.path]: latePost.source,
  [notesPath]: serialize([firstNote]),
  'storage/editor/links.json': '[]\n',
  'storage/scraps/index.json': '[]\n',
};
