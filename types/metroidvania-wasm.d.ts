declare module '../pkg/metroidvania_wasm.js' {
  export default function init(): Promise<void>;

  export class GameWrapper {
    constructor();
    update(): void;
    render(ctx: CanvasRenderingContext2D): void;
    handle_key_down(key: string): void;
    handle_key_up(key: string): void;
  }
}
