import { getPost } from '@/lib/blog'
import { EditPostForm } from './edit-post-form'
import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function EditPost({ params }: Props) {
  const { id } = await params
  const post = await getPost(id)

  if (!post) {
    redirect('/admin/posts')
  }

  return <EditPostForm post={post} />
}
