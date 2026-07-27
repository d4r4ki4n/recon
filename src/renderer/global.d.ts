declare global {
  interface Window {
    recon: {
      executeRequest: (req: { method: string; url: string; headers: Record<string, string>; body: string | null }) => Promise<any>
      search: (query: string, limit?: number) => Promise<any[]>
      getHistory: (limit?: number) => Promise<any[]>
      getRequest: (id: number) => Promise<any>
    }
  }
}

export {}