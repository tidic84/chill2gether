import * as React from 'react';

import { SlateElement } from 'platejs/static';

import { cn } from '@/lib/utils';

export function ParagraphElementStatic(props) {
  return (
    <SlateElement {...props} className={cn('m-0 px-0 py-1')}>
      {props.children}
    </SlateElement>
  );
}
