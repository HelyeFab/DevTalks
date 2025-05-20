import { getPostBySlug } from "@/lib/blog";
import { getMdxPostBySlug, mdxPostExists } from "@/lib/blog-mdx";
import logger from "@/lib/logger";
import BlogPostClient from "./client";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

// Explicitly mark this as a dynamic route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  if (!slug) {
    return {
      title: "Post Not Found",
    };
  }

  try {
    // First try to get the post from MDX content
    let post = null;

    // Check if an MDX file exists for this slug
    if (await mdxPostExists(slug)) {
      post = await getMdxPostBySlug(slug);
      logger.info("Post found in MDX content", { slug });
    }

    // If not found in MDX, try to get from Firestore
    if (!post) {
      post = await getPostBySlug(slug);
      logger.info("Post found in Firestore", { slug });
    }

    if (!post) {
      logger.warn("Post not found for metadata:", { slug });
      return { title: "Post Not Found" };
    }

    return {
      title: post.title,
      description: post.excerpt,
      openGraph: {
        title: post.title,
        description: post.excerpt,
        images: post.image ? [post.image] : [],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return { title: "Error" };
  }
}

// Main page component
export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  if (!slug) {
    console.warn("No slug provided in params");
    notFound();
  }

  try {
    // First try to get the post from MDX content
    let post = null;

    // Check if an MDX file exists for this slug
    if (await mdxPostExists(slug)) {
      post = await getMdxPostBySlug(slug);
      logger.info("Post found in MDX content", { slug });
    }

    // If not found in MDX, try to get from Firestore
    if (!post) {
      post = await getPostBySlug(slug);
      logger.info("Post found in Firestore", { slug });
    }

    if (!post) {
      logger.error("Post not found for slug:", { slug });
      notFound();
    }

    console.log("Post fetched successfully:", {
      slug: post.slug,
      hasImage: !!post.image,
    });

    return <BlogPostClient post={post} />;
  } catch (error) {
    console.error("Error in BlogPost page:", error);
    notFound();
  }
}
