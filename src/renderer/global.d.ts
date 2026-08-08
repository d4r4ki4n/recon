declare global {
  interface Window {
    recon: {
      executeRequest: (req: { method: string; url: string; headers: Record<string, string>; body: string | null; collectionId?: number | null; name?: string; env?: { name: string; variables: Record<string, string> } | null }) => Promise<any>
      search: (query: string, limit?: number) => Promise<any[]>
      getHistory: (limit?: number) => Promise<any[]>
      getRequest: (id: number) => Promise<any>
      saveRequest: (req: { method: string; url: string; headers: Record<string, string>; body: string | null; collectionId: number | null; name: string }) => Promise<any>
      renameRequest: (id: number, name: string) => Promise<any>
      moveRequest: (requestId: number, collectionId: number | null) => Promise<any>
      deleteRequest: (id: number) => Promise<void>
      createCollection: (name: string) => Promise<any>
      getCollections: () => Promise<any[]>
      deleteCollection: (id: number) => Promise<void>
      getCollectionRequests: (collectionId: number) => Promise<any[]>
      createEnvironment: (name: string, variables: Record<string, string>) => Promise<any>
      getEnvironments: () => Promise<any[]>
      updateEnvironment: (id: number, name: string, variables: Record<string, string>) => Promise<any>
      deleteEnvironment: (id: number) => Promise<void>
      importPostman: (json: string) => Promise<any>
      exportCollectionHttp: (collectionId: number) => Promise<string>
      importHttp: (content: string, collectionName?: string) => Promise<any>
    }
  }
}

export {}