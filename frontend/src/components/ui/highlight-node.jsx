'use client';;
import * as React from 'react';

import { PlateLeaf } from 'platejs/react';

export function HighlightLeaf(props) {
  return (
    <PlateLeaf {...props} as="mark" className="bg-highlight/30 text-inherit">
      {props.children}
    </PlateLeaf>
  );
}
