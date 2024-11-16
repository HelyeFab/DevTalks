// import { getPostBySlug } from '@/lib/blog'
// import BlogPostClient from './client'
// import { notFound } from 'next/navigation'
// import type { Metadata } from 'next'

// // Explicitly mark this as a dynamic route
// export const dynamic = 'force-dynamic'
// export const revalidate = 0

// // Generate metadata for the page
// export async function generateMetadata({
//   params,
// }: {
//   params: { slug: string }
// }): Promise<Metadata> {
//   if (!params?.slug) {
//     return {
//       title: 'Post Not Found',
//     }
//   }

//   try {
//     const post = await getPostBySlug(params.slug)
//     if (!post) {
//       console.log('Post not found for metadata:', params.slug)
//       return { title: 'Post Not Found' }
//     }

//     return {
//       title: post.title,
//       description: post.excerpt,
//       openGraph: {
//         title: post.title,
//         description: post.excerpt,
//         images: post.image ? [post.image] : [],
//       },
//     }
//   } catch (error) {
//     console.error('Error generating metadata:', error)
//     return { title: 'Error' }
//   }
// }

// // Main page component
// export default async function BlogPost({
//   params,
// }: {
//   params: { slug: string }
// }) {
//   if (!params?.slug) {
//     notFound()
//   }

//   try {
//     console.log('Processing blog post:', params.slug)

//     const post = await getPostBySlug(params.slug)
//     if (!post) {
//       console.error('Post not found:', params.slug)
//       notFound()
//     }

//     console.log('Post fetched successfully:', { 
//       slug: post.slug,
//       hasImage: !!post.image 
//     })

//     return <BlogPostClient post={post} />
//   } catch (error) {
//     console.error('Error fetching post:', error)
//     throw error
//   }
// }

import { getPostBySlug } from "@/lib/blog";
import BlogPostClient from "./client";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

// Explicitly mark this as a dynamic route
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    if (!params?.slug) {
      return {
        title: "Post Not Found",
      };
    }

    const post = await getPostBySlug(params.slug);

    if (!post) {
      console.log("Post not found for metadata:", params.slug);
      return {
        title: "Post Not Found",
      };
    }

    return {
      title: post.title,
      description: post.excerpt || "",
      openGraph: {
        title: post.title,
        description: post.excerpt || "",
        images: post.image ? [post.image] : [],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Error",
    };
  }
}

// Main page component
export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  try {
    if (!params?.slug) {
      console.warn("No slug provided in params");
      notFound();
    }

    const post = await getPostBySlug(params.slug);

    if (!post) {
      console.error("Post not found for slug:", params.slug);
      notFound();
    }

    console.log("Post fetched successfully:", {
      slug: post.slug,
      hasImage: !!post.image,
    });

    return <BlogPostClient post={post} />;
  } catch (error) {
    console.error("Error fetching post:", error);

    // Optional: Display an error fallback page or component
    return notFound();
  }
}

