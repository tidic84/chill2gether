import * as React from 'react';

import { SlateElement } from 'platejs/static';

export function BlockquoteElementStatic(props) {
  return (<SlateElement as="blockquote" className="my-1 border-l-2 pl-6 italic" {...props} />);
}
