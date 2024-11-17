import { getPostBySlug } from "@/lib/blog";
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
  const slug = params.slug;
  if (!slug) {
    return {
      title: "Post Not Found",
    };
  }

  try {
    const post = await getPostBySlug(slug);

    if (!post) {
      console.log("Post not found for metadata:", slug);
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
  const slug = params.slug;
  if (!slug) {
    console.warn("No slug provided in params");
    notFound();
  }

  try {
    const post = await getPostBySlug(slug);

    if (!post) {
      console.error("Post not found for slug:", slug);
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
