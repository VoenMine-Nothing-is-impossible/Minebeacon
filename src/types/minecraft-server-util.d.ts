// Локальная декларация-заглушка: гарантирует, что `tsc --strict`
// не падает с TS7016, даже если у пакета нет bundled-типов.
declare module "minecraft-server-util" {
  export function status(
    host: string,
    port?: number,
    options?: { timeout?: number }
  ): Promise<{
    players?: { online?: number; max?: number };
    motd?: { clean?: string };
    version?: { name?: string };
  }>;
}
