import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ReferenceDocument from '../../components/ReferenceDocument';
import { getReferencePage, referenceRoutes } from '../../lib/reference';

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return referenceRoutes.map((route) => ({ slug: route === '/' ? [] : route.slice(1).split('/') }));
}

async function loadPage(params: PageProps['params']) {
  const { slug } = await params;
  const page = await getReferencePage(slug?.length ? `/${slug.join('/')}` : '/');
  if (!page) notFound();
  return page;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await loadPage(params);
  return { title: page.title, description: page.description };
}

export default async function StorefrontPage({ params }: PageProps) {
  return <ReferenceDocument page={await loadPage(params)} />;
}
