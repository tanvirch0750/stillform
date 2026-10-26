import ReferenceDocument from '../components/ReferenceDocument';
import { getReferencePage } from '../lib/reference';

export default async function NotFound() {
  const page = await getReferencePage('/404');
  return page ? <ReferenceDocument page={page} /> : <h1>404 — Page not found</h1>;
}
