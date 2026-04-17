export interface PostListItem {
  title: string;
  slug: string;
  date: string;
  lastmod: string;
  draft: boolean;
  description: string;
}

export interface PostInput {
  title: string;
  slug?: string;
  date: string;
  draft: boolean;
  description: string;
  tags: string[];
  categories: string[];
  cover?: string;
  body: string;
}

export interface PostDetail extends PostInput {
  slug: string;
  lastmod?: string;
  sha: string;
}
