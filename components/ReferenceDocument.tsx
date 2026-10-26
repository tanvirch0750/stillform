import type { ReferencePage } from '../lib/reference';
import RuntimeBootstrap from './RuntimeBootstrap';

export default function ReferenceDocument({ page }: { page: ReferencePage }) {
  return <>
    <div data-reference-document={page.route} style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: page.markup }} />
    <RuntimeBootstrap scripts={page.scripts} />
  </>;
}
