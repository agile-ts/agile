export interface ElementStyleInterface {
  position: { top: number; left: number };
  size: { width: number; height: number };
}

export interface ElementImageInterface {
  src: string;
  id: number;
}

export interface ElementInterface {
  id: string;
  style: ElementStyleInterface;
  image?: ElementImageInterface;
}

export interface CanvasInterface {
  width: number;
  height: number;
}
