import { use } from 'react'
import { getPost } from '@/lib/blog'
import { EditPostForm } from './edit-post-form'
import { redirect } from 'next/navigation'

interface Props {
  params: {
    id: string
  }
}

export default async function EditPost() {
  const params = use('params')
  const id = params.id
  const post = await getPost(id)

  if (!post) {
    redirect('/admin/posts')
  }

  return <EditPostForm post={post} />
}
