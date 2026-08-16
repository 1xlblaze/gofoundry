/** Human-readable lesson metadata labels with correct pluralization. */
export function pluralCount(count: number, singular: string, plural?: string): string {
  const word = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${count} ${word}`;
}

export function formatLessonSections(count: number): string {
  return pluralCount(count, "section");
}

export function formatLessonDiagrams(count: number): string | null {
  if (count <= 0) return null;
  return pluralCount(count, "diagram");
}

export function formatLessonCheckpoints(count: number): string | null {
  if (count <= 0) return null;
  return pluralCount(count, "checkpoint");
}

export function formatLessonCodeBlocks(count: number): string | null {
  if (count <= 0) return null;
  return pluralCount(count, "code block");
}

export type PrerequisiteLink = {
  key: string;
  title: string;
  href?: string;
};

/** Map prerequisite refs to lesson links when the slug exists; otherwise show plain text. */
export function resolvePrerequisiteLinks(
  refs: string[] | undefined,
  getLessonBySlug: (slug: string) => { title: string } | undefined,
): PrerequisiteLink[] {
  if (!refs?.length) return [];
  return refs.map((ref) => {
    const lesson = getLessonBySlug(ref);
    if (lesson) {
      return { key: ref, title: lesson.title, href: `/lesson/${ref}` };
    }
    return { key: ref, title: ref };
  });
}
