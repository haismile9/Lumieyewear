import { notFound } from 'next/navigation';

async function getPage(handle: string) {
  try {
    const response = await fetch(`http://127.0.0.1:5002/api/pages/${handle}`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching page:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { handle: string } }) {
  const page = await getPage(params.handle);

  if (!page) {
    return {
      title: 'Page Not Found',
    };
  }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || page.content.substring(0, 155),
  };
}

export default async function PageDetail({ params }: { params: { handle: string } }) {
  const page = await getPage(params.handle);

  if (!page || page.status !== 'published') {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <article className="prose prose-lg max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">{page.title}</h1>
        
        {page.publishedAt && (
          <p className="text-sm text-muted-foreground mb-8">
            Cập nhật: {new Date(page.publishedAt).toLocaleDateString('vi-VN')}
          </p>
        )}

        <div 
          className="prose-headings:font-bold prose-a:text-primary prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </article>
    </div>
  );
}
