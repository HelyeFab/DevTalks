import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '')       // Trim - from end of text
}

export async function generateSlug(title: string, collectionName: string): Promise<string> {
  let slug = slugify(title)
  let isUnique = false
  let counter = 0

  while (!isUnique) {
    const currentSlug = counter === 0 ? slug : `${slug}-${counter}`
    
    // Check if slug exists in the collection
    const q = query(
      collection(db, collectionName),
      where('slug', '==', currentSlug)
    )
    
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      slug = currentSlug
      isUnique = true
    } else {
      counter++
    }
  }

  return slug
}
