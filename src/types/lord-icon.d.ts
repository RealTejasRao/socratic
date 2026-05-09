import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "lord-icon": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        trigger?: string;
        delay?: string;
        stroke?: string;
        state?: string;
        colors?: string;
      };
    }
  }
}

export {};

