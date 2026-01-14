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

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const page = await getPage(handle);

  if (!page) {
    return {
      title: 'Page Not Found',
    };
  }

  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.bodySummary || page.body?.substring(0, 155) || '',
  };
}

export default async function PageDetail({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const page = await getPage(handle);

  if (!page || page.status !== 'PUBLISHED') {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <article className="prose prose-lg max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">{page.title}</h1>
        
        {page.updatedAt && (
          <p className="text-sm text-muted-foreground mb-8">
            Cập nhật: {new Date(page.updatedAt).toLocaleDateString('vi-VN')}
          </p>
        )}

        <div 
          className="prose-headings:font-bold prose-a:text-primary prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: page.body }}
        />
      </article>
    </div>
  );
}
