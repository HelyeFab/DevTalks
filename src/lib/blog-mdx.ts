import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { serializeMDX } from './mdx';
import type { BlogPost, Author } from '@/types/blog';
import { calculateReadTime } from '@/utils/read-time';

const MDX_CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'blog');

/**
 * Check if a given slug exists as an MDX file
 */
export async function mdxPostExists(slug: string): Promise<boolean> {
  try {
    const filePath = path.join(MDX_CONTENT_DIR, `${slug}.mdx`);
    return fs.existsSync(filePath);
  } catch (error) {
    console.error('Error checking MDX file existence:', error);
    return false;
  }
}

/**
 * Get a blog post by slug from MDX files
 */
export async function getMdxPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const filePath = path.join(MDX_CONTENT_DIR, `${slug}.mdx`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    const mdxSource = await serializeMDX(content);

    const author: Author = {
      name: data.author?.name || 'Anonymous',
      email: data.author?.email || '',
      image: data.author?.image || undefined,
    };

    const blogPost: BlogPost = {
      id: slug,
      title: data.title || '',
      subtitle: data.subtitle || '',
      content: mdxSource.compiledSource,
      excerpt: data.excerpt || '',
      image: data.image || undefined,
      imageAlt: data.imageAlt || undefined,
      tags: Array.isArray(data.tags) ? data.tags : [],
      author,
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      slug: slug,
      published: true,
      publishedAt: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      upvotes: 0,
      readTime: calculateReadTime(content)
    };

    return blogPost;
  } catch (error) {
    console.error(`Error reading MDX file for slug "${slug}":`, error);
    return null;
  }
}

/**
 * Get all blog posts from MDX files
 */
export async function getAllMdxPosts(): Promise<BlogPost[]> {
  try {
    // Ensure the directory exists
    if (!fs.existsSync(MDX_CONTENT_DIR)) {
      console.warn(`MDX content directory does not exist: ${MDX_CONTENT_DIR}`);
      return [];
    }

    // Get all MDX files
    const fileNames = fs.readdirSync(MDX_CONTENT_DIR)
      .filter(fileName => fileName.endsWith('.mdx'));

    // Process each file
    const posts = await Promise.all(
      fileNames.map(async (fileName) => {
        const slug = fileName.replace(/\.mdx$/, '');
        const post = await getMdxPostBySlug(slug);
        return post;
      })
    );

    // Filter out null results and sort by date
    return posts
      .filter((post): post is BlogPost => post !== null)
      .sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  } catch (error) {
    console.error('Error reading MDX blog posts:', error);
    return [];
  }
}
