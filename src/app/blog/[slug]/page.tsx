import { getPostBySlug } from "@/lib/blog-server";
import { getMdxPostBySlug, mdxPostExists } from "@/lib/blog-mdx";
import logger from "@/lib/logger";
import BlogPostClient from "./client";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/seo/utils";
import { generateBlogPostMetadata } from "@/lib/seo/meta-generator";
import { generateBlogPostSchema, generateBreadcrumbSchema, toJsonLd } from "@/lib/seo/schema";
import { Breadcrumbs } from "@/components/breadcrumbs";

// Explicitly mark this as a dynamic route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
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

    // Use the comprehensive meta generator with dynamic OG images
    return generateBlogPostMetadata(post, {
      generateOGImage: true, // Use dynamic OG image generation
    });
  } catch (error) {
    console.error("Error generating metadata:", error);
    return { title: "Error" };
  }
}

// Main page component
export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
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

    // Generate structured data
    const blogPostSchema = generateBlogPostSchema(post)

    // Generate breadcrumbs
    const breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: 'Blog', url: '/blog' },
      { name: post.title, url: `/blog/${post.slug}` },
    ]

    const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs)

    return (
      <>
        {/* Structured data - Blog Post */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLd(blogPostSchema) }}
        />
        {/* Structured data - Breadcrumbs */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbSchema) }}
        />

        <div className="container mx-auto px-4 max-w-4xl">
          {/* Breadcrumbs */}
          <div className="py-4">
            <Breadcrumbs items={breadcrumbs} />
          </div>

          <BlogPostClient post={post} />
        </div>
      </>
    );
  } catch (error) {
    console.error("Error in BlogPost page:", error);
    notFound();
  }
}
