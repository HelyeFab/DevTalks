import { getPost } from '@/lib/blog'
import { EditPostForm } from './edit-post-form'
import { redirect } from 'next/navigation'

interface Props {
  params: {
    id: string
  }
}

export default async function EditPost({ params }: Props) {
  const post = await getPost(params.id)

  if (!post) {
    redirect('/admin/posts')
  }

  return <EditPostForm post={post} />
}

